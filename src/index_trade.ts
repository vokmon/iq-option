import {
  ClientSdk,
  BalanceType,
  LoginPasswordAuthMethod,
} from "@quadcode-tech/client-sdk-js";
import { TradingConfig } from "./models/TradingConfig";
import { TradingService } from "./services/TradingService";

// Load environment variables
const env = process.env;

// Validate required environment variables
const requiredEnvVars = [
  "API_URL",
  "ACCESS_TOKEN",
  "LOGIN_URL",
  "LOGIN_EMAIL",
  "LOGIN_PASSWORD",
] as const;

for (const envVar of requiredEnvVars) {
  if (!env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

async function start() {
  try {
    // Load configuration
    const config = fromCommandLine();
    console.log(
      `💰 กำลังเริ่มต้นการซื้อขายสำหรับ ${config.instrumentId} ด้วยจำนวน ${config.buyAmount}`
    );

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
        config.isDemo
          ? balance.type === BalanceType.Demo
          : balance.type === BalanceType.Real
      );

    if (!balance) {
      throw new Error(`ไม่พบ ${config.isDemo ? "demo" : "real"} balance`);
    }

    // Start trading service
    const tradingService = new TradingService(clientSdk, balance, config);
    await tradingService.start();
  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาด:", error);
    process.exit(1);
  }
}

const fromCommandLine = (): TradingConfig => {
  const args = Bun.argv.slice(2);
  if (args.length !== 2) {
    console.error("❌ กรุณาระบุ INSTRUMENT_ID และ BUY_AMOUNT");
    console.error("ตัวอย่าง: bun start:trade 1865 1");
    process.exit(1);
  }

  const instrumentId = parseInt(args[0] as string);
  const buyAmount = parseFloat(args[1] as string);

  if (isNaN(instrumentId) || isNaN(buyAmount)) {
    console.error("❌ INSTRUMENT_ID และ BUY_AMOUNT ต้องเป็นตัวเลข");
    process.exit(1);
  }

  return new TradingConfig(buyAmount, instrumentId);
};

start();
