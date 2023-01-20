import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as secret from "aws-cdk-lib/aws-secretsmanager";
import { EnvConfig } from "./env-config";

interface SecretsStackProps extends StackProps {
  config: EnvConfig;
}

export class SecretsStack extends Stack {
  constructor(scope: Construct, id: string, props: SecretsStackProps) {
    super(scope, id, props);

    //-------------------------------------------
    // Init secrets for the infra stack
    //-------------------------------------------

    // create secret to hold the Metriport API key
    const metriportAPIKeyName = props.config.secretNames.METRIPORT_API_KEY;
    const metriportAPIKey = new secret.Secret(this, metriportAPIKeyName, {
      secretName: metriportAPIKeyName,
    });

    // create secret to hold the Metriport Webhook key
    const metriportWebhookKeyName =
      props.config.secretNames.METRIPORT_WEBHOOK_KEY;
    const metriportWebhookKey = new secret.Secret(
      this,
      metriportWebhookKeyName,
      {
        secretName: metriportWebhookKeyName,
      }
    );

    //-------------------------------------------
    // Output
    //-------------------------------------------
    new CfnOutput(this, `${metriportAPIKeyName} ARN`, {
      value: metriportAPIKey.secretArn,
    });
    new CfnOutput(this, `${metriportWebhookKeyName} ARN`, {
      value: metriportWebhookKey.secretArn,
    });
  }
}
