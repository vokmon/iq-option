import { createWorkerLogger } from "../utils/AppLogger";
import { getTradeWorkerEnvConfig } from "../models/environment/TradeWorkerEnvConfig";
import { AiTradeController } from "../controller/AiTradeController";

// Get log folder path from environment
const logFolderPath = process.env.LOG_FOLDER_PATH;
if (!logFolderPath) {
  throw new Error("LOG_FOLDER_PATH environment variable is required");
}

// Get trade worker environment configuration
const tradeConfig = getTradeWorkerEnvConfig();

// Initialize worker logger with log folder path
const workerLogger = createWorkerLogger({
  logFolderPath,
  workerId: tradeConfig.INSTRUMENT.toString(),
});

// Validate required environment variables
const requiredEnvVars = [
  "MAX_TRADE_CYCLES",
  "INSTRUMENT",
  "BUY_AMOUNT",
] as const;

for (const envVar of requiredEnvVars) {
  if (!tradeConfig[envVar]) {
    workerLogger.error(`Missing required environment variable: ${envVar}`);
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

async function startTrading() {
  const tradingController = new AiTradeController();
  await tradingController.start();
  process.exit(0);
}

startTrading();
