import type { Candle } from "@quadcode-tech/client-sdk-js";
import { BinaryOptionsDirection } from "@quadcode-tech/client-sdk-js";
import { SupportResistanceIndicator } from "./indicators/SupportResistanceIndicator";
import { getAnalysisEnvConfig } from "../models/environment/AnalysisEnvConfig";
import type { AnalysisResult } from "../models/Analysis";

export class SupportResistanceAnalysisService {
  private readonly indicator = new SupportResistanceIndicator();
  private readonly config = getAnalysisEnvConfig();

  public analyzeCandles({
    smallTimeframeCandles,
    bigTimeframeCandles,
  }: {
    smallTimeframeCandles: Candle[]; // 20 fifteen-minute candles
    bigTimeframeCandles: Candle[]; // 20 sixty-minute candles
  }): AnalysisResult {
    // Set the timeframe data in the indicator
    this.indicator.setTimeframeData(smallTimeframeCandles, bigTimeframeCandles);

    // Calculate using the small timeframe closes
    const closes = smallTimeframeCandles.map((c) => c.close);
    const result = this.indicator.calculate(closes);

    // Only trade if confidence meets or exceeds the threshold
    const shouldTrade =
      result.signal !== "neutral" &&
      result.confidence >= this.config.MIN_CONFIDENCE_THRESHOLD;

    return {
      direction:
        result.signal === "up"
          ? BinaryOptionsDirection.Call
          : result.signal === "down"
          ? BinaryOptionsDirection.Put
          : null,
      confidence: result.confidence,
      shouldTrade,
      indicators: {
        supportResistance: {
          ...result.calculation,
          string: result.string,
        },
      },
    };
  }
}
