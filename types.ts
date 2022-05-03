import { Attribute } from "aws-cdk-lib/aws-dynamodb"
import { HttpMethod } from "aws-cdk-lib/aws-events"
import { MxRecordValue } from "aws-cdk-lib/aws-route53"

// Stacks and Environments Supported
export type Environments = 'Development' | 'Production'
export type Stacks = 'AccessManagement' | 'DomainManagement' | 'UserManagement' | 'StaticSite'

// Environment Configuration Interface
export type EnvironmentConfigs = {
  account: string,
  region: string,
}

// AccessManagement Configuration Interface
export interface AccessManagementConfigs {
  userNames: string[],
  initialPassword: string,
  cdkUserAssumeRoleResources: string[]
  consoleUserAssumeRoleResources: string[]
  consolePolicyAllowActions: string[],
}

// DomainManagement Configuration Interface
export interface DomainManagementConfigs {
  parentDomain: string,
  organizationId: string,
  mxRecord?: {recordName?: string, values: MxRecordValue[] },
  spfRecord?: {recordName?: string, values: string[] },
  environments: {
    [env in Environments]: {
      subdomain: string,
      txtRecords?: {recordName?: string, values: string[] }[],
      cnameRecords?: {recordName?: string, value: string }[],
      aRecords?: {recordName?: string, type: string, values: string[] }[],
    }
  },
}

// UserManagement Configuration Interface
export interface UserManagementConfigs {
  parentDomain: string,
  userAttributes: {
    standard: string[],
    custom: string[],
  }
  routes: {
    path: string,
    method: HttpMethod,
    handlerFnFile: string,
    handlerFnName: string,
    isAuthorize: boolean,
  }[],
  environments: { 
    [env in Environments]: {
      subdomain: string,
      httpApiId: string,
      isDestroyable: boolean,
    }
  },
}

// StaticSite Configuration Interface
export interface StaticSiteConfigs {
  parentDomain: string,
  source: string,
  environments: { 
    [env in Environments]: {
      subdomain: string,
      domainCert: string,
      isDestroyable: boolean,
    }
  },
}

// Configuration Interface
export interface Configs {
  name: string,
  Environments: { 
    [env in Environments]: EnvironmentConfigs
  },
  Stacks: {
    [stack in Stacks]: AccessManagementConfigs | DomainManagementConfigs | UserManagementConfigs | StaticSiteConfigs
  },
}
