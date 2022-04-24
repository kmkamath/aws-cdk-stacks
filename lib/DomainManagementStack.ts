import { DomainName, HttpApi, IDomainName, IHttpApi } from '@aws-cdk/aws-apigatewayv2-alpha'
import { Stack, StackProps } from 'aws-cdk-lib'
import { Certificate, CertificateValidation, ICertificate } from 'aws-cdk-lib/aws-certificatemanager'
import { IDistribution } from 'aws-cdk-lib/aws-cloudfront'
import { OrganizationPrincipal, Role } from 'aws-cdk-lib/aws-iam'
import {
  ARecord,
  CnameRecord,
  CrossAccountZoneDelegationRecord,
  IHostedZone,
  MxRecord,
  PublicHostedZone,
  RecordTarget,
  TxtRecord,
} from 'aws-cdk-lib/aws-route53'
import { ApiGatewayv2DomainProperties } from 'aws-cdk-lib/aws-route53-targets'
import { Construct } from 'constructs'
import { DomainManagementConfigs, EnvironmentConfigs, Environments } from '../types'

export interface DomainManagementStackProps extends StackProps {
  tags: {
    app: string
    env: Environments
  }
  envs: {
    [env in Environments]: EnvironmentConfigs
  }
  appCfg: DomainManagementConfigs
}

export class DomainManagementStack extends Stack {
  private readonly hostedZone: IHostedZone
  private readonly certificate: ICertificate
  private readonly apiGateway: IHttpApi
  private readonly cloudFront: IDistribution

  constructor(scope: Construct, id: string, props: DomainManagementStackProps) {
    super(scope, id, props)

    // Get Env
    const { env } = props.tags

    // Environment specific app configs
    const { subdomain, txtRecords, cnameRecords, aRecords } = props.appCfg.environments[env]

    // App configs
    const { parentDomain, organizationId, mxRecord, spfRecord } = props.appCfg

    // Constants
    const domainName = env == 'Production' ? parentDomain : `${subdomain}.${parentDomain}`
    const apiDomainName = `api.${domainName}`
    const CROSS_ACCOUNT_ZONE_DELEGATION_ROLE_NAME = 'ProductionZoneDelegationRole'

    // Create public hosted zone
    if (env == 'Production') {
      // Create Zone for parent domain in production env with delegation role for all accounts in organization
      this.hostedZone = new PublicHostedZone(this, 'HostedZone', {
        zoneName: domainName,
        crossAccountZoneDelegationPrincipal: new OrganizationPrincipal(organizationId),
        crossAccountZoneDelegationRoleName: CROSS_ACCOUNT_ZONE_DELEGATION_ROLE_NAME,
      })
    } else if (subdomain) {
      // Create Zone for sub domain
      this.hostedZone = new PublicHostedZone(this, 'HostedZone', {
        zoneName: domainName,
      })
      // Insert the NS record for subdomain into parent hosted zone
      new CrossAccountZoneDelegationRecord(this, 'DelegateNSRecord', {
        delegatedZone: this.hostedZone,
        parentHostedZoneName: parentDomain,
        delegationRole: Role.fromRoleArn(
          this,
          'DelegationRole',
          `arn:aws:iam::${props.envs['Production'].account}:role/${CROSS_ACCOUNT_ZONE_DELEGATION_ROLE_NAME}`,
        ),
      })
    } else throw 'Check domainManagementConfigs'

    // Create acm certificate
    this.certificate = new Certificate(this, 'Certificate', {
      domainName: domainName,
      subjectAlternativeNames: [`*.${domainName}`],
      validation: CertificateValidation.fromDns(this.hostedZone),
    })

    // Insert the MX record
    if (mxRecord) {
      new MxRecord(this, 'MXRecord', {
        zone: this.hostedZone,
        values: mxRecord.values,
        ...(mxRecord?.recordName ? { recordName: mxRecord.recordName } : {}),
      })
    }
    // Insert the SPF record
    if (spfRecord) {
      new TxtRecord(this, `SpfRecord`, {
        zone: this.hostedZone,
        values: spfRecord.values,
        ...(spfRecord?.recordName ? { recordName: spfRecord.recordName } : {}),
      })
    }
    // Insert the TXT records
    if (txtRecords) {
      txtRecords.forEach((v, i) => {
        new TxtRecord(this, `TxtRecord${i}`, {
          zone: this.hostedZone,
          values: v.values,
          ...(v?.recordName ? { recordName: v.recordName } : {}),
        })
      })
    }
    // Insert the CNAME records
    if (cnameRecords) {
      cnameRecords.forEach((v, i) => {
        new CnameRecord(this, `CnameRecord${i}`, {
          zone: this.hostedZone,
          domainName: v.value,
          ...(v?.recordName ? { recordName: v.recordName } : {}),
        })
      })
    }
    // Insert the A records
    const getTarget = (t: string, v: string[]): RecordTarget => {
      if (t == 'IpAddress') return RecordTarget.fromIpAddresses(...v)
      else return RecordTarget.fromValues(...v)
    }
    if (aRecords) {
      aRecords.forEach((v, i) => {
        new ARecord(this, `ARecord${i}`, {
          zone: this.hostedZone,
          target: getTarget(v.type, v.values),
          ...(v?.recordName ? { recordName: v.recordName } : {}),
        })
      })
    }

    // Add an empty API Gateway for backend services
    const apiDomain: IDomainName = new DomainName(this, 'ApiDomain', {
      domainName: apiDomainName,
      certificate: this.certificate,
    })
    this.apiGateway = new HttpApi(this, 'HttpApi', {
      defaultDomainMapping: {
        domainName: apiDomain,
      },
    })
    // Route53 alias record for the CloudFront distribution
    new ARecord(this, 'SiteAliasRecord', {
      recordName: apiDomainName,
      target: RecordTarget.fromAlias(
        new ApiGatewayv2DomainProperties(apiDomain.regionalDomainName, apiDomain.regionalHostedZoneId),
      ),
      zone: this.hostedZone,
    })

    // Add an empty CloudFront Distribution for frontend apps to attach to - not possible
  }
}
