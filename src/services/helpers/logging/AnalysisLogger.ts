import type { AnalysisResult } from "../../../models/Analysis";
import { createWorkerLogger } from "../../../utils/AppLogger";
import { getTradeWorkerEnvConfig } from "../../../models/environment/TradeWorkerEnvConfig";
import { getAnalysisEnvConfig } from "../../../models/environment/AnalysisEnvConfig";
import type { TradingState } from "../../../models/TradingState";
import type { BinaryOptionsActive, Candle } from "@quadcode-tech/client-sdk-js";

export class AnalysisLogger {
  private readonly tradeConfig = getTradeWorkerEnvConfig();
  private readonly analysisConfig = getAnalysisEnvConfig();
  private readonly logger = createWorkerLogger({
    logFolderPath: process.env.LOG_FOLDER_PATH!,
    workerId: String(this.tradeConfig.INSTRUMENT),
  });

  constructor(private readonly tradingState: TradingState) {}

  private formatTimeframeDetails(
    timeframeName: string,
    candles: Candle[],
    lookbackPeriod: number
  ): string {
    const startTime = new Date(Math.floor(candles[0]?.at! / 1000000));
    const endTime = new Date(
      Math.floor(candles[candles.length - 1]?.at! / 1000000)
    );

    return `📈 ${timeframeName} Details:
   • Total Candles: ${candles.length}
   • Time Range: ${startTime.toLocaleString()} - ${endTime.toLocaleString()}
   • Lookback Period: ${lookbackPeriod} periods`;
  }

  logCandleData(candles: {
    smallTimeframeCandles: Candle[];
    bigTimeframeCandles: Candle[];
    active: BinaryOptionsActive;
  }): void {
    const {
      MIN_CONFIDENCE_THRESHOLD,
      ANALYSIS_WAIT_TIME_BETWEEN_TRADES_SECONDS,
    } = this.analysisConfig;

    this.logger.info(`
📊 ==================== Trade #${this.tradingState.getCurrentTradeNumber()} Candle Analysis ====================
   • Instrument: ${candles.active.ticker} | ${candles.active.id}

${this.formatTimeframeDetails(
  `Small Timeframe (${this.analysisConfig.SMALL_TIME_FRAME_CANDLE_INTERVAL_MINUTES}m)`,
  candles.smallTimeframeCandles,
  this.analysisConfig.SMALL_TIME_FRAME_CANDLE_LOOKBACK_PERIODS
)}

${this.formatTimeframeDetails(
  `Big Timeframe (${this.analysisConfig.BIG_TIME_FRAME_CANDLE_INTERVAL_MINUTES}m)`,
  candles.bigTimeframeCandles,
  this.analysisConfig.BIG_TIME_FRAME_CANDLE_LOOKBACK_PERIODS
)}

📊 Analysis Configuration:
   • Minimum Confidence: ${MIN_CONFIDENCE_THRESHOLD}
   • Wait Time Between Trades: ${ANALYSIS_WAIT_TIME_BETWEEN_TRADES_SECONDS} seconds
=====================================================================\n`);
  }

  logAnalysisResult(
    analysis: AnalysisResult,
    active: BinaryOptionsActive
  ): void {
    const currentTradeNumber = this.tradingState.getCurrentTradeNumber();
    const direction = analysis.direction
      ? analysis.direction.toUpperCase()
      : "NONE";

    const directionEmoji =
      analysis.direction === "call"
        ? "⬆️"
        : analysis.direction === "put"
        ? "⬇️"
        : "↔️";

    const confidenceEmoji =
      analysis.confidence >= this.analysisConfig.MIN_CONFIDENCE_THRESHOLD
        ? "✅"
        : "";

    const indicatorStrings = Object.values(analysis.indicators).map(
      (ind) => ind.string
    );

    const logMessage = `
📊 ==================== Trade #${currentTradeNumber} Analysis Result ====================
📈 Analysis Details:
   • Instrument: ${active.ticker} | ${active.id}
   • Should Trade: ${analysis.shouldTrade ? "✅ YES" : "❌ NO"}
   • Direction: ${directionEmoji}  ${direction}
   • Confidence: ${confidenceEmoji} ${analysis.confidence}
   • Minimum Required Confidence: ${
     this.analysisConfig.MIN_CONFIDENCE_THRESHOLD
   }

📊 Technical Indicators:
${indicatorStrings.join("\n   • ")}
=====================================================================
`;

    this.logger.info(logMessage);
  }

  logWaitingForNextAnalysis(): void {
    const currentTradeNumber = this.tradingState.getCurrentTradeNumber();
    const waitTime =
      this.analysisConfig.ANALYSIS_WAIT_TIME_BETWEEN_TRADES_SECONDS;

    const logMessage = `
⏳ ======================== Trade #${currentTradeNumber} Waiting ========================
🕒 Waiting Details:
   • Time: ${waitTime} seconds
   • Next Analysis: ${new Date(Date.now() + waitTime * 1000).toLocaleString()}
=====================================================================\n`;

    this.logger.info(logMessage);
  }

  logWaitingForTradePurchaseEndTime(
    untilTargetTimeInMinutes: number,
    targetTime: Date
  ): void {
    const currentTradeNumber = this.tradingState.getCurrentTradeNumber();
    const waitTime =
      this.analysisConfig.WAIT_UNITIL_TRADE_PURCHASE_END_TIME_MINUTES;

    const logMessage = `
    ⏳ ======================== Trade #${currentTradeNumber} Waiting for Trade Purchase End Time ========================
    🕒 Time: Wait for ${waitTime} minutes | Time: ${targetTime.toLocaleString()}
    =====================================================================\n`;

    this.logger.info(logMessage);
  }
}
