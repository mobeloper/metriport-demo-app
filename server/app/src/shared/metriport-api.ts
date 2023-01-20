import { Metriport } from "@metriport/api";

import { Config } from "../shared/config";

export const metriportClient = new Metriport(Config.getMetriportApiKey(), Config.getMetriportApiUrl());

