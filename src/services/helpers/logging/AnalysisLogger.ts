import type { AnalysisResult } from "../../../models/Analysis";
import { createWorkerLogger } from "../../../utils/AppLogger";
import { getTradeWorkerEnvConfig } from "../../../models/environment/TradeWorkerEnvConfig";
import { getAnalysisEnvConfig } from "../../../models/environment/AnalysisEnvConfig";
import type { TradingState } from "../../../models/TradingState";

export class AnalysisLogger {
  private readonly tradeConfig = getTradeWorkerEnvConfig();
  private readonly analysisConfig = getAnalysisEnvConfig();
  private readonly logger = createWorkerLogger({
    logFolderPath: process.env.LOG_FOLDER_PATH!,
    workerId: String(this.tradeConfig.INSTRUMENT),
  });

  constructor(private readonly tradingState: TradingState) {}

  logCandleData(candles: any[]): void {
    const currentTradeNumber = this.tradingState.getCurrentTradeNumber();
    const startTime = new Date(Math.floor(candles[0]?.at! / 1000000));
    const endTime = new Date(
      Math.floor(candles[candles.length - 1]?.at! / 1000000)
    );

    const logMessage = `
📊 ==================== Trade #${currentTradeNumber} Candle Analysis ====================
📈 Candle Details:
   • Total Candles: ${candles.length}
   • Time Range: ${startTime.toLocaleString()} - ${endTime.toLocaleString()}
   • Interval: ${this.tradeConfig.CANDLE_INTERVAL_SECONDS} seconds
   • Analysis Period: ${this.tradeConfig.CANDLE_ANALYSIS_PERIOD_MINUTES} minutes
=====================================================================\n`;

    this.logger.info(logMessage);
  }

  logAnalysisResult(analysis: AnalysisResult): void {
    const currentTradeNumber = this.tradingState.getCurrentTradeNumber();
    const direction = analysis.direction
      ? analysis.direction.toUpperCase()
      : "NONE";

    const indicatorStrings = Object.values(analysis.indicators).map(
      (ind) => ind.string
    );

    const logMessage = `
📊 ==================== Trade #${currentTradeNumber} Analysis Result ====================
📈 Analysis Details:
   • Direction: ${direction}
   • Confidence: ${analysis.confidence}
   • Should Trade: ${analysis.shouldTrade ? "✅ YES" : "❌ NO"}
   • Minimum Required Confidence: ${
     this.analysisConfig.decision.MIN_CONFIDENCE_THRESHOLD
   }

📊 Technical Indicators:
   • ${indicatorStrings.join("\n   • ")}
=====================================================================
`;

    this.logger.info(logMessage);
  }

  logWaitingForNextAnalysis(): void {
    const currentTradeNumber = this.tradingState.getCurrentTradeNumber();
    const waitTime =
      this.analysisConfig.ANALYSIS_WAIT_TIME_BETWEEN_TRADES_SECONDS;

    const logMessage = `
⏳ ==================== Trade #${currentTradeNumber} Waiting ====================
🕒 Waiting Details:
   • Time: ${waitTime} seconds
   • Reason: No suitable trading conditions found
   • Next Analysis: ${new Date(Date.now() + waitTime * 1000).toLocaleString()}
=====================================================================\n`;

    this.logger.info(logMessage);
  }
}
