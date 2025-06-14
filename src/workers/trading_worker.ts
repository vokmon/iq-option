import {
  ClientSdk,
  BalanceType,
  LoginPasswordAuthMethod,
} from "@quadcode-tech/client-sdk-js";
import { TradingConfig } from "../models/TradingConfig";
import { TradingService } from "../services/TradingService";
import { MaxCyclesReachedError } from "../errors/MaxCyclesReachedError";

// Load environment variables
const env = process.env;

// Validate required environment variables
const requiredEnvVars = [
  "API_URL",
  "ACCESS_TOKEN",
  "LOGIN_URL",
  "LOGIN_EMAIL",
  "LOGIN_PASSWORD",
  "INSTRUMENT_ID",
  "BUY_AMOUNT",
] as const;

for (const envVar of requiredEnvVars) {
  if (!env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

async function startTrading() {
  try {
    // Initialize SDK
    const clientSdk = await ClientSdk.create(
      env.API_URL!,
      parseInt(env.ACCESS_TOKEN!),
      new LoginPasswordAuthMethod(
        env.LOGIN_URL!,
        env.LOGIN_EMAIL!,
        env.LOGIN_PASSWORD!
      )
    );

    // Get balance based on isDemo from config
    const balances = await clientSdk.balances();
    const balance = balances
      .getBalances()
      .find((balance) =>
        env.IS_DEMO === "true"
          ? balance.type === BalanceType.Demo
          : balance.type === BalanceType.Real
      );

    if (!balance) {
      throw new Error(
        `ไม่พบ ${env.IS_DEMO === "true" ? "demo" : "real"} balance`
      );
    }

    // Create config from environment variables
    const config = new TradingConfig(
      parseFloat(env.BUY_AMOUNT!),
      parseInt(env.INSTRUMENT_ID!)
    );

    // Start trading service
    const tradingService = new TradingService(clientSdk, balance, config);
    await tradingService.start();
  } catch (error) {
    if (error instanceof MaxCyclesReachedError) {
      console.log(error.message);
      process.exit(0);
    } else {
      console.error("❌ เกิดข้อผิดพลาดใน trading worker:", error);
      process.exit(1);
    }
  }
}

startTrading();
