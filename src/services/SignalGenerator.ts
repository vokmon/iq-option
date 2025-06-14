import { BinaryOptionsDirection } from "@quadcode-tech/client-sdk-js";
import { TradingConfig } from "../models/TradingConfig";
import { TechnicalAnalysis } from "../utils/TechnicalAnalysis";
import { TradingState } from "../models/TradingState";

export class SignalGenerator {
  private readonly technicalAnalysis: TechnicalAnalysis;

  constructor(
    private readonly config: TradingConfig,
    private readonly tradingState: TradingState
  ) {
    this.technicalAnalysis = new TechnicalAnalysis(config);
  }

  async processPrice(price: number): Promise<BinaryOptionsDirection | null> {
    this.technicalAnalysis.addPrice(price);

    const currentLength = this.technicalAnalysis.getHistoryLength();
    if (currentLength <= this.config.minPriceHistoryLength) {
      // Only show log if there's no active order
      if (!this.tradingState.getHasActiveOrder()) {
        console.log(
          `🗂️ กำลังรวบรวมข้อมูล: ${currentLength}/${this.config.minPriceHistoryLength} จุด`
        );
      }
      if (currentLength < this.config.minPriceHistoryLength) {
        return null;
      }
    }

    const { direction, confidence } = this.technicalAnalysis.predictDirection();

    if (confidence < this.config.minConfidence) {
      if (!this.tradingState.getHasActiveOrder()) {
        console.log(
          "\n--------------------------------",
          `⚠️ (การซื้อรอบที่ ${this.tradingState.getCurrentCycle()}) Confidence too low: ${(
            confidence * 100
          ).toFixed(2)}% < ${(this.config.minConfidence * 100).toFixed(
            2
          )}% required (Predicted: ${direction.toUpperCase()})`,
          "--------------------------------"
        );
      }
      return null;
    }

    const indicators = this.technicalAnalysis.getIndicators();
    this.printTechnicalAnalysisReport(indicators, direction, confidence);
    return this.determineDirection(direction);
  }

  private determineDirection(
    direction: "call" | "put" | "neutral"
  ): BinaryOptionsDirection | null {
    switch (direction) {
      case "call":
        // console.log(
        //   "🔼 สัญญาณ Call: Multiple indicators suggest upward movement"
        // );
        return BinaryOptionsDirection.Call;
      case "put":
        // console.log(
        //   "🔽 สัญญาณ Put: Multiple indicators suggest downward movement"
        // );
        return BinaryOptionsDirection.Put;
      default:
        // console.log("⚪ No clear signal: Market is neutral");
        return null;
    }
  }

  private printTechnicalAnalysisReport(
    indicators: ReturnType<typeof TechnicalAnalysis.prototype.getIndicators>,
    direction: "call" | "put" | "neutral",
    confidence: number
  ) {
    if (!this.tradingState.getHasActiveOrder()) {
      console.log(
        `\n================== Technical Analysis Report การซื้อรอบที่ ${this.tradingState.getCurrentCycle()} ================== 📊`
      );
      console.log(` ⏰ Time: ${new Date().toLocaleString()}`);

      // Moving Averages
      console.log("\n 📈 Moving Averages:");
      console.log(`     • EMA5:  ${indicators.ema5.toFixed(5)}`);
      console.log(`     • EMA20: ${indicators.ema20.toFixed(5)}`);

      // Momentum Indicators
      console.log("\n 🔄 Momentum Indicators:");
      console.log(`     • RSI:    ${indicators.rsi.toFixed(2)}`);
      console.log(`     • MACD:   ${indicators.macd.macd.toFixed(5)}`);
      console.log(`     • Signal: ${indicators.macd.signal.toFixed(5)}`);

      // Volatility Indicators
      console.log("\n 📊 Volatility Indicators:");
      console.log(
        `     • Bollinger Upper: ${indicators.bollinger.upper.toFixed(5)}`
      );
      console.log(
        `     • Bollinger Lower: ${indicators.bollinger.lower.toFixed(5)}`
      );

      // Stochastic
      console.log("\n 📉 Stochastic:");
      console.log(`     • K: ${indicators.stochastic.k.toFixed(2)}`);
      console.log(`     • D: ${indicators.stochastic.d.toFixed(2)}`);

      // Trading Signal
      console.log("\n 🎯 Trading Signal:");
      console.log(`     • Direction:   ${direction.toUpperCase()}`);
      console.log(`     • Confidence:  ${(confidence * 100).toFixed(2)}%`);

      console.log("==================================================\n");
    }
  }
}
