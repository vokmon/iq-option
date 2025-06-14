import { BinaryOptionsDirection } from "@quadcode-tech/client-sdk-js";
import { TradingConfig } from "../models/TradingConfig";
import { TechnicalAnalysis } from "../utils/TechnicalAnalysis";

export class SignalGenerator {
  private readonly technicalAnalysis: TechnicalAnalysis;

  constructor(private readonly config: TradingConfig) {
    this.technicalAnalysis = new TechnicalAnalysis(config);
  }

  async processPrice(price: number): Promise<BinaryOptionsDirection | null> {
    this.technicalAnalysis.addPrice(price);

    if (
      this.technicalAnalysis.getHistoryLength() <
      this.config.minPriceHistoryLength
    ) {
      console.log(
        `⏳ กำลังรวบรวมข้อมูล: ${this.technicalAnalysis.getHistoryLength()}/${
          this.config.minPriceHistoryLength
        } จุด`
      );
      return null;
    }

    const { direction, confidence } = this.technicalAnalysis.predictDirection();

    if (confidence < this.config.minConfidence) {
      // console.log("⚠️ Confidence too low, skipping trade");
      return null;
    }

    // const indicators = this.technicalAnalysis.getIndicators();

    // Log detailed analysis
    // console.log("\n📊 Technical Analysis:");
    // console.log(
    //   `📈 EMA5: ${indicators.ema5.toFixed(
    //     5
    //   )} | EMA20: ${indicators.ema20.toFixed(5)}`
    // );
    // console.log(`📊 RSI: ${indicators.rsi.toFixed(2)}`);
    // console.log(
    //   `📊 MACD: ${indicators.macd.macd.toFixed(
    //     5
    //   )} | Signal: ${indicators.macd.signal.toFixed(5)}`
    // );
    // console.log(
    //   `📊 Bollinger Bands: Upper: ${indicators.bollinger.upper.toFixed(
    //     5
    //   )} | Lower: ${indicators.bollinger.lower.toFixed(5)}`
    // );
    // console.log(
    //   `📊 Stochastic: K: ${indicators.stochastic.k.toFixed(
    //     2
    //   )} | D: ${indicators.stochastic.d.toFixed(2)}`
    // );
    // console.log(
    //   `🎯 Direction: ${direction.toUpperCase()} | Confidence: ${(
    //     confidence * 100
    //   ).toFixed(2)}%`
    // );
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
}
