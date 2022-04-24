import { HttpApi, HttpRoute, HttpRouteKey, IHttpApi, IHttpRouteAuthorizer } from '@aws-cdk/aws-apigatewayv2-alpha'
import { HttpLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha'
import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib'
import {
  AccountRecovery,
  IUserPoolClient,
  OAuthScope,
  StringAttribute,
  UserPool,
  UserPoolClient,
  UserPoolClientIdentityProvider,
  UserPoolEmail,
  VerificationEmailStyle,
} from 'aws-cdk-lib/aws-cognito'
import { Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam'
import { LogLevel, NodejsFunction, SourceMapMode } from 'aws-cdk-lib/aws-lambda-nodejs'
import { RetentionDays } from 'aws-cdk-lib/aws-logs'
import { Construct } from 'constructs'
import { join } from 'path'
import { Environments, UserManagementConfigs } from '../types'
import { HttpJwtAuthorizer } from '@aws-cdk/aws-apigatewayv2-authorizers-alpha'

export interface UserManagementStackProps extends StackProps {
  tags: {
    app: string
    env: Environments
  }
  appCfg: UserManagementConfigs
}

export class UserManagementStack extends Stack {
  private readonly userPool: UserPool
  private readonly userPoolClient: IUserPoolClient
  private readonly userPoolAuthorizer: IHttpRouteAuthorizer

  constructor(scope: Construct, id: string, props: UserManagementStackProps) {
    super(scope, id, props)

    // Get App and Env
    const { app, env } = props.tags

    // Environment specific configs
    const { subdomain, httpApiId, isDestroyable } = props.appCfg.environments[env]

    // App configs
    const { parentDomain, userAttributes, routes } = props.appCfg

    // Constants
    const domainName = env == 'Production' ? parentDomain : `${subdomain}.${parentDomain}`
    const bundling = {
      minify: true,
      nodeModules: ['@aws-sdk/client-lambda', '@aws-sdk/client-cognito-identity-provider'],
      ...(env == 'Production'
        ? {}
        : {
            sourceMap: true, // include source map, defaults to false
            sourceMapMode: SourceMapMode.INLINE, // defaults to SourceMapMode.DEFAULT
            sourcesContent: true, // do not include original source into source map, defaults to true
            logLevel: LogLevel.WARNING, // defaults to LogLevel.WARNING
          }),
    }

    // cognito user pool
    this.userPool = new UserPool(this, 'UserPool', {
      signInAliases: { email: true, phone: true },
      signInCaseSensitive: false,
      accountRecovery: AccountRecovery.EMAIL_ONLY,
      selfSignUpEnabled: true,
      autoVerify: { email: true },
      userVerification: {
        emailSubject: `Verify your email for ${app}!`,
        emailBody: `Thanks for signing up for ${app}! Verify your account by clicking on {##Verify Email##}`,
        emailStyle: VerificationEmailStyle.LINK,
      },
      email: UserPoolEmail.withSES({
        fromName: app,
        fromEmail: `no-reply@${domainName}`,
        replyTo: `support@${domainName}`,
      }),
      standardAttributes: userAttributes.standard.reduce(
        (standardAttributes, v) => ({ ...standardAttributes, [v]: { required: true, mutable: true } }),
        {},
      ),
      customAttributes: userAttributes.custom.reduce(
        (customAttributes, v) => ({ ...customAttributes, [v]: new StringAttribute({ mutable: true }) }),
        {},
      ),
      removalPolicy: isDestroyable ? RemovalPolicy.DESTROY : RemovalPolicy.RETAIN,
    })

    // add domain
    this.userPool.addDomain('CustomDomain', {
      cognitoDomain: {
        domainPrefix: domainName.replace(/\./g, '-'),
      },
    })

    // add client
    this.userPoolClient = new UserPoolClient(this, 'WebClient', {
      userPool: this.userPool,
      authFlows: { adminUserPassword: true },
      oAuth: {
        callbackUrls: [`https://${domainName}`, `https://${domainName}/signedIn`],
        logoutUrls: [`https://${domainName}/signedOut`],
        flows: {
          authorizationCodeGrant: true,
          implicitCodeGrant: true,
        },
        scopes: [OAuthScope.EMAIL, OAuthScope.OPENID, OAuthScope.PROFILE, OAuthScope.COGNITO_ADMIN],
      },
      generateSecret: false,
      supportedIdentityProviders: [
        UserPoolClientIdentityProvider.COGNITO,
        // UserPoolClientIdentityProvider.GOOGLE,
        // UserPoolClientIdentityProvider.FACEBOOK,
        // UserPoolClientIdentityProvider.AMAZON,
      ],
    })

    // jwt authorizer
    this.userPoolAuthorizer = new HttpJwtAuthorizer('UserAuthorizer', this.userPool.userPoolProviderUrl, {
      jwtAudience: [this.userPoolClient.userPoolClientId],
    })

    // api gateway with users routes
    const httpApi: IHttpApi = HttpApi.fromHttpApiAttributes(this, 'HttpApi', { httpApiId })
    routes.forEach((route) => {
      const { method, path, handlerFnfile, handlerFnName, isAuthorize } = route
      const lambdaFn = new NodejsFunction(this, `${handlerFnName}Fn`, {
        entry: join(__dirname, handlerFnfile),
        handler: handlerFnName,
        logRetention: RetentionDays.ONE_DAY,
        environment: {
          ENV: env,
          REGION: Stack.of(this).region,
          AZS: JSON.stringify(Stack.of(this).availabilityZones),
          USER_POOL_ID: this.userPool.userPoolId.toString(),
          CLIENT_ID: this.userPoolClient.userPoolClientId.toString(),
        },
        bundling,
      })
      lambdaFn.role?.attachInlinePolicy(
        new Policy(this, `${handlerFnName}Policy`, {
          statements: [
            new PolicyStatement({
              actions: ['cognito-idp:*'],
              resources: [this.userPool.userPoolArn],
            }),
          ],
        }),
      )
      new HttpRoute(this, `${handlerFnName}Route`, {
        httpApi,
        routeKey: HttpRouteKey.with(path, method),
        integration: new HttpLambdaIntegration(`${handlerFnName}Integration`, lambdaFn),
        ...(isAuthorize ? { authorizer: this.userPoolAuthorizer } : {}),
      })
    })

    // Identity Providers
    // const userPoolIdpGoogle = new UserPoolIdentityProviderGoogle(this, 'IdpGoogle', {
    //   userPool: this.userPool,
    //   clientId: 'YOURGOOGLEID.googleusercontent.com',
    //   clientSecret: 'YOURSECRET_STOREMEIN_SECRETMANAGER',
    //   attributeMapping: {
    //     fullname: ProviderAttribute.GOOGLE_NAME,
    //     email: ProviderAttribute.GOOGLE_EMAIL,
    //   },
    // })
    // const userPoolIdpFacebook = new UserPoolIdentityProviderFacebook(this, 'IdpFacebook', {
    //   userPool: this.userPool,
    //   clientId: 'YOURFACEBOOKID',
    //   clientSecret: 'YOURSECRET_STOREMEIN_SECRETMANAGER',
    //   attributeMapping: {
    //     fullname: ProviderAttribute.FACEBOOK_NAME,
    //     email: ProviderAttribute.FACEBOOK_EMAIL,
    //   },
    // })
    // const userPoolIdpAmazon = new UserPoolIdentityProviderAmazon(this, 'IdpAmazon', {
    //   userPool: this.userPool,
    //   clientId: 'YOURAMAZONID',
    //   clientSecret: 'YOURSECRET_STOREMEIN_SECRETMANAGER',
    //   attributeMapping: {
    //     fullname: ProviderAttribute.AMAZON_NAME,
    //     email: ProviderAttribute.AMAZON_EMAIL,
    //   },
    // })

    // // mobile
    // const cognitoClw = new cognito.CfnUserPoolClient(this, 'tnc-web-client', {
    //   clientName: 'app-mobile',
    //   userPoolId: cognitoUP.ref,
    //   generateSecret: false,
    //   supportedIdentityProviders: [ 'COGNITO', cognitoUPIdpGoogle.providerName, cognitoUPIdpFacebook.providerName, cognitoUPIdpAmazon.providerName ],
    //   allowedOAuthFlows: [ 'code' ],
    //   allowedOAuthScopes: [ 'email', 'aws.cognito.signin.user.admin', 'openid', 'profile' ],
    //   allowedOAuthFlowsUserPoolClient: true,
    //   callbackUrLs: [ 'app://dashboard' ],
    //   logoutUrLs: [ 'app://home' ]
    // })

    // // cognito identity pool
    // const cognitoIdp = new cognito.CfnIdentityPool(this, 'tnc-idp', {
    //   allowUnauthenticatedIdentities: false, // don't want to unauth'd access
    //   cognitoIdentityProviders: [
    //     {
    //       providerName: cognitoUP.attrProviderName,
    //       clientId: cognitoCla.ref
    //     },
    //     {
    //       providerName: cognitoUP.attrProviderName,
    //       clientId: cognitoClw.ref
    //     }
    //   ]
    // })

    // // Dependency issue othereise
    // cognitoCla.addDependsOn(cognitoUPIdpGoogle)
    // cognitoClw.addDependsOn(cognitoUPIdpGoogle)

    // // We need roles for cognito, unauth and auth
    // const idpRoleUnAuthenticated = new iam.Role(this, 'tnc-unauthRole', {
    //   roleName: 'tnc-unAuthRole',
    //   assumedBy: new iam.FederatedPrincipal('cognito-identity.amazonaws.com', {
    //     'StringEquals': {
    //       'cognito-identity.amazonaws.com:aud': cognitoIdp.ref // Need the new pool id
    //     },
    //     'ForAnyValue:StringLike': {
    //       'cognito-identity.amazonaws.com:amr': 'unauthenticated'
    //     }
    //   },
    //   'sts:AssumeRoleWithWebIdentity'
    //   )
    // })

    // const idpRoleAuthenticated = new iam.Role(this, 'tnc-authrole', {
    //   roleName: 'tnc-authRole',
    //   assumedBy: new iam.FederatedPrincipal('cognito-identity.amazonaws.com', {
    //     'StringEquals': {
    //       'cognito-identity.amazonaws.com:aud': cognitoIdp.ref
    //     },
    //     'ForAnyValue:StringLike': {
    //       'cognito-identity.amazonaws.com:amr': 'authenticated'
    //     }
    //   },
    //   'sts:AssumeRoleWithWebIdentity'
    //   )
    // })

    // const cognitoRole = new cognito.CfnIdentityPoolRoleAttachment(this, 'tnc-roles', {
    //   identityPoolId: cognitoIdp.ref,
    //   roles: {
    //     authenticated: idpRoleAuthenticated.roleArn,
    //     unauthenticated: idpRoleUnAuthenticated.roleArn
    //   }
    // })
  }
}
