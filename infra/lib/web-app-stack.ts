import { CfnOutput, Duration, Stack, StackProps } from "aws-cdk-lib";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import * as cloudfront_origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { EnvConfig } from "./env-config";

interface WebAppStackProps extends StackProps {
  config: EnvConfig;
}

export class WebAppStack extends Stack {
  constructor(scope: Construct, id: string, props: WebAppStackProps) {
    super(scope, id, props);
    const idPrefix = props.config.stackName;
    const webAppConfig = props.config.webApp;
    const domainName = webAppConfig.domain;
    const siteSubDomain = webAppConfig.subdomain;
    const siteDomain = siteSubDomain + "." + domainName;

    // S3 bucket that holds the web app src
    const siteBucket = new s3.Bucket(this, `${idPrefix}Bucket`, {
      bucketName: siteDomain,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    // Grant Cloudfront access to the web app bucket
    const cloudfrontOAI = new cloudfront.OriginAccessIdentity(
      this,
      `${idPrefix}cloudfront-OAI`,
      {
        comment: `OriginAccessIdentity for ${idPrefix}`,
      }
    );
    siteBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ["s3:GetObject"],
        resources: [siteBucket.arnForObjects("*")],
        principals: [
          new iam.CanonicalUserPrincipal(
            cloudfrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId
          ),
        ],
      })
    );

    // Create TLS certificate
    const zone = route53.HostedZone.fromLookup(this, `${idPrefix}Zone`, {
      domainName: webAppConfig.host,
    });
    const certificate = new acm.DnsValidatedCertificate(
      this,
      `${idPrefix}Certificate`,
      {
        domainName: siteDomain,
        hostedZone: zone,
        region: "us-east-1", // Cloudfront only checks this region for certificates.
      }
    );

    // CloudFront distribution
    const distribution = new cloudfront.Distribution(
      this,
      `${idPrefix}Distribution`,
      {
        certificate: certificate,
        defaultRootObject: "index.html",
        domainNames: [siteDomain],
        minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
        errorResponses: [
          {
            httpStatus: 403,
            responseHttpStatus: 200,
            responsePagePath: "/index.html",
            ttl: Duration.minutes(30),
          },
          {
            httpStatus: 404,
            responseHttpStatus: 200,
            responsePagePath: "/index.html",
            ttl: Duration.minutes(30),
          },
        ],
        defaultBehavior: {
          origin: new cloudfront_origins.S3Origin(siteBucket, {
            originAccessIdentity: cloudfrontOAI,
          }),
          compress: true,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
      }
    );

    // Route53 alias record for the CloudFront distribution
    new route53.ARecord(this, `${idPrefix}AliasRecord`, {
      recordName: siteDomain,
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(distribution)
      ),
      zone,
    });

    // Deploy site contents to S3 bucket
    new s3deploy.BucketDeployment(this, `${idPrefix}DeployWithInvalidation`, {
      sources: [s3deploy.Source.asset("../web-app/app/build")],
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: ["/*"],
    });

    new CfnOutput(this, "Site", { value: "https://" + siteDomain });
    new CfnOutput(this, "DistributionId", {
      value: distribution.distributionId,
    });
  }
}
