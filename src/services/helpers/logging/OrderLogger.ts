import type {
  BinaryOptionsDirection,
  Balance,
  BinaryOptionsOption,
} from "@quadcode-tech/client-sdk-js";
import { createWorkerLogger } from "../../../utils/AppLogger";
import { getTradeWorkerEnvConfig } from "../../../models/environment/TradeWorkerEnvConfig";
import type { TradingState } from "../../../models/TradingState";

export class OrderLogger {
  private readonly tradeConfig = getTradeWorkerEnvConfig();
  private readonly logger = createWorkerLogger({
    logFolderPath: process.env.LOG_FOLDER_PATH!,
    workerId: String(this.tradeConfig.INSTRUMENT),
  });

  constructor(private readonly tradingState: TradingState) {}

  logOrderStart(params: {
    instrumentId: number;
    direction: BinaryOptionsDirection;
    amount: number;
    balance: Balance;
  }): void {
    const currentTradeNumber = this.tradingState.getCurrentTradeNumber();
    const logMessage = `
🔄 ==================== Trade #${currentTradeNumber} Order ====================
📊 Details:
   • Direction: ${params.direction.toUpperCase()}
   • Amount: ${params.amount}
   • Balance: ${params.balance.amount} ${params.balance.currency}
=====================================================================\n`;

    this.logger.info(logMessage);
  }

  logOrderComplete(callOption: BinaryOptionsOption): void {
    const currentTradeNumber = this.tradingState.getCurrentTradeNumber();
    const orderComplete = `
✅ ==================== Trade #${currentTradeNumber} Order is created ====================
📊 Result:
   • Order ID:         ${callOption.id}
   • Order Expired At: ${new Date(callOption.expiredAt).toLocaleString()}
=====================================================================\n`;
    this.logger.info(orderComplete);
  }

  logError(message: string, details: Record<string, any>): void {
    const currentTradeNumber = this.tradingState.getCurrentTradeNumber();
    const errorMessage = `
❌ ==================== Trade #${currentTradeNumber} Error ====================
📊 Details:
   • Message: ${message}
   ${Object.entries(details)
     .map(([key, value]) => `   • ${key}: ${value}`)
     .join("\n")}
=====================================================================\n`;
    this.logger.error(errorMessage);
  }
}
