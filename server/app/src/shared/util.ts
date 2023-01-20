import { AxiosRequestHeaders } from "axios";
import { Config } from "./config";

const metriportApiKey = Config.getMetriportApiKey();

export function buildMetriportAPIHeaders(): AxiosRequestHeaders {
  return { [Config.METRIPORT_API_KEY_HEADER]: metriportApiKey };
}
