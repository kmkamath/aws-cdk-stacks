import { CfnOutput, SecretValue, Stack, StackProps } from 'aws-cdk-lib'
import {
  AccessKey,
  AccountPrincipal,
  Effect,
  IRole,
  ManagedPolicy,
  PolicyStatement,
  Role,
  User,
} from 'aws-cdk-lib/aws-iam'
import { Construct } from 'constructs'
import { AccessManagementConfigs, EnvironmentConfigs, Environments } from '../types'

export interface AccessManagementStackProps extends StackProps {
  tags: {
    app: string
    env: Environments
  }
  envs: {
    [env in Environments]: EnvironmentConfigs
  }
  appCfg: AccessManagementConfigs
}

export class AccessManagementStack extends Stack {
  constructor(scope: Construct, id: string, props: AccessManagementStackProps) {
    super(scope, id, props)

    // Get Env
    const { env } = props.tags

    // App configs
    const {
      userNames,
      initialPassword,
      cdkUserAssumeRoleResources,
      consoleUserAssumeRoleResources,
      consolePolicyAllowActions,
    } = props.appCfg

    // Constants
    const getCdkRoleName = (env: string) => `${env}CdkRole`
    const getConsoleRoleName = (env: string) => `${env}ConsoleRole`

    // Create CDK Policy with Write Access
    const cdkPolicy: ManagedPolicy = new ManagedPolicy(this, 'CdkPolicy', {
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['sts:AssumeRole'],
          resources: [`arn:aws:iam::${props.env?.account}:role/cdk-*`],
        }),
      ],
    })

    // Create Console Policy with Read-Only Access
    const consolePolicy: ManagedPolicy = new ManagedPolicy(this, 'ConsolePolicy', {
      statements: [new PolicyStatement({ effect: Effect.ALLOW, actions: consolePolicyAllowActions, resources: ['*'] })],
    })

    if (env != 'Development') {
      // Create CDK role for the Development User Account to assume
      const cdkRole: IRole = new Role(this, `CdkRole`, {
        roleName: getCdkRoleName(env),
        assumedBy: new AccountPrincipal(props.envs['Development'].account),
      })
      cdkRole.addManagedPolicy(cdkPolicy)

      // Create Console role for the Development User Account to assume
      const consoleRole: IRole = new Role(this, `ConsoleRole`, {
        roleName: getConsoleRoleName(env),
        assumedBy: new AccountPrincipal(props.envs['Development'].account),
      })
      consoleRole.addManagedPolicy(consolePolicy)
    } else {
      // Add cross account CDK Roles to the CDK policy in Development user account
      cdkPolicy.addStatements(
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['sts:AssumeRole'],
          resources: cdkUserAssumeRoleResources,
        }),
      )
      // Add cross account CDK Roles to the CDK policy in Development user account
      consolePolicy.addStatements(
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['sts:AssumeRole'],
          resources: consoleUserAssumeRoleResources,
        }),
      )

      // Create Users
      userNames.map((v) => {
        // Create programmatic CDK Users with Cdk policy
        const cdkUserName = `${v}-cdk`
        const cdkUser: User = new User(this, `User-${cdkUserName}`, {
          userName: `${cdkUserName}`,
          managedPolicies: [cdkPolicy],
        })
        const cdkUserAccessKey: AccessKey = new AccessKey(this, `User-${cdkUserName}-CfnAccessKey`, { user: cdkUser })
        new CfnOutput(this, `User-${cdkUserName}-accessKeyId`, {
          value: cdkUserAccessKey.accessKeyId,
          exportName: `User-${cdkUserName}-accessKeyId`,
        })
        new CfnOutput(this, `User-${cdkUserName}-secretAccessKey`, {
          value: cdkUserAccessKey.secretAccessKey.toString(),
          exportName: `User-${cdkUserName}-secretAccessKey`,
        })

        // Create Console Users with console policy
        const consoleUserName = `${v}-console`
        const consoleUser: User = new User(this, `User-${consoleUserName}`, {
          userName: `${consoleUserName}`,
          password: SecretValue.plainText(initialPassword),
          passwordResetRequired: true,
          managedPolicies: [consolePolicy],
        })
        const consoleUserAccessKey: AccessKey = new AccessKey(this, `User-${consoleUserName}-CfnAccessKey`, {
          user: consoleUser,
        })
        new CfnOutput(this, `User-${consoleUserName}-accessKeyId`, {
          value: consoleUserAccessKey.accessKeyId,
          exportName: `User-${consoleUserName}-accessKeyId`,
        })
        new CfnOutput(this, `User-${consoleUserName}-secretAccessKey`, {
          value: consoleUserAccessKey.secretAccessKey.toString(),
          exportName: `User-${consoleUserName}-secretAccessKey`,
        })
      })
    }
  }
}
