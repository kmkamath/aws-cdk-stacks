#!/usr/bin/env node
import { App } from 'aws-cdk-lib'
import { configs } from '../cfg/configs'
import { AccessManagementStack } from '../lib/AccessManagementStack'
import { DomainManagementStack } from '../lib/DomainManagementStack'
import { StaticSiteStack } from '../lib/StaticSiteStack'
import { UserManagementStack } from '../lib/UserManagementStack'
import {
  AccessManagementConfigs,
  DomainManagementConfigs,
  Environments,
  UserManagementConfigs,
  StaticSiteConfigs,
} from '../types'

const app = new App()

const appEnv: Environments = (process.env?.ENV as Environments) ?? 'Development'
const envs = configs['Environments']

const env = {
  account: envs[appEnv].account,
  region: envs[appEnv].region,
}
const tags = {
  app: configs.name,
  env: appEnv,
}

if (!(appEnv in envs)) throw 'Environment not configured'

if ('AccessManagement' in configs['Stacks']) {
  const accessManagementCfg: AccessManagementConfigs = configs['Stacks']['AccessManagement'] as AccessManagementConfigs
  new AccessManagementStack(app, 'AccessManagement', { env, tags, envs, appCfg: accessManagementCfg })
}

if ('DomainManagement' in configs['Stacks']) {
  const domainManagementCfg: DomainManagementConfigs = configs['Stacks']['DomainManagement'] as DomainManagementConfigs
  new DomainManagementStack(app, 'DomainManagement', { env, tags, envs, appCfg: domainManagementCfg })
}

if ('UserManagement' in configs['Stacks']) {
  const userManagementCfg: UserManagementConfigs = configs['Stacks']['UserManagement'] as UserManagementConfigs
  new UserManagementStack(app, 'UserManagement', { env, tags, appCfg: userManagementCfg })
}

if ('StaticSite' in configs['Stacks']) {
  const staticSiteCfg: StaticSiteConfigs = configs['Stacks']['StaticSite'] as StaticSiteConfigs
  new StaticSiteStack(app, 'StaticSite', { env, tags, appCfg: staticSiteCfg })
}
