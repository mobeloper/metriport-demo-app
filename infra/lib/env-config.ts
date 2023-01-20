import { EnvType } from "./env-type";

export interface EnvConfig {
  stackName: string;
  secretsStackName: string;
  environmentType: EnvType;
  region: string;
  subdomain: string;
  host: string;
  domain: string;
  dbName: string;
  dbUsername: string;
  secretNames: {
    METRIPORT_API_KEY: string;
    METRIPORT_WEBHOOK_KEY: string;
  };
  webApp: {
    stackName: string;
    region: string;
    subdomain: string;
    host: string;
    domain: string;
  };
  metriportApiUrl: string;
}
