import type { AnalysisEnvConfig } from "./AnalysisEnvConfig";
import { getAnalysisEnvConfig } from "./AnalysisEnvConfig";

export interface GlobalEnvConfig {
  // API Configuration
  API_URL: string;
  ACCESS_TOKEN: string;
  LOGIN_URL: string;
  LOGIN_EMAIL: string;
  LOGIN_PASSWORD: string;
  IS_REAL: boolean;

  // Logger Configuration
  LOG_PATH: string;
  LOG_TO_FILE: string;

  // Trade Configuration
  SELL_WHEN_PROFIT_ABOVE_PERCENTAGE: number;
}

export function getGlobalEnvConfig(): GlobalEnvConfig {
  return {
    // API Configuration
    API_URL: process.env.API_URL || "wss://iqoption.com/echo/websocket",
    ACCESS_TOKEN: process.env.ACCESS_TOKEN || "82",
    LOGIN_URL: process.env.LOGIN_URL || "https://api.iqoption.com",
    LOGIN_EMAIL: process.env.LOGIN_EMAIL || "",
    LOGIN_PASSWORD: process.env.LOGIN_PASSWORD || "",
    IS_REAL: process.env.IS_REAL === "true",

    // Logger Configuration
    LOG_PATH: process.env.LOG_PATH || "/logs",
    LOG_TO_FILE: process.env.LOG_TO_FILE || "true",

    // Trade Configuration
    SELL_WHEN_PROFIT_ABOVE_PERCENTAGE:
      Number(process.env.SELL_WHEN_PROFIT_ABOVE_PERCENTAGE) || 25,
  };
}
