export const getEnvVarOrFail = (varName: string): string => {
  const value = process.env[varName];
  if (!value || value.trim().length < 1) {
    throw new Error(`Missing ${varName} env var`);
  }
  return value;
};

export class Config {
  // env config
  static readonly PROD_ENV: string = "production";
  static readonly DEV_ENV: string = "dev";
  static readonly METRIPORT_API_KEY_HEADER = "x-api-key";
  static readonly METRIPORT_WEBHOOK_KEY_HEADER = "x-webhook-key";
  static isProdEnv(): boolean {
    return process.env.NODE_ENV === this.PROD_ENV;
  }

  static getMetriportApiUrl(): string {
    return getEnvVarOrFail("METRIPORT_API_URL");
  }

  static getMetriportApiKey(): string {
    return getEnvVarOrFail("METRIPORT_API_KEY");
  }

  static getMetriportWebhookKey(): string {
    return getEnvVarOrFail("METRIPORT_WEBHOOK_KEY");
  }
}
