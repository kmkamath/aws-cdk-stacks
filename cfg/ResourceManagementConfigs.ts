import { AttributeType } from 'aws-cdk-lib/aws-dynamodb'
import { HttpMethod } from 'aws-cdk-lib/aws-events'
import { ResourceManagementConfigs } from '../types'

export const resourceManagementConfigs: ResourceManagementConfigs = {
  resources: [
    {
      table: {
        name: 'Resource1',
        partitionKey: { name: 'pkey', type: AttributeType.STRING },
        sortKey: { name: 'id', type: AttributeType.STRING },
      },
      routes: [
        {
          path: '/resource1',
          method: HttpMethod.POST,
          handlerFnFile: '../fn/resources.ts',
          handlerFnName: 'createResource',
          isAuthorize: true,
          params: {
            keys: [{ name: 'pkey', configuredIn: 'body' }, { name: 'id' }],
          },
        },
        {
          path: '/resource1/{id}',
          method: HttpMethod.PUT,
          handlerFnFile: '../fn/resources.ts',
          handlerFnName: 'updateResource',
          isAuthorize: true,
          params: {
            keys: [
              { name: 'pkey', configuredIn: 'body' },
              { name: 'id', configuredIn: 'pathParameters' },
            ],
          },
        },
        {
          path: '/resource1/{id}',
          method: HttpMethod.GET,
          handlerFnFile: '../fn/resources.ts',
          handlerFnName: 'getResource',
          isAuthorize: true,
          params: {
            keys: [
              { name: 'pkey', configuredIn: 'queryStringParameters' },
              { name: 'id', configuredIn: 'pathParameters' },
            ],
          },
        },
        {
          path: '/resource1/{id}',
          method: HttpMethod.DELETE,
          handlerFnFile: '../fn/resources.ts',
          handlerFnName: 'deleteResource',
          isAuthorize: true,
          params: {
            keys: [
              { name: 'pkey', configuredIn: 'queryStringParameters' },
              { name: 'id', configuredIn: 'pathParameters' },
            ],
          },
        },
      ],
    },
    {
      table: {
        name: 'Resource2',
        partitionKey: { name: 'id', type: AttributeType.STRING },
      },
      routes: [
        {
          path: '/resource2',
          method: HttpMethod.POST,
          handlerFnFile: '../fn/resources.ts',
          handlerFnName: 'createResource',
          isAuthorize: true,
          params: {
            keys: [{ name: 'id' }],
          },
        },
        {
          path: '/resource2/{id}',
          method: HttpMethod.PUT,
          handlerFnFile: '../fn/resources.ts',
          handlerFnName: 'updateResource',
          isAuthorize: true,
          params: {
            keys: [{ name: 'id', configuredIn: 'pathParameters' }],
          },
        },
        {
          path: '/resource2/{id}',
          method: HttpMethod.GET,
          handlerFnFile: '../fn/resources.ts',
          handlerFnName: 'getResource',
          isAuthorize: true,
          params: {
            keys: [{ name: 'id', configuredIn: 'pathParameters' }],
          },
        },
        {
          path: '/resource2/{id}',
          method: HttpMethod.DELETE,
          handlerFnFile: '../fn/resources.ts',
          handlerFnName: 'deleteResource',
          isAuthorize: true,
          params: {
            keys: [{ name: 'id', configuredIn: 'pathParameters' }],
          },
        },
      ],
    },
  ],
  environments: {
    Development: {
      httpApiId: 'abc1234', //SCRUB
      httpAuthorizerId: 'abc5678', //SCRUB
      replicationRegions: ['us-east-1'],
      isDestroyable: true,
    },
    Production: {
      httpApiId: 'xyz1234', //SCRUB
      httpAuthorizerId: 'xyz5678', //SCRUB
      replicationRegions: ['us-east-1', 'us-west-2'],
      isDestroyable: false,
    },
  },
}
