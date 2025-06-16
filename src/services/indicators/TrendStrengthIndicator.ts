import type { Indicator, IndicatorResult } from "./TechnicalIndicators";
import { getAnalysisEnvConfig } from "../../models/environment/AnalysisEnvConfig";
import { normalizeConfidence } from "./TechnicalIndicators";

export class TrendStrengthIndicator implements Indicator {
  private readonly analysisConfig = getAnalysisEnvConfig();

  calculate(closes: number[]): IndicatorResult {
    if (closes.length < this.analysisConfig.trend.PERIOD) {
      return {
        calculation: { value: 0 },
        signal: "neutral",
        confidence: 0,
        string: "Insufficient data",
      };
    }

    const currentClose = closes[closes.length - 1]!;
    const { trendStrength, sma } = this.calculateTrendStrength(closes);
    const signal = this.getSignal(trendStrength, currentClose, sma);
    const confidence = this.calculateConfidence(trendStrength);

    return {
      calculation: { value: trendStrength },
      signal,
      confidence,
      string: this.toString(trendStrength, sma),
    };
  }

  private getSignal(
    trendStrength: number,
    currentClose: number,
    sma: number
  ): "up" | "down" | "neutral" {
    const { THRESHOLD } = this.analysisConfig.trend;

    if (Math.abs(trendStrength) > THRESHOLD) {
      return trendStrength > 0 ? "up" : "down";
    }
    return "neutral";
  }

  private calculateConfidence(trendStrength: number): number {
    const { THRESHOLD } = this.analysisConfig.trend;
    return normalizeConfidence(
      Math.min(Math.abs(trendStrength) / THRESHOLD, 1)
    );
  }

  private calculateTrendStrength(closes: number[]): {
    trendStrength: number;
    sma: number;
  } {
    const { PERIOD } = this.analysisConfig.trend;
    const sma = this.calculateSMA(closes, PERIOD);
    const currentClose = closes[closes.length - 1]!;

    // Calculate trend strength as percentage deviation from SMA
    const trendStrength = ((currentClose - sma) / sma) * 100;

    return { trendStrength, sma };
  }

  private calculateSMA(values: number[], period: number): number {
    const recentValues = values.slice(-period);
    return recentValues.reduce((sum, val) => sum + val, 0) / period;
  }

  private toString(trendStrength: number, sma: number): string {
    const signal = this.getSignal(trendStrength, 0, sma);
    const signalEmoji =
      signal === "up" ? "🔵" : signal === "down" ? "🔴" : "⚪";
    const signalText =
      signal === "up"
        ? "Strong Uptrend"
        : signal === "down"
        ? "Strong Downtrend"
        : "No Clear Trend";
    const actionText =
      signal === "up"
        ? "Potential Buy"
        : signal === "down"
        ? "Potential Sell"
        : "No Clear Signal";

    return `Trend: ${signalEmoji} ${signalText} (Strength: ${trendStrength.toFixed(
      2
    )}%, SMA: ${sma.toFixed(2)}) | ${actionText} | Weight: ${
      this.analysisConfig.trend.WEIGHT
    }`;
  }

  getEmptyValue(): IndicatorResult {
    return {
      calculation: { value: 0 },
      signal: "neutral",
      confidence: 0,
      string: "Insufficient data",
    };
  }
}
