// Import logger
import { initializeLoggers } from "./utils/AppLogger";
import { getGlobalEnvConfig } from "./models/environment/GlobalEnvConfig";
import path from "path";
import { FirestoreRepo } from "./repository/firebase/firestore/firestore";

// Create log folder
const globalConfig = getGlobalEnvConfig();
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const workerId = "with_signals";
const logFolderName = `trade_${workerId}_${timestamp}`;
const logFolderPath = path.join(globalConfig.LOG_PATH, logFolderName);

// Initialize loggers with the created folder
const { mainLogger } = initializeLoggers({
  logFolderPath,
});

const signals = {
  "1": "Signal1M",
  "5": "Signal5MVip",
};

interface SignalInfo {
  instrument: string;
  direction: string;
  emoji: string;
  zone: string;
}

async function start() {
  let unsubscribe: (() => void) | null = null;
  try {
    // Parse command line arguments
    const args = Bun.argv.slice(2);
    if (args.length !== 4) {
      mainLogger.error("❌ กรุณาระบุพารามิเตอร์ทั้งหมด");
      mainLogger.error(
        "ตัวอย่าง: bun start:signal-trade <MAX_TOTAL_TRADE> <MAX_CONCURRENT_TRADE>  <MINUTE (1|5)> <BUY_AMOUNT>"
      );
      mainLogger.error("ตัวอย่าง: bun start:signal-trade 5 1 10");

      if (!Object.keys(signals).includes(args[2]!)) {
        mainLogger.error("❌ กรุณาระบุเวลาที่ถูกต้อง ตัวอย่าง: 1 หรือ 5");
        mainLogger.error("ตัวอย่าง: bun start:signal-trade 100 5 1 10");
        mainLogger.error("ตัวอย่าง: bun start:signal-trade 1005 5 10");
      }
      process.exit(1);
    }

    const maxTotalTrade = Number(args[0]);
    const maxConcurrentTrade = Number(args[1]);
    const minute = args[2];
    const buyAmount = Number(args[3]);

    const firestoreRepo = new FirestoreRepo();

    let currentCount = 0;
    let totalTrade = 0;

    unsubscribe = firestoreRepo.subscribeToCollection(
      signals[minute as keyof typeof signals],
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const data = change.doc.data();
            const createdAt = new Date(data?.created.seconds * 1000);
            const message = data?.message;
            mainLogger.info(
              `🔔 ได้รับสัญญาณการซื้อขาย: ${message} at ${createdAt.toLocaleString()}`
            );

            if (currentCount < maxConcurrentTrade) {
              currentCount++;
              const signalInfo = parseSignalMessage(message);
              logSignalExecution(
                signalInfo,
                args[2] || "0",
                currentCount,
                maxConcurrentTrade,
                createdAt,
                totalTrade,
                maxTotalTrade
              );

              Bun.spawn(["bun", "src/workers/TradeWorker.ts"], {
                env: {
                  ...process.env,
                  SIGNAL_DIRECTION: signalInfo.direction,
                  INSTRUMENT: signalInfo.instrument,
                  BUY_AMOUNT: String(buyAmount),
                  LOG_FOLDER_PATH: logFolderPath, // Pass log folder path to worker
                },
                stdio: ["inherit", "inherit", "inherit"],
                onExit: (_subprocess, code, signal) => {
                  currentCount--;
                  if (code === 0) {
                    totalTrade++;
                    const completionCode = code !== null ? String(code) : null;
                    logTradeCompletion(
                      signalInfo,
                      completionCode,
                      signal?.toString() ?? null,
                      totalTrade,
                      maxTotalTrade
                    );
                  } else {
                    const errorCode = code !== null ? String(code) : null;
                    logSignalError(signalInfo, errorCode, signal);
                  }

                  if (totalTrade >= maxTotalTrade) {
                    mainLogger.info(
                      `🚧 จำนวนการทำงานครบจำนวนที่กำหนด ${totalTrade}/${maxTotalTrade}`
                    );
                    if (unsubscribe) {
                      unsubscribe();
                    }
                    mainLogger.info("✅ จบการทำงาน...");
                    process.exit(0);
                  }

                  logWaitingForSignal(
                    currentCount,
                    maxConcurrentTrade,
                    totalTrade,
                    maxTotalTrade
                  );
                },
              });
            } else {
              mainLogger.info(
                `🚧 มีการซื้อขายอยู่มากกว่าจำนวนที่กำหนด ${currentCount}/${maxConcurrentTrade}`
              );
            }
          }
        });
      },
      {
        orderBy: { field: "created", direction: "desc" },
        limit: 1,
      }
    );

    // Handle Ctrl+C (SIGINT)
    process.on("SIGINT", () => {
      mainLogger.info("🛑 Received SIGINT (Ctrl+C). Cleaning up...");
      if (unsubscribe) {
        unsubscribe();
      }
      mainLogger.info("✅ Cleanup completed. Exiting");
      process.exit(0);
    });

    // Keep the process running
    await new Promise(() => {});
  } catch (error) {
    mainLogger.error("❌ เกิดข้อผิดพลาด:", { error });
  } finally {
    if (unsubscribe) {
      unsubscribe();
    }
  }
}

