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
    // Parse command line arguments
    const args = Bun.argv.slice(2);
    if (args.length !== 2) {
      console.error("❌ กรุณาระบุ INSTRUMENT_ID และ BUY_AMOUNT");
      console.error("ตัวอย่าง: bun start:trade 1865 1");
      process.exit(1);
    }

    const instrumentId = args[0] as string;
    const buyAmount = args[1] as string;

    if (isNaN(parseInt(instrumentId)) || isNaN(parseFloat(buyAmount))) {
      console.error("❌ INSTRUMENT_ID และ BUY_AMOUNT ต้องเป็นตัวเลข");
      process.exit(1);
    }

    console.log(
      `💰 กำลังเริ่มต้นการซื้อขายสำหรับ ${instrumentId} ด้วยจำนวน ${buyAmount}`
    );

    // Start trading service in a separate process
    const tradingProcess = Bun.spawn(["bun", "src/workers/trading_worker.ts"], {
      env: {
        ...process.env,
        INSTRUMENT_ID: instrumentId,
        BUY_AMOUNT: buyAmount,
      },
      stdio: ["inherit", "inherit", "inherit"],
    });

    // Wait for the trading process to complete
    await tradingProcess.exited;
    console.log("✅ Trading process completed");
  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาด:", error);
    process.exit(1);
  }
}

start();
