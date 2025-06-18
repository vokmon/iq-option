import type {
  BinaryOptionsOption,
  Position,
} from "@quadcode-tech/client-sdk-js";
import type { TradingState } from "../../../models/TradingState";
import { getGlobalEnvConfig } from "../../../models/environment/GlobalEnvConfig";
import { createWorkerLogger } from "../../../utils/AppLogger";
import { getTradeWorkerEnvConfig } from "../../../models/environment/TradeWorkerEnvConfig";

export class PositionMonitorLogger {
  private readonly globalConfig = getGlobalEnvConfig();
  private readonly tradeConfig = getTradeWorkerEnvConfig();
  private readonly logger = createWorkerLogger({
    logFolderPath: process.env.LOG_FOLDER_PATH!,
    workerId: String(this.tradeConfig.INSTRUMENT),
  });

  constructor(private readonly tradingState: TradingState) {}

  logConnectionSuccess(order: BinaryOptionsOption): void {
    const currentTradeNumber = this.tradingState.getCurrentTradeNumber();
    const logMessage = `
🔄 ================= Trade #${currentTradeNumber} Connection to the server is successful: Order Details ================
  • Order ID: ${order.id}
  • Active ID: ${order.activeId}
  • Amount: ${order.price}
  • Direction: ${order.direction?.toUpperCase()}
  • Open Time: ${order.openedAt?.toLocaleString()}
  • Open Price: ${order.openQuoteValue}
  • Expired At: ${new Date(order.expiredAt).toLocaleString()}
===============================================================================================================`;
    this.logger.info(logMessage);
  }

  logPositionUpdate(position: Position): void {
    const currentTradeNumber = this.tradingState.getCurrentTradeNumber();
    const logMessage = `
📊 ==================== Trade #${currentTradeNumber} Position Update ====================
📈 Position Details:
   • Order ID: ${position.externalId}
   • Asset Name: ${position.active?.name}
   • Amount: ${position.invest}
   • Open Time: ${position.openTime?.toLocaleString()}
   • Open Price: ${position.openQuote}
   • Min Profit: ${this.globalConfig.SELL_WHEN_PROFIT_ABOVE_PERCENTAGE}%
   • กำไรที่ต้องการ: ${
     (position.invest || 0) *
     (this.globalConfig.SELL_WHEN_PROFIT_ABOVE_PERCENTAGE / 100)
   }

💰 Profit/Loss:
   • PNL: ${position.pnl}
   • Net PNL: ${position.pnlNet}
   • Sell Profit: ${position.sellProfit}

⚡ Status:
   • Direction: ${position.direction?.toUpperCase()}
   • Status: ${position.status}
   • Expiry: ${position?.expirationTime?.toLocaleString()}
=====================================================================\n`;

    this.logger.info(logMessage);
  }

  public logSellDecision(position: Position): void {
    const currentTradeNumber = this.tradingState.getCurrentTradeNumber();
    const logMessage = `
🎯 ==================== Trade #${currentTradeNumber} Sell Decision ====================

📊 รายละเอียดการซื้อ:
   • รหัสคำสั่งซื้อ: ${position.externalId}
   • ชื่อสินทรัพย์: ${position.active?.name}
   • Direction: ${position.direction?.toUpperCase()}
   • จำนวนเงินที่ซื้อ: ${position.invest}

💰 Profit Analysis:
   • PNL: ${position.pnl}
   • กำไรที่ต้องการ(%): ${this.globalConfig.SELL_WHEN_PROFIT_ABOVE_PERCENTAGE}%
   • กำไรที่ต้องการ: ${
     (position.invest || 0) *
     (this.globalConfig.SELL_WHEN_PROFIT_ABOVE_PERCENTAGE / 100)
   }
   • Current Quote: ${position.closeQuote}

✅ การตัดสินใจ:
   • การตัดสินใจ: ขายสินทรัพย์
   • เหตุผล: กำไรที่ต้องการถึงจุด
=====================================================================\n`;

    this.logger.info(logMessage);
  }
}
