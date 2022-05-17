import {
  HttpApi,
  HttpAuthorizer,
  HttpRoute,
  HttpRouteKey,
  IHttpApi,
  IHttpRouteAuthorizer,
} from '@aws-cdk/aws-apigatewayv2-alpha'
import { HttpLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha'
import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib'
import { LogLevel, NodejsFunction, SourceMapMode } from 'aws-cdk-lib/aws-lambda-nodejs'
import { RetentionDays } from 'aws-cdk-lib/aws-logs'
import { Construct } from 'constructs'
import { join } from 'path'
import { Environments, ResourceManagementConfigs } from '../types'
import { Table } from 'aws-cdk-lib/aws-dynamodb'

export interface ResourceManagementStackProps extends StackProps {
  tags: {
    app: string
    env: Environments
  }
  appCfg: ResourceManagementConfigs
}

export class ResourceManagementStack extends Stack {
  constructor(scope: Construct, id: string, props: ResourceManagementStackProps) {
    super(scope, id, props)

    // Get App and Env
    const { app, env } = props.tags

    // Environment specific configs
    const { httpApiId, httpAuthorizerId, isDestroyable } = props.appCfg.environments[env]

    // App configs
    const { resources } = props.appCfg

    // Constants
    const bundling = {
      minify: true,
      nodeModules: ['@aws-sdk/client-dynamodb', '@aws-sdk/lib-dynamodb', 'uuid'],
      ...(env == 'Production'
        ? {}
        : {
            sourceMap: true, // include source map, defaults to false
            sourceMapMode: SourceMapMode.INLINE, // defaults to SourceMapMode.DEFAULT
            sourcesContent: true, // do not include original source into source map, defaults to true
            logLevel: LogLevel.WARNING, // defaults to LogLevel.WARNING
          }),
    }

    // import http api and authorizer
    const httpApi: IHttpApi = HttpApi.fromHttpApiAttributes(this, 'HttpApi', { httpApiId })
    const authorizer: IHttpRouteAuthorizer = HttpAuthorizer.fromHttpAuthorizerAttributes(this, 'HttpAuthorizer', {
      authorizerId: httpAuthorizerId,
      authorizerType: 'JWT',
    })

    // add configured resource endpoints
    resources.forEach((resource: any) => {
      const { table, routes } = resource

      // resource stores
      const dynamoDbTable: Table = new Table(this, `${table.name}Table`, {
        tableName: table.name,
        partitionKey: table.partitionKey,
        sortKey: table?.sortKey,
        ...(isDestroyable ? { removalPolicy: RemovalPolicy.DESTROY } : {}),
      })

      // resources
      routes.forEach((route: any) => {
        const { method, path, handlerFnFile, handlerFnName, isAuthorize, params } = route
        // resource handlers
        const lambdaFn = new NodejsFunction(this, `${path}-${method}-Fn`, {
          entry: join(__dirname, handlerFnFile),
          handler: handlerFnName,
          logRetention: RetentionDays.ONE_DAY,
          environment: {
            ENV: env,
            REGION: Stack.of(this).region,
            AZS: JSON.stringify(Stack.of(this).availabilityZones),
            APP: app,
            TABLE_NAME: table.name,
            TABLE_PARAMS: JSON.stringify(params),
          },
          bundling,
        })
        // resource endpoints
        new HttpRoute(this, `${path}-${method}-Route`, {
          httpApi,
          routeKey: HttpRouteKey.with(path, method),
          integration: new HttpLambdaIntegration(`${path}-${method}-Integration`, lambdaFn),
          ...(isAuthorize ? { authorizer } : {}),
        })
        dynamoDbTable.grantReadWriteData(lambdaFn)
      })
    })
  }
}
