These notes are paraphrased a version of [AWS Certified Solutions Architect Associate course on Udemy by Stephane Maarek](https://www.udemy.com/course/aws-certified-solutions-architect-associate-saa-c02/).

# Terminologies
* **Environment** covers a specific **account** and **region**. Region is a physical location around the world where data centers are clustered. Each AWS Region consists of multiple, isolated, and physically separate AZ's with independent power, cooling, and physical security and is connected via redundant, ultra-low-latency networks

* **Organizations** are used to consolidate multiple AWS accounts for consolidated billing, volume discounts, hierarchical grouping using OUs and centralized policies. See [here](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_introduction.html) for 
deep dive.

* **Resource** is a loose abstraction, but can be considered an object that exists within a **Service** ex: a bucket in Amazon S3. The service defines a set of actions that can be performed on each resource. If you create a request to perform an unrelated action on a resource, that request is denied.

* **Amazon Resource Names (ARN)** uniquely identify AWS resources. See [here](https://docs.aws.amazon.com/general/latest/gr/aws-arns-and-namespaces.html) for deep dive.
  ```
  arn:partition:service:region:account-id:resource-id
  arn:partition:service:region:account-id:resource-type/resource-id
  arn:partition:service:region:account-id:resource-type:resource-id
  ```

* **Tags** assign metadata to your resources in the form of user-defined key and value. See [here](https://docs.aws.amazon.com/general/latest/gr/aws_tagging.html) for deep dive.

# Secure
## IAM
Identity and Access Management (IAM) is a web service that helps you securely control access to AWS resources. This is a global service with no region. See [here](https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html) for deep dive.

* Group - is a collection of IAM users who have similar responsibilities/policies. Use groups to specify permissions for a collection of users.
* User - is an identity with long-term credentials that is used to interact with AWS in an account. 
  * It doesn't have to represent an actual person; you can create an IAM user in order to generate an access key to make programmatic calls to AWS.
* Role - secure way to grant temporary permissions to entities that you trust such as,
  * AWS services and Application Code
  * IAM user in another account, see [here](Doc:https://docs.aws.amazon.com/IAM/latest/UserGuide/tutorial_cross-account-with-roles.html) for deep dive.
  * Federated User outside of AWS uses SAML/OpenID based AD, SSO or Web IdP.
* Policy - are attached to principals and AWS evaluates these policies when the principal makes a request. 
  * Policies are stored in AWS as JSON objects and define permissions through following properties.
    * Effect – whether the policy allows or denies access
    * Action – the list of actions that are allowed or denied by the policy
    * Resource – the list of resources on which the actions can occur
    * Condition (Optional) – the circumstances under which the policy grants permission
* Principal - person or application that can make a request for the resource

Cardinality across Groups, Users, Roles, Policies and Principal
* Groups contain Users
* User contains identity-based policies
* Roles contain resource-based policies with principals

The evaluation logic for a request within a single account follows these rules:
* By default, all requests are implicitly denied.
* An explicit allow in a policy overrides this default.
* If a permissions boundary, Organizations SCP, or session policy is present, it might override the allow with an implicit deny.
* An explicit deny in any policy overrides any allows.

As a general workflow, the root user should create an account alias, delete root access key, enable MFA for root account and create an IAM admin user with an access key for all subsequent administration. Only the Root and IAM admin users can create users, groups and roles. 

## STS 
* Security Token Service (STS) grants temporary credentials via tokens to IAM or federated users
* AssumeRole - within your own account for enhanced security, or cross-account
  * Define IAM role within your account or target cross-account
  * Define which principals can access this IAM role
  * Principals use AssumeRole API to retrieve credentials to impersonate the IAM role they have access to
* AssumeRoleWithSAML - for SAML2.0 compatible IdP and Active Directory users
  * Need to setup a trust between between IAM and SAML (both ways) 
  * Amazon SSO is new way of doing this
* AssumeRoleWithWebIdentity - for users logged with Identity Providers
  * Not recommended, and Cognito is new recommended way of doing this and allows for anonymous users, data synchronization, MFA
* GetSessionToken - for MFA

## Directory Service
* Microsoft Active Directory (AD) services is a database of objects (user accounts, computers, printers, file shares, security groups) that is organized into trees and grouped as forests for centralized security and identity management.
* Directory Services provides 3 ways to create AD on AWS 
  * AWS Managed AD - establish trust with on-premise Microsoft AD
  * AD Connector - proxy to redirect to on-premise AD
  * Simple AD - standalone directory cannot be joined with on-premise AD 

## SSO
* Single Sign-On (SSO) access to multiple accounts and 3rd party business applications
* Integrated with AWS Organizations, supports SAML2.0, integrates with on-premise AD, offers centralized permission management and auditing with cloudtrail
  
## Cognito
* TBD...

# Network


# Route
## Route 53
* Register Domain
* Hosted Zone
  * Record Types
    * A: Returns a 32-bit IPv4 address, most commonly used to map hostnames to an IP address of the host,
    * AAAA: Returns a 128-bit IPv6 address, most commonly used to map hostnames to an IP address of the host

## CloudFront
* 

## API Gateway
* 

## ELB
* Classic Load Balancer
* Application Load Balancer (ALB)
  * Layer 7 HTTP/2, WebSocket, HTTP Redirects
  * To multiple apps across machines (target groups) or same machine (containers)
  * Routing based on path, hostname, query string, headers
  * Port mapping feature to redirect to dynamic port in ECS
  * Target groups can be 
    * EC2 instances managed by ASG, 
    * ECS tasks, 
    * Lambda functions
    * IP Addresses
  * You get a fixed hostname
  * Applications don’t see the client IP directly and inserted in header
    * X-Forwarded-For (Client IP)
    * X-Forwarded-Port
    * X-Forwarded-Proto
  * Stickiness to send client to same instance is available on ALB, not NLB
  * Cross zone load balancing always enabled, no charges
* Network Load Balancer (NLB)
  * Layer 4 (TCP/TLS/UDP), low latency ~100 ms (vs ~400 ms for ALB)
  * One static IP per AZ, and supports assigning Elastic IP (for whitelisting)
  * Cross zone load balancing disabled by default, charges to enable
* SSL/TLS Termination
  * LB uses X.509 SSL/TLS certificate, or upload your own
  * ACM to manage certificates
  * Provide default certificate, and optional list to support multiple domains
  * Clients can use Server Name Identification (SNI)
  * Specify security policy for legacy clients
* Connection draining or Deregistration delay is the time to complete in-flight requests while the instance is deregistering or unhealthy

# Compute
## EC2

* AMI
  * Pre-installed packages with faster boot time (no need of user data)
  * Better maintenance with monitoring, updates and security
  * Rent AMIs / expertise from other people with optimized s/w
  * Backups stored in S3, which is cheap (~$0.023/GB/month)
  * AMIs are locked to a region, but you can copy to different regions
  * You can also share an AMI with another account by granting permissions
  * Can’t copy AMI with associated billingProduct - instead launch an EC2 instance using the shared AMI and create AMI from instance

* Instance Type
  * R - Lot of RAM (apps with in-memory cache)
  * C - Good CPU (apps with compute and databases)
  * M - balanced (General, Web Apps)
  * I - Good I/O (databases)
  * G - Good GPU (apps for video rendering, machine learning)
  * T2/T3 - Burstable up to a capacity or unlimited
  * https://www.ec2instances.info/

* Instance Launch Type
  * On Demand: Short Workload, predictable pricing
  * Reserved (minimum 1 year): 
    * Reserved: 1-3 years of specific instance type, 75% discount
    * Convertible: Chan change instance type, 54% discount
    * Scheduled: Launch within time window, 
  * Spot: Short Workload, can lose instances, 90% discount
    * Max Price
    * Desired # of instances
    * Launch Specification
    * One Time or Persistent Request
    * Valid From, Valid Until
    * Cancelling a spot request does not terminate instances
    * You can only cancel spot requests in open, active, disabled state
    * Spot Block
    * Spot Fleet = set of spot instances + optional on-demand instances
      * Lowest Price
      * Diversified
      * Capacity Optimized
  * Dedicated: 
    * Dedicated Hosts: Control EC2 instance placement, socket/core visibility, 3 year period, More expensive. Useful for software with complicated licensing model (BYOL) or strong regulatory or compliance needs
    * Dedicated Instances: Instance can move hardware after start/stop, but hardware dedicated to your account 
* Placement Group
  * Cluster - clusters into low latency group in single AZ
  * Spread - spread across hardwares for critical apps (7 per group per AZ)
  * Partition - spread across partitions i.e. racks for Hadoop/Kafka (87 partitions and 100s of EC2 per group per AZ)
* Elastic Network Interface (ENI)
  * Logical component of VPC bound to AZ that is created independently and bound to EC2 instances on failover
  * ENI can have private, public, elastic and multiple secondary IP addresses, security groups and one MAC address
* Public vs Private vs Elastic IP
  * With an elastic IP you can mask the failure of an instance by rapidly remapping the address to another instance in account
  * Limit of 5 Elastic IPs, which can be increased. Overall avoid elastic IP and instead use either DNS and Public IP or Load Balancer and Private IP
  * By default EC2 instance comes with Private and Public IP
  * Public IP changes as you start/stop instances, but not private
* User Data to bootstrap EC2 instances
  * Launching commands when machine starts
  * Script is run once when instance starts
  * Used to automate boot tasks like install updates, software, download files or anything
* Storage
* Security Group - Firewall “outside” the EC2 instance
  * Inbound: Type-SSH, Protocol-TCP, Port Range-22, Source-0.0.0.0
  * Outbound: Type-All, Protocol-All, Port Range-All, Destination-0.0.0.0
  * Can be attached to multiple instances
  * Locked down to region
  * If application times out it usually security group issue
  * If application returns connection refused error, it is application issue
  * All inbound traffic is blocked and all outbound traffic is authorized by default
  * Security groups can reference other security groups
* Download SSH Key Pair
  * Unprotected private key file error => chmod 0400 <keyfile.pem>
  * For Amazon AMI, EC2 Connect from browser emulates SSH
* Start, Stop, Terminate and within limitations you can Hibernate (RAM written to file in root EBS volume) EC2 instances for quick boot

## ASG
* Launch templates (newer) or Launch configuration (old legacy)
  * ...like EC2
* Load Balancer Info
  * Automatically register new instances to load balancer
  * Target Groups and Health Checks
* Group Size
  * Scale our or in with max, desired and min number of machines
* Scaling Policies
  * Target tracking ex: average ASG CPU at 40%
  * Step scaling ex: scale out when CPU>70% and scale in for CPU<30%
  * Scheduled actions	
* Scaling Metrics
  * Average CPU utilization
  * Network In and/or Out
  * Number of requests per ELB instance
  * Custom Metric ex: connected number of users
    * Send custom metric from application to Cloud Watch
    * Create CloudWatch alarm to react to low/high values
    * Use CloudWatch alarm as scaling policy for ASG
* Scaling Cooldowns to ensure previous scaling activity takes effect
* Default termination policy
  * Find AZ with most instances
  * And delete instance with oldest launch configuration
  * Lifecycle hooks to specify stuff before launching or terminating instances	
* IAM roles assigned to ASG gets assigned to EC2 instance

## Lambda
* 

# Message
## SQS
* 

## SNS
* 

## Kinesis
* 

## Active MQ
* 

## SES
* 

# Store
## RDS
* 

## Aurora
* 

## DynamoDB
* 

## ElastiCache
* 

# Operational Tools
## Step Functions
* 

## SWF
* 

## CloudWatch
* 

## CloudTrail
* 

# Developer Tools
## AWS CLI
* Interact with AWS services using commands in your command-line shell
* Doc:https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-welcome.html 
* Commands: https://awscli.amazonaws.com/v2/documentation/api/latest/index.html 

## CloudFormation Templates
* Create and provision AWS infrastructure deployments predictably and repeatedly using a template file to create/delete a collection of resources as a single unit (a stack)
* Doc:https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/Welcome.html 

## AWS CDK
* Define your cloud resources in a familiar programming language
* Output of an AWS CDK program is a CloudFormation template.
* Doc: https://docs.aws.amazon.com/cdk/latest/guide/home.html
* Constructs reusable cloud components composed together into Stacks and Apps.
* Construct Library: https://docs.aws.amazon.com/cdk/api/latest/docs/aws-construct-library.html
  * L1: CloudFormation-only consttucts defined by AWS CloudFormation ex: CfnBucket
  * L2: Curated constructs developed by the AWS CDK team ex: Bucket
  * L3: Patterns that declare multiple resources to create entire AWS architectures

## SDK
* Code libraries provided by Amazon to help interact with AWS services, which you either create through CDK, CloudFormation or console. 
* SDKs simplify using AWS services in your application with an API.
* Support for the following languages: Python (boto3), JavaScript, PHP, .NET, Ruby, Java, Go, NodeJS, C++

## ToolKits
* IDE plug-ins that make it easier to create, debug, and deploy applications on AWS.
* Support for the following IDEs: JetBrains, Visual Studio, Visual Studio Code, PowerShell
* Doc: https://docs.aws.amazon.com/toolkit-for-vscode/latest/userguide/welcome.html  

## REST API
* Making REST API calls directly from your code can be cumbersome and not well documented. 
* SDK and CLI are alternatives, which most likely use the REST APIs underneath. 
* Docs: Look under docs for respective services

Also, CodeCommit, CodeBuild, CodeDeploy and CodePipeline, and many others if you want to pursue a AWS certification....
