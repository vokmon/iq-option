// Load environment variables
const env = process.env;

// Import logger
import { initializeLoggers } from "./utils/AppLogger";
import { getGlobalEnvConfig } from "./models/environment/GlobalEnvConfig";
import path from "path";

// Create log folder
const globalConfig = getGlobalEnvConfig();
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const workerId = Bun.argv.slice(2)[3] as string;
const logFolderName = `trade_${workerId}_${timestamp}`;
const logFolderPath = path.join(globalConfig.LOG_PATH, logFolderName);

// Initialize loggers with the created folder
const { mainLogger } = initializeLoggers({
  logFolderPath,
});

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
    mainLogger.error(`Missing required environment variable: ${envVar}`);
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

async function start() {
  try {
    // Parse command line arguments
    const args = Bun.argv.slice(2);
    if (args.length !== 5) {
      mainLogger.error("❌ กรุณาระบุพารามิเตอร์ทั้งหมด");
      mainLogger.error(
        "ตัวอย่าง: bun start:trade <CANDLE_INTERVAL_SECONDS> <CANDLE_ANALYSIS_PERIOD_MINUTES> <MAX_TRADE_CYCLE> <INSTRUMENT_ID/INSTRUMENT_NAME> <BUY_AMOUNT>"
      );
      mainLogger.error("ตัวอย่าง: bun start:trade 15 15 1 1865 1");
      process.exit(1);
    }

    const candleIntervalSeconds = args[0] as string;
    const analysisPeriodMinutes = args[1] as string;
    const maxTradeCycle = args[2] as string;
    const instrumentId = args[3] as string;
    const buyAmount = args[4] as string;

    // Print trading configuration
    printTradingConfiguration(
      candleIntervalSeconds,
      analysisPeriodMinutes,
      maxTradeCycle,
      instrumentId,
      buyAmount
    );

    // Start trading service in a separate process
    const tradingProcess = Bun.spawn(["bun", "src/workers/TradingWorker.ts"], {
      env: {
        ...process.env,
        CANDLE_INTERVAL_SECONDS: candleIntervalSeconds,
        CANDLE_ANALYSIS_PERIOD_MINUTES: analysisPeriodMinutes,
        MAX_TRADE_CYCLES: maxTradeCycle,
        INSTRUMENT: instrumentId,
        BUY_AMOUNT: buyAmount,
        LOG_FOLDER_PATH: logFolderPath, // Pass log folder path to worker
      },
      stdio: ["inherit", "inherit", "inherit"],
    });

    await tradingProcess.exited;

    mainLogger.info(`✅ จบการทำงาน ${new Date().toLocaleString()}`);
  } catch (error) {
    mainLogger.error("❌ เกิดข้อผิดพลาด:", { error });
  }
}

start();

function printTradingConfiguration(
  candleIntervalSeconds: string,
  analysisPeriodMinutes: string,
  maxTradeCycle: string,
  instrumentId: string,
  buyAmount: string
): void {
  const configInfo = `
🚀 ========================= การตั้งค่าการเทรด ========================= 🚀
⚙️ พารามิเตอร์การเทรด:
   • รหัสสินทรัพย์:              ${instrumentId}
   • จำนวนเงินที่ซื้อ:            ${buyAmount}
   • จำนวนรอบสูงสุด (รอบ):     ${maxTradeCycle}

📊 การตั้งค่าการวิเคราะห์:
   • ระยะเวลาของแท่งเทียน: ${candleIntervalSeconds} วินาที
   • ระยะเวลาการวิเคราะห์: ${analysisPeriodMinutes} นาที
=======================================================================
`;

  mainLogger.info(configInfo);
}
