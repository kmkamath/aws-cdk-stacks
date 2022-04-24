import { HttpMethod } from 'aws-cdk-lib/aws-events'
import { UserManagementConfigs } from '../types'

export const userManagementConfigs: UserManagementConfigs = {
  parentDomain: 'prywesee.com',
  userAttributes: {
    standard: ['fullname', 'email', 'phoneNumber'],
    custom: ['isAdmin'],
  },
  routes: [
    {
      path: '/signIn',
      method: HttpMethod.POST,
      handlerFnfile: '../fn/users.ts',
      handlerFnName: 'signIn',
      isAuthorize: false,
    },
    {
      path: '/signOut',
      method: HttpMethod.POST,
      handlerFnfile: '../fn/users.ts',
      handlerFnName: 'signOut',
      isAuthorize: false,
    },
    {
      path: '/users',
      method: HttpMethod.POST,
      handlerFnfile: '../fn/users.ts',
      handlerFnName: 'createUser',
      isAuthorize: false,
    },
    {
      path: '/users/{id}',
      method: HttpMethod.PUT,
      handlerFnfile: '../fn/users.ts',
      handlerFnName: 'updateUser',
      isAuthorize: true,
    },
    {
      path: '/users/{id}',
      method: HttpMethod.GET,
      handlerFnfile: '../fn/users.ts',
      handlerFnName: 'getUser',
      isAuthorize: true,
    },
    {
      path: '/users/{id}',
      method: HttpMethod.DELETE,
      handlerFnfile: '../fn/users.ts',
      handlerFnName: 'deleteUser',
      isAuthorize: true,
    },
  ],
  environments: {
    Development: {
      subdomain: 'dev',
      httpApiId: 'abc1234', //SCRUB
      isDestroyable: true,
    },
    Production: {
      subdomain: '',
      httpApiId: 'xyz1234', //SCRUB
      isDestroyable: false,
    },
  },
}
