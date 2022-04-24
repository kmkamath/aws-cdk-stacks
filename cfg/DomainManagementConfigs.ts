import { DomainManagementConfigs } from '../types'

export const domainManagementConfigs: DomainManagementConfigs = {
  parentDomain: 'prywesee.com',
  organizationId: 'o-abcd1234', //SCRUB
  mxRecord: {
    values: [
      { hostName: 'mx.zoho.com', priority: 10 },
      { hostName: 'mx2.zoho.com', priority: 20 },
      { hostName: 'mx3.zoho.com', priority: 50 },
    ],
  },
  spfRecord: {
    values: ['v=spf1 include:zoho.com include:amazonses.com ~all'],
  },
  environments: {
    Development: {
      subdomain: 'dev',
      txtRecords: [
        {
          recordName: 'zoho._domainkey',
          values: ['v=DKIM1; k=rsa; abcd']
        }
      ],
      cnameRecords: [
        {
          recordName: 'abcd._domainkey',
          value: 'abcd.dkim.amazonses.com'
        },
        {
          recordName: 'abcd._domainkey',
          value: 'abcd.dkim.amazonses.com'
        },
        {
          recordName: 'abcd._domainkey',
          value: 'abcd.dkim.amazonses.com'
        },
      ],
      aRecords: [],
    }, //SCRUB
    Production: {
      subdomain: '',
      txtRecords: [
        {
          recordName: 'zoho._domainkey',
          values: ['v=DKIM1; k=rsa; abcd']
        }
      ],
      cnameRecords: [
        {
          recordName: 'abcd._domainkey',
          value: 'abcd.dkim.amazonses.com'
        },
        {
          recordName: 'abcd._domainkey',
          value: 'abcd.dkim.amazonses.com'
        },
        {
          recordName: 'abcd._domainkey',
          value: 'abcd.dkim.amazonses.com'
        },
      ],
      aRecords: [],
    }, //SCRUB
  },
}