function parseSignalMessage(message: string): SignalInfo {
  const match = message.match(
    /\(([^)]+)\)\s*\|\s*(\w+)\s*([^\[]+)\s*\[([^\]]+)\]/
  );

  if (!match) {
    throw new Error(`Invalid signal message format: ${message}`);
  }

  const [, instrument, direction, emoji, zone] = match as [
    string,
    string,
    string,
    string,
    string
  ];

  return {
    instrument: instrument.trim(),
    direction: direction.trim(),
    emoji: emoji.trim(),
    zone: zone.trim(),
  };
}

function logSignalExecution(
  signalInfo: SignalInfo,
  buyAmount: string,
  currentCount: number,
  maxConcurrentTrade: number,
  createdAt: Date,
  totalTrade: number,
  maxTotalTrade: number
) {
  mainLogger.info(
    `\n🚀 ==================== เริ่มการทำงานกับสัญญาณการซื้อขาย ====================

📊 รายละเอียดสัญญาณ:
   • ทิศทาง: ${signalInfo.direction} | คู่เงิน: ${
      signalInfo.instrument
    } | โซน: ${signalInfo.zone} | จำนวนเงิน: ${buyAmount}
   • เวลาที่สัญญาณถูกส่ง: ${createdAt.toLocaleString()}

🔄 สถานะการทำงาน:
   • การทำงานปัจจุบัน: ${currentCount}/${maxConcurrentTrade}
   • จำนวนการทำงานทั้งหมด: ${totalTrade}/${maxTotalTrade}

=====================================================================\n`
  );
}

function logWaitingForSignal(
  currentCount: number,
  maxConcurrentTrade: number,
  totalTrade: number,
  maxTotalTrade: number
) {
  mainLogger.info(
    `\n⏳ ==================== รอสัญญาณการซื้อขายใหม่ ====================

📊 สถานะการทำงาน:
   • การทำงานปัจจุบัน: ${currentCount}/${maxConcurrentTrade}
   • จำนวนการทำงานทั้งหมด: ${totalTrade}/${maxTotalTrade}
   • พร้อมรับสัญญาณใหม่
=====================================================================\n`
  );
}

function logSignalError(
  signalInfo: SignalInfo,
  code: string | null,
  signal: number | null
) {
  mainLogger.error(
    `\n❌ ==================== เกิดข้อผิดพลาดระหว่างการทำงาน ====================

📊 รายละเอียดสัญญาณ:
   • ทิศทาง: ${signalInfo.direction} | คู่เงิน: ${
      signalInfo.instrument
    } | โซน: ${signalInfo.zone}

⚠️ รายละเอียดข้อผิดพลาด:
   • รหัสข้อผิดพลาด: ${code ?? "N/A"} | Error Signal: ${signal ?? "N/A"}
=====================================================================\n`
  );
}

function logTradeCompletion(
  signalInfo: SignalInfo,
  code: string | null,
  signal: string | null,
  totalTrade: number,
  maxTotalTrade: number
) {
  mainLogger.info(
    `\n✅ ==================== การทำงานของสัญญาณการซื้อขายจบลง ====================

📊 รายละเอียดสัญญาณ: ${signalInfo.direction} | ${signalInfo.instrument} | ${
      signalInfo.zone
    }

🔄 สถานะการทำงาน: รหัส ${code ?? "N/A"} | สัญญาณ ${
      signal ?? "N/A"
    } | จำนวน ${totalTrade}/${maxTotalTrade}
=====================================================================\n`
  );
}

start();
