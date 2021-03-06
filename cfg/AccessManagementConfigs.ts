import { AccessManagementConfigs } from '../types'
import { productionConfigs } from './EnvironmentConfigs'

export const accessManagementConfigs: AccessManagementConfigs = {
  userNames: ['kkamath', 'rkkamath'],
  initialPassword: 'Welc0me!',
  cdkUserAssumeRoleResources: [
    `arn:aws:iam::${productionConfigs.account}:role/ProductionCdkRole`,
    `arn:aws:iam::${productionConfigs.account}:role/ProductionZoneDelegationRole`,
  ],
  consoleUserAssumeRoleResources: [`arn:aws:iam::${productionConfigs.account}:role/ProductionConsoleRole`],
  consolePolicyAllowActions: [
    'iam:GetAccountPasswordPolicy',
    'iam:ChangePassword',
    'acm-pca:Describe*',
    'acm-pca:Get*',
    'acm-pca:List*',
    'acm:Describe*',
    'acm:Get*',
    'acm:List*',
    'apigateway:GET',
    'athena:Batch*',
    'athena:Get*',
    'athena:List*',
    'autoscaling-plans:Describe*',
    'autoscaling-plans:GetScalingPlanResourceForecastData',
    'autoscaling:Describe*',
    'cloudformation:Describe*',
    'cloudformation:Detect*',
    'cloudformation:Estimate*',
    'cloudformation:Get*',
    'cloudformation:List*',
    'cloudfront:DescribeFunction',
    'cloudfront:Get*',
    'cloudfront:List*',
    'cloudtrail:Describe*',
    'cloudtrail:Get*',
    'cloudtrail:List*',
    'cloudtrail:LookupEvents',
    'cloudwatch:Describe*',
    'cloudwatch:Get*',
    'cloudwatch:List*',
    'cognito-identity:Describe*',
    'cognito-identity:GetCredentialsForIdentity',
    'cognito-identity:GetIdentityPoolRoles',
    'cognito-identity:GetOpenIdToken',
    'cognito-identity:GetOpenIdTokenForDeveloperIdentity',
    'cognito-identity:List*',
    'cognito-identity:Lookup*',
    'cognito-idp:AdminGet*',
    'cognito-idp:AdminList*',
    'cognito-idp:Describe*',
    'cognito-idp:Get*',
    'cognito-idp:List*',
    'cognito-sync:Describe*',
    'cognito-sync:Get*',
    'cognito-sync:List*',
    'cognito-sync:QueryRecords',
    'dynamodb:BatchGet*',
    'dynamodb:Describe*',
    'dynamodb:Get*',
    'dynamodb:List*',
    'dynamodb:Query',
    'dynamodb:Scan',
    'ec2:Describe*',
    'ec2:Get*',
    'ec2:ListSnapshotsInRecycleBin',
    'ec2:SearchLocalGatewayRoutes',
    'ec2:SearchTransitGatewayRoutes',
    'ec2messages:Get*',
    'ecr-public:BatchCheckLayerAvailability',
    'ecr-public:DescribeImages',
    'ecr-public:DescribeImageTags',
    'ecr-public:DescribeRegistries',
    'ecr-public:DescribeRepositories',
    'ecr-public:GetAuthorizationToken',
    'ecr-public:GetRegistryCatalogData',
    'ecr-public:GetRepositoryCatalogData',
    'ecr-public:GetRepositoryPolicy',
    'ecr-public:ListTagsForResource',
    'ecr:BatchCheck*',
    'ecr:BatchGet*',
    'ecr:Describe*',
    'ecr:Get*',
    'ecr:List*',
    'ecs:Describe*',
    'ecs:List*',
    'eks:Describe*',
    'eks:List*',
    'elasticloadbalancing:Describe*',
    'es:Describe*',
    'es:ESHttpGet',
    'es:ESHttpHead',
    'es:Get*',
    'es:List*',
    'iam:Generate*',
    'iam:Get*',
    'iam:List*',
    'iam:Simulate*',
    'kinesis:Describe*',
    'kinesis:Get*',
    'kinesis:List*',
    'kinesisanalytics:Describe*',
    'kinesisanalytics:Discover*',
    'kinesisanalytics:Get*',
    'kinesisanalytics:List*',
    'kinesisvideo:Describe*',
    'kinesisvideo:Get*',
    'kinesisvideo:List*',
    'kms:Describe*',
    'kms:Get*',
    'kms:List*',
    'lambda:Get*',
    'lambda:List*',
    'lambda:InvokeFunction',
    'logs:Describe*',
    'logs:FilterLogEvents',
    'logs:Get*',
    'logs:ListTagsLogGroup',
    'logs:StartQuery',
    'logs:StopQuery',
    'logs:TestMetricFilter',
    'rds:Describe*',
    'rds:Download*',
    'rds:List*',
    'redshift:Describe*',
    'redshift:GetReservedNodeExchangeOfferings',
    'redshift:View*',
    'route53-recovery-cluster:Get*',
    'route53-recovery-control-config:Describe*',
    'route53-recovery-control-config:List*',
    'route53-recovery-readiness:Get*',
    'route53-recovery-readiness:List*',
    'route53:Get*',
    'route53:List*',
    'route53:Test*',
    'route53domains:Check*',
    'route53domains:Get*',
    'route53domains:List*',
    'route53domains:View*',
    'route53resolver:Get*',
    'route53resolver:List*',
    's3-object-lambda:GetObject',
    's3-object-lambda:GetObjectAcl',
    's3-object-lambda:GetObjectLegalHold',
    's3-object-lambda:GetObjectRetention',
    's3-object-lambda:GetObjectTagging',
    's3-object-lambda:GetObjectVersion',
    's3-object-lambda:GetObjectVersionAcl',
    's3-object-lambda:GetObjectVersionTagging',
    's3-object-lambda:ListBucket',
    's3-object-lambda:ListBucketMultipartUploads',
    's3-object-lambda:ListBucketVersions',
    's3-object-lambda:ListMultipartUploadParts',
    's3:DescribeJob',
    's3:Get*',
    's3:List*',
    'sagemaker:Describe*',
    'sagemaker:GetSearchSuggestions',
    'sagemaker:List*',
    'sagemaker:Search',
    'ses:Describe*',
    'ses:Get*',
    'ses:List*',
    'shield:Describe*',
    'shield:Get*',
    'shield:List*',
    'sns:Check*',
    'sns:Get*',
    'sns:List*',
    'sqs:Get*',
    'sqs:List*',
    'sqs:Receive*',
    'sts:GetAccessKeyInfo',
    'sts:GetCallerIdentity',
    'sts:GetSessionToken',
    'tag:Get*',
    'waf-regional:Get*',
    'waf-regional:List*',
    'waf:Get*',
    'waf:List*',
    'wafv2:CheckCapacity',
    'wafv2:Describe*',
    'wafv2:Get*',
    'wafv2:List*',
  ],
}
