import { createWorkerLogger } from "../utils/AppLogger";
import { getTradeWorkerEnvConfig } from "../models/environment/TradeWorkerEnvConfig";
import { SignalAiTradeController } from "../controller/SignalAiTradeController";

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
  "INSTRUMENT",
  "SIGNAL_DIRECTION",
  "BUY_AMOUNT",
] as const;

for (const envVar of requiredEnvVars) {
  if (!tradeConfig[envVar]) {
    workerLogger.error(`Missing required environment variable: ${envVar}`);
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

async function startTrading() {
  const tradingController = new SignalAiTradeController();
  await tradingController.start();
  process.exit(0);
}

startTrading();
