import type {
  BinaryOptionsActive,
  Position,
} from "@quadcode-tech/client-sdk-js";
import type { TradingState } from "../../models/TradingState";
import { getTradeWorkerEnvConfig } from "../../models/environment/TradeWorkerEnvConfig";
import { createWorkerLogger } from "../../utils/AppLogger";
import { calculateTradingStats } from "../../utils/TradingStatsUtils";

export class TradingControllerLog {
  private readonly tradingConfig = getTradeWorkerEnvConfig();
  private readonly logger = createWorkerLogger({
    logFolderPath: process.env.LOG_FOLDER_PATH!,
    workerId: String(this.tradingConfig.INSTRUMENT),
  });

  constructor(private readonly tradingState: TradingState) {}

  logTradingPositionClosed(position: Position): void {
    const pnl = position.pnl || 0;
    const currentTradeNumber = this.tradingState.getCurrentTradeNumber();

    const logMessage = `
🏁 ==================== Trade #${currentTradeNumber} Position Closed ====================

📊 สรุปการซื้อ:
   • รหัสคำสั่งซื้อ: ${position.externalId}
   • ชื่อสินทรัพย์: ${position.active?.name}
   • Direction: ${position.direction?.toUpperCase()}
   • Status: ${position.status}
   • Close Reason: ${position.closeReason}

💰 รายละเอียดการซื้อ:
   • จำนวนเงินที่ซื้อ: ${position.invest}
   • ราคาเปิด: ${position.openQuote}
   • ราคาเลิกซื้อ: ${position.closeQuote}

📈 ผลลัพธ์:
   • PNL: ${pnl}
   • Net PNL: ${position.pnlNet}
   • ผลการซื้อ: ${pnl > 0 ? "✅ WIN" : pnl === 0 ? "🟡 DRAW" : "❌ LOSS"}
   • กำไร/ขาดทุน: ${pnl > 0 ? "+" : ""}${pnl}

🔄 Trading Progress:
   • Current Cycle: ${currentTradeNumber}
   • Max Cycles: ${this.tradingConfig.MAX_TRADE_CYCLES}
=====================================================================\n`;

    this.logger.info(logMessage);
  }

  printTradingSummary(tradingState: TradingState) {
    const stats = calculateTradingStats(tradingState.getResultOfPositions());
    const positions = tradingState.getResultOfPositions();

    const logMessage = `
📊 ==================== Trading Summary ====================

📝 Individual Round Results:
${positions
  .map((position, index) => {
    const pnl = position.pnl || 0;
    const result = pnl > 0 ? "✅ WIN" : pnl === 0 ? "🟡 DRAW" : "❌ LOSS";
    return `
   Round ${index + 1}:
      • Result: ${result}
      • PnL: ${pnl.toFixed(2)}
      • Direction: ${position.direction}
      • Invest: ${position.invest}
      • Open Quote: ${position.openQuote}
      • Close Quote: ${position.closeQuote}
      • Close Reason: ${position.closeReason}
      `;
  })
  .join("\n")}

📈 Overall Trading Performance:
   • Total Trades: ${stats.totalTrades}
   • Winning Trades: ${stats.totalWins}
   • Losing Trades: ${stats.totalLosses}
   • Win Rate: ${stats.winRate.toFixed(2)}%
   • Total PnL: ${stats.totalPnL.toFixed(2)}
   • Maximum trade cycles: ${this.tradingConfig.MAX_TRADE_CYCLES}

🏁 จบการทำงาน: ${new Date().toLocaleString()}
=====================================================================\n`;

    this.logger.info(logMessage);
  }

  public logTradingConfiguration(active: BinaryOptionsActive): void {
    const configInfo = `
▶️ ========================= เริ่มต้นการเทรด ${active.ticker} ========================= ▶️
🟢 เชื่อมต่อสำเร็จ!
⚙️ พารามิเตอร์การเทรด:
   • รหัสสินทรัพย์:              ${active.id}
   • ชื่อสินทรัพย์:               ${active.ticker}
   • จำนวนเงินที่ซื้อ:            ${this.tradingConfig.BUY_AMOUNT}
   • จำนวนรอบสูงสุด (รอบ):     ${this.tradingConfig.MAX_TRADE_CYCLES}
-------------------------------------------------------------------------\n\n
`;
    this.logger.info(configInfo);
  }
}
