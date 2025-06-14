import {
  ClientSdk,
  BalanceType,
  LoginPasswordAuthMethod,
  Balance,
} from "@quadcode-tech/client-sdk-js";
import { TradingConfig } from "../models/TradingConfig";
import { TradingService } from "../services/TradingService";
import { MaxCyclesReachedError } from "../errors/MaxCyclesReachedError";
import { TradingState } from "../models/TradingState";
import { calculateTradingStats } from "../utils/TradingStatsUtils";

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
  let tradingState: TradingState = new TradingState();
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

    const binaryOptions = await clientSdk.binaryOptions();
    const actives = binaryOptions.getActives();
    const active = actives.find(
      (active) => active.id === parseInt(env.INSTRUMENT_ID!)
    );
    if (!active) {
      throw new Error(`ไม่พบสินทรัพย์ที่ต้องการ: ${env.INSTRUMENT_ID}`);
    }

    // Create config from environment variables
    const config = new TradingConfig(parseFloat(env.BUY_AMOUNT!), active);

    // Create trading state
    tradingState = new TradingState();

    printBalanceAndConfigInfo(balance, config);

    console.log("\n\n🚀 เริ่มการทำงาน: ", new Date().toLocaleString());
    // Start trading service
    const tradingService = new TradingService(
      clientSdk,
      balance,
      config,
      tradingState
    );
    await tradingService.start();
  } catch (error) {
    if (error instanceof MaxCyclesReachedError) {
      printTradingSummary(tradingState);
      process.exit(0);
    } else {
      console.error("❌ เกิดข้อผิดพลาดใน trading worker:", error);
      console.log(`\n\n🔴 จบการทำงาน: ${new Date().toLocaleString()}`);
      process.exit(1);
    }
  }
}

function printBalanceAndConfigInfo(balance: Balance, config: TradingConfig) {
  console.log(
    "\n🚀 ================== Trading Information ================== 🚀"
  );
  console.log(`📅 Date: ${new Date().toLocaleString()}`);
  console.log("\n💰 Balance Details:");
  console.log(`   • Balance Type: ${balance.type}`);
  console.log(`   • Balance Amount: ${balance.amount}`);
  console.log(`   • Currency: ${balance.currency}`);
  console.log(`   • Account Type: ${env.IS_DEMO === "true" ? "Demo" : "Real"}`);
  console.log("\n⚙️ Configuration:");
  console.log(`   • Buy Amount: ${env.BUY_AMOUNT}`);
  console.log(`   • Instrument ID: ${env.INSTRUMENT_ID}`);
  console.log(`   • Config object: ${config.toString()}`);
  console.log("=========================================================\n");
}

function printTradingSummary(tradingState: TradingState) {
  console.log(
    "\n\n\n📊 ================== Trading Summary ================== 📊"
  );
  const stats = calculateTradingStats(tradingState.getResultOfPositions());

  // Print individual round results
  console.log("\n📝Individual Round Results:");
  tradingState.getResultOfPositions().forEach((position, index) => {
    const pnl = position.pnl || 0;
    const result = pnl > 0 ? "✅ WIN" : "❌ LOSS";
    console.log(`\n   Round ${index + 1}:`);
    console.log(`      • Result:     ${result}`);
    console.log(`      • PnL:        ${pnl.toFixed(2)}`);
    console.log(`      • Direction:  ${position.direction}`);
    console.log(`      • Invest:     ${position.invest}`);
    console.log(`      • Open Quote: ${position.openQuote}`);
    console.log(`      • Close Quote:${position.closeQuote}`);
  });

  console.log("\n\n--------------------------------\n\n");

  // Print overall performance
  console.log("\n 📈 Overall Trading Performance:");
  console.log(`     • Total Trades:     ${stats.totalTrades}`);
  console.log(`     • Winning Trades:   ${stats.totalWins}`);
  console.log(`     • Losing Trades:    ${stats.totalLosses}`);
  console.log(`     • Win Rate:         ${stats.winRate.toFixed(2)}%`);
  console.log(`     • Total PnL:        ${stats.totalPnL.toFixed(2)}`);
  console.log(
    `     • Maximum trade cycles reached: ${tradingState.getCurrentCycle()}`
  );
  console.log("=========================================================\n");
  console.log(`\n\nจบการทำงาน: ${new Date().toLocaleString()}`);
}
startTrading();
