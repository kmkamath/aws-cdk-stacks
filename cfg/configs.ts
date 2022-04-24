import { accessManagementConfigs } from './AccessManagementConfigs'
import { domainManagementConfigs } from './DomainManagementConfigs'
import { userManagementConfigs } from './UserManagementConfigs'
import { developmentConfigs, productionConfigs } from './EnvironmentConfigs'
import { staticSiteConfigs } from './StaticSiteConfigs'
import { Configs } from '../types'

// Application AWS Configs
export const configs: Configs = {
  name: 'PryWeSee',
  Environments: {
    Development: developmentConfigs,
    Production: productionConfigs,
  },
  Stacks: {
    AccessManagement: accessManagementConfigs,
    DomainManagement: domainManagementConfigs,
    UserManagement: userManagementConfigs,
    StaticSite: staticSiteConfigs,
  },
}
