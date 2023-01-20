import {
  Stack,
  StackProps,
  CfnOutput,
  Duration,
  Aspects,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";
import * as ecr_assets from "aws-cdk-lib/aws-ecr-assets";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as r53 from "aws-cdk-lib/aws-route53";
import * as cloudTrail from "aws-cdk-lib/aws-cloudtrail";
import * as r53_targets from "aws-cdk-lib/aws-route53-targets";
import * as cert from "aws-cdk-lib/aws-certificatemanager";
import * as apig from "aws-cdk-lib/aws-apigateway";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as rds from "aws-cdk-lib/aws-rds";
import * as secret from "aws-cdk-lib/aws-secretsmanager";
import { Credentials } from "aws-cdk-lib/aws-rds";
import { InstanceType } from "aws-cdk-lib/aws-ec2";
import { EnvConfig } from "./env-config";
import { EnvType } from "./env-type";

interface WebAppServerStackProps extends StackProps {
  config: EnvConfig;
}

export class WebAppServerInfrastructureStack extends Stack {
  constructor(scope: Construct, id: string, props: WebAppServerStackProps) {
    super(scope, id, props);
    const idPrefix = props.config.stackName;
    const domainName = props.config.domain;
    const serverSubDomain = props.config.subdomain;
    const serverDomain = serverSubDomain + "." + domainName;

    //-------------------------------------------
    // Cognito Auth
    //-------------------------------------------

    // Cognito user pool
    const userPool = new cognito.UserPool(this, `${idPrefix}userpool`, {
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireDigits: true,
        requireUppercase: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
    });

    // User Pool Client attributes
    const standardCognitoAttributes = {
      givenName: true,
      familyName: true,
      email: true,
      emailVerified: true,
      address: true,
      birthdate: true,
      gender: true,
      locale: true,
      middleName: true,
      fullname: true,
      nickname: true,
      phoneNumber: true,
      phoneNumberVerified: true,
      profilePicture: true,
      preferredUsername: true,
      timezone: true,
      lastUpdateTime: true,
    };

    const clientReadAttributes =
      new cognito.ClientAttributes().withStandardAttributes(
        standardCognitoAttributes
      );

    const clientWriteAttributes =
      new cognito.ClientAttributes().withStandardAttributes({
        ...standardCognitoAttributes,
        emailVerified: false,
        phoneNumberVerified: false,
      });

    // User Pool Client
    const userPoolClient = new cognito.UserPoolClient(
      this,
      `${idPrefix}userpool-client`,
      {
        userPool,
        authFlows: {
          adminUserPassword: true,
          custom: true,
          userSrp: true,
        },
        supportedIdentityProviders: [
          cognito.UserPoolClientIdentityProvider.COGNITO,
        ],
        readAttributes: clientReadAttributes,
        writeAttributes: clientWriteAttributes,
      }
    );

    //-------------------------------------------
    // Security + VPC Setup
    //-------------------------------------------

    // CloudTrail bucket
    const cloudTrailBucket = new s3.Bucket(
      this,
      `${idPrefix}CloudTrailBucket`,
      {
        publicReadAccess: false,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        encryption: s3.BucketEncryption.S3_MANAGED,
        versioned: true,
      }
    );
    const cfnCloudTrailBucket = cloudTrailBucket.node
      .defaultChild as s3.CfnBucket;
    cfnCloudTrailBucket.addPropertyOverride(
      "VersioningConfiguration.Status",
      "Enabled"
    );

    // Enable CloudTrail
    new cloudTrail.Trail(this, `${idPrefix}CloudTrail`, {
      bucket: cloudTrailBucket,
    });

    // Create a new VPC and NAT Gateway
    const vpc = new ec2.Vpc(this, `${idPrefix}APIVpc`, {
      flowLogs: {
        apiVPCFlowLogs: { trafficType: ec2.FlowLogTrafficType.REJECT },
      },
    });

    // Create a cert for HTTPS
    const zone = r53.HostedZone.fromLookup(this, `${idPrefix}Zone`, {
      domainName: props.config.host,
    });
    const certificate = new cert.DnsValidatedCertificate(
      this,
      `${idPrefix}Cert`,
      {
        domainName: domainName,
        hostedZone: zone,
        subjectAlternativeNames: [`*.${domainName}`],
      }
    );

    //-------------------------------------------
    // Aurora Postgres Serverless v2 DB Cluster
    //-------------------------------------------

    // create database credentials
    const dbUsername = props.config.dbUsername;
    const dbName = props.config.dbName;
    const dbClusterName = `${idPrefix}-db-cluster`;
    const dbCredsSecret = new secret.Secret(this, `${idPrefix}DBCreds`, {
      secretName: `${idPrefix}DBCreds`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          username: dbUsername,
        }),
        excludePunctuation: true,
        includeSpace: false,
        generateStringKey: "password",
      },
    });
    const dbCreds = Credentials.fromSecret(dbCredsSecret);
    const dbCluster = new rds.DatabaseCluster(this, `${idPrefix}DB`, {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_14_4,
      }),
      instanceProps: { vpc: vpc, instanceType: new InstanceType("serverless") },
      credentials: dbCreds,
      defaultDatabaseName: dbName,
      clusterIdentifier: dbClusterName,
      storageEncrypted: true,
    });
    const minDBCap = this.isProd(props) ? 2 : 1;
    const maxDBCap = this.isProd(props) ? 8 : 2;
    Aspects.of(dbCluster).add({
      visit(node) {
        if (node instanceof rds.CfnDBCluster) {
          node.serverlessV2ScalingConfiguration = {
            minCapacity: minDBCap,
            maxCapacity: maxDBCap,
          };
        }
      },
    });

    //-------------------------------------------
    // ECR + ECS + Fargate for Backend Servers
    //-------------------------------------------

    // Create a new Amazon Elastic Container Service (ECS) cluster
    const cluster = new ecs.Cluster(this, `${idPrefix}Cluster`, {
      vpc: vpc,
    });

    // Create a Docker image and upload it to the Amazon Elastic Container Registry (ECR)
    const dockerImage = new ecr_assets.DockerImageAsset(
      this,
      `${idPrefix}Image`,
      {
        directory: "../server/app",
      }
    );

    // Run some servers on fargate containers
    const fargateService = new ecs_patterns.NetworkLoadBalancedFargateService(
      this,
      `${idPrefix}FargateService`,
      {
        cluster: cluster,
        cpu: this.isProd(props) ? 2048 : 1024,
        desiredCount: this.isProd(props) ? 2 : 1,
        taskImageOptions: {
          image: ecs.ContainerImage.fromDockerImageAsset(dockerImage),
          containerPort: 8080,
          secrets: {
            DB_CREDS: ecs.Secret.fromSecretsManager(dbCredsSecret),
            METRIPORT_API_KEY: ecs.Secret.fromSecretsManager(
              secret.Secret.fromSecretNameV2(
                this,
                props.config.secretNames.METRIPORT_API_KEY,
                props.config.secretNames.METRIPORT_API_KEY
              )
            ),
            METRIPORT_WEBHOOK_KEY: ecs.Secret.fromSecretsManager(
              secret.Secret.fromSecretNameV2(
                this,
                props.config.secretNames.METRIPORT_WEBHOOK_KEY,
                props.config.secretNames.METRIPORT_WEBHOOK_KEY
              )
            ),
          },
          environment: {
            NODE_ENV: "production",
            PORT: "8080",
            METRIPORT_API_URL: props.config.metriportApiUrl,
          },
        },
        memoryLimitMiB: this.isProd(props) ? 4096 : 2048,
        healthCheckGracePeriod: Duration.seconds(60),
        publicLoadBalancer: false,
      }
    );
    // This speeds up deployments so the tasks are swapped quicker.
    // See for details: https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-target-groups.html#deregistration-delay
    fargateService.targetGroup.setAttribute(
      "deregistration_delay.timeout_seconds",
      "17"
    );

    // This also speeds up deployments so the health checks have a faster turnaround.
    // See for details: https://docs.aws.amazon.com/elasticloadbalancing/latest/network/target-group-health-checks.html
    fargateService.targetGroup.configureHealthCheck({
      healthyThresholdCount: 2,
      interval: Duration.seconds(10),
    });

    // Access grant for Aurora DB
    dbCreds.secret?.grantRead(fargateService.taskDefinition.taskRole);
    dbCluster.connections.allowDefaultPortFrom(fargateService.service);

    // Hookup autoscaling based on 90% cpu/memory thresholds
    const scaling = fargateService.service.autoScaleTaskCount({
      minCapacity: this.isProd(props) ? 2 : 1,
      maxCapacity: this.isProd(props) ? 10 : 2,
    });
    scaling.scaleOnCpuUtilization("autoscale_cpu", {
      targetUtilizationPercent: 90,
      scaleInCooldown: Duration.minutes(2),
      scaleOutCooldown: Duration.seconds(30),
    });
    scaling.scaleOnMemoryUtilization("autoscale_mem", {
      targetUtilizationPercent: 90,
      scaleInCooldown: Duration.minutes(2),
      scaleOutCooldown: Duration.seconds(30),
    });

    // Allow the NLB to talk to fargate
    fargateService.service.connections.allowFrom(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.allTraffic(),
      "Allow traffic from within the VPC to the service secure port"
    );

    // Setup a private link so the API can talk to the NLB
    const link = new apig.VpcLink(this, `${idPrefix}link`, {
      targets: [fargateService.loadBalancer],
    });

    //-------------------------------------------
    // API Gateway
    //-------------------------------------------

    // Create a proxy integration for the gateway
    const integration = new apig.Integration({
      type: apig.IntegrationType.HTTP_PROXY,
      options: {
        connectionType: apig.ConnectionType.VPC_LINK,
        vpcLink: link,
        requestParameters: {
          "integration.request.path.proxy": "method.request.path.proxy",
        },
      },
      integrationHttpMethod: "ANY",
      uri: `http://${fargateService.loadBalancer.loadBalancerDnsName}/{proxy}`,
    });

    // Create the API Gateway
    const api = new apig.RestApi(this, `${idPrefix}api`, {
      defaultIntegration: integration,
      defaultCorsPreflightOptions: {
        allowOrigins: ["*"],
      },
    });

    // Add domain cert + record to support HTTPS
    api.addDomainName(`${idPrefix}Domain`, {
      domainName: serverDomain,
      certificate: certificate,
      securityPolicy: apig.SecurityPolicy.TLS_1_2,
    });
    new r53.ARecord(this, `${idPrefix}DomainRecord`, {
      recordName: serverDomain,
      zone: zone,
      target: r53.RecordTarget.fromAlias(new r53_targets.ApiGateway(api)),
    });

    // Create a proxy route to the fargate service with Cognito auth
    const authorizer = new apig.CognitoUserPoolsAuthorizer(
      this,
      `${idPrefix}user-pool-authorizer`,
      {
        cognitoUserPools: [userPool],
        identitySource: "method.request.header.Authorization",
      }
    );
    const proxy = new apig.ProxyResource(this, `${idPrefix}Proxy`, {
      parent: api.root,
      anyMethod: false,
    });
    proxy.addMethod("ANY", integration, {
      requestParameters: {
        "method.request.path.proxy": true,
      },
      authorizer: authorizer,
    });

    // create proxy for webhooks
    const webhookIntegration = new apig.Integration({
      type: apig.IntegrationType.HTTP_PROXY,
      options: {
        connectionType: apig.ConnectionType.VPC_LINK,
        vpcLink: link,
      },
      integrationHttpMethod: "POST",
      uri: `http://${fargateService.loadBalancer.loadBalancerDnsName}/webhook`,
    });
    const webhookResource = api.root.addResource("webhook");
    webhookResource.addMethod("POST", webhookIntegration);

    //-------------------------------------------
    // Output
    //-------------------------------------------
    new CfnOutput(this, "UserPoolId", {
      value: userPool.userPoolId,
    });
    new CfnOutput(this, "UserPoolWebClientId", {
      value: userPoolClient.userPoolClientId,
    });
    new CfnOutput(this, "AWSRegion", {
      value: props.env?.region!,
    });
    new CfnOutput(this, "APIGatewayUrl", {
      description: "API Gateway URL",
      value: api.url,
    });
    new CfnOutput(this, "DBCluster", {
      description: "DB Cluster",
      value: `${dbCluster.clusterEndpoint.hostname} ${dbCluster.clusterEndpoint.port} ${dbCluster.clusterEndpoint.socketAddress}`,
    });
  }

  private isProd(props: WebAppServerStackProps): boolean {
    return props.config.environmentType === EnvType.production;
  }
}
