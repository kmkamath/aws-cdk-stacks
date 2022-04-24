import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib'
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager'
import {
  CloudFrontAllowedMethods,
  CloudFrontWebDistribution,
  IDistribution,
  OriginAccessIdentity,
  ViewerCertificate,
} from 'aws-cdk-lib/aws-cloudfront'
import { CanonicalUserPrincipal, PolicyStatement } from 'aws-cdk-lib/aws-iam'
import { ARecord, HostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53'
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets'
import { BlockPublicAccess, Bucket, IBucket } from 'aws-cdk-lib/aws-s3'
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment'
import { Construct } from 'constructs'
import { Environments, StaticSiteConfigs } from '../types'

export interface StaticSiteStackProps extends StackProps {
  tags: {
    app: string
    env: Environments
  }
  appCfg: StaticSiteConfigs
}

export class StaticSiteStack extends Stack {
  private readonly siteBucket: IBucket
  private readonly distribution: IDistribution

  constructor(scope: Construct, id: string, props: StaticSiteStackProps) {
    super(scope, id, props)

    // Get Env
    const { env } = props.tags

    // Environment specific app configs
    const { subdomain, domainCert, isDestroyable } = props.appCfg.environments[env]

    // App configs
    const { parentDomain, source } = props.appCfg

    // Constants
    const domainName = env == 'Production' ? parentDomain : `${subdomain}.${parentDomain}`
    const oai = new OriginAccessIdentity(this, 'cloudfront-OAI')

    // Content bucket
    this.siteBucket = new Bucket(this, 'SiteBucket', {
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'error.html',
      publicReadAccess: false,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: isDestroyable ? RemovalPolicy.DESTROY : RemovalPolicy.RETAIN,
      autoDeleteObjects: isDestroyable,
    })

    // Grant access to cloudfront
    this.siteBucket.addToResourcePolicy(
      new PolicyStatement({
        actions: ['s3:GetObject'],
        resources: [this.siteBucket.arnForObjects('*')],
        principals: [new CanonicalUserPrincipal(oai.cloudFrontOriginAccessIdentityS3CanonicalUserId)],
      }),
    )

    // CloudFront distribution
    this.distribution = new CloudFrontWebDistribution(this, 'SiteDistribution', {
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: this.siteBucket,
            originAccessIdentity: oai,
          },
          behaviors: [
            {
              isDefaultBehavior: true,
              compress: true,
              allowedMethods: CloudFrontAllowedMethods.GET_HEAD_OPTIONS,
            },
          ],
        },
      ],
      viewerCertificate: ViewerCertificate.fromAcmCertificate(
        Certificate.fromCertificateArn(this, 'DomainCert', domainCert),
        {
          aliases: [domainName],
        },
      ),
    })

    // Route53 alias record for the CloudFront distribution
    new ARecord(this, 'SiteAliasRecord', {
      recordName: domainName,
      target: RecordTarget.fromAlias(new CloudFrontTarget(this.distribution)),
      zone: HostedZone.fromLookup(this, 'Zone', { domainName }),
    })

    // Deploy site contents to S3 bucket
    new BucketDeployment(this, 'DeployWithInvalidation', {
      sources: [Source.asset(source)],
      destinationBucket: this.siteBucket,
      distribution: this.distribution,
      distributionPaths: ['/*'],
    })
  }
}
