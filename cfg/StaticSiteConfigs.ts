import { StaticSiteConfigs } from '../types'

export const staticSiteConfigs: StaticSiteConfigs = {
  parentDomain: 'prywesee.com',
  source: '../app/',
  environments: {
    Development: {
      subdomain: 'dev',
      domainCert: 'arn:aws:acm:us-east-1:123456789:certificate/abcd', //SCRUB
      isDestroyable: true,
    },
    Production: {
      subdomain: '',
      domainCert: 'arn:aws:acm:us-east-1:987654321:certificate/efgh', //SCRUB
      isDestroyable: false,
    },
  },
}
