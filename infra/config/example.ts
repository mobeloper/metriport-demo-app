import { EnvConfig } from "../lib/env-config";
import { EnvType } from "../lib/env-type";

export const config: EnvConfig = {
  stackName: "WebAppServerInfraStack",
  secretsStackName: "WebAppServerSecretsStack",
  environmentType: EnvType.production,
  region: "us-east-1",
  subdomain: "app-api",
  host: "myhealthapp.com",
  domain: "myhealthapp.com",
  dbName: "my_db",
  dbUsername: "my_db_user",
  secretNames: {
    METRIPORT_API_KEY: "METRIPORT_API_KEY",
    METRIPORT_WEBHOOK_KEY: "METRIPORT_WEBHOOK_KEY",
  },
  webApp: {
    stackName: "WebAppInfraStack",
    region: "us-east-1",
    subdomain: "app",
    domain: "myhealthapp.com",
    host: "myhealthapp.com",
  },
  metriportApiUrl: "https://api.metriport.com/",
};
export default config;
