import type { Indicator, IndicatorResult } from "./TechnicalIndicators";
import { getAnalysisEnvConfig } from "../../models/environment/AnalysisEnvConfig";
import { normalizeConfidence } from "./TechnicalIndicators";

export class BollingerBandsIndicator implements Indicator {
  private readonly analysisConfig = getAnalysisEnvConfig();

  calculate(closes: number[]): IndicatorResult {
    if (closes.length < this.analysisConfig.bollinger.PERIOD) {
      return {
        calculation: { value: 0 },
        signal: "neutral",
        confidence: 0,
        string: "Insufficient data",
      };
    }

    const { upper, middle, lower, bandwidth } =
      this.calculateBollingerBands(closes);
    const currentClose = closes[closes.length - 1]!;

    const signal = this.getSignal(
      currentClose,
      upper,
      middle,
      lower,
      bandwidth
    );
    const confidence = this.calculateConfidence(
      currentClose,
      upper,
      middle,
      lower,
      bandwidth
    );

    return {
      calculation: { value: bandwidth },
      signal,
      confidence,
      string: this.toString(currentClose, upper, middle, lower, bandwidth),
    };
  }

  private getSignal(
    close: number,
    upper: number,
    middle: number,
    lower: number,
    bandwidth: number
  ): "up" | "down" | "neutral" {
    const { SQUEEZE_THRESHOLD, VOLATILITY_THRESHOLD } =
      this.analysisConfig.bollinger;

    // Price touching bands
    if (close <= lower) {
      return "up";
    }
    if (close >= upper) {
      return "down";
    }

    // Volatility signals
    if (bandwidth > VOLATILITY_THRESHOLD) {
      return close > middle ? "up" : "down";
    }

    // Squeeze signals
    if (bandwidth < SQUEEZE_THRESHOLD) {
      return close > middle ? "up" : "down";
    }

    return "neutral";
  }

  private calculateConfidence(
    close: number,
    upper: number,
    middle: number,
    lower: number,
    bandwidth: number
  ): number {
    let confidence = 0;

    // Distance from bands
    if (close <= lower || close >= upper) {
      const distance = Math.min(
        Math.abs(close - lower),
        Math.abs(close - upper)
      );
      const range = upper - lower;
      confidence = 1 - distance / range;
    } else {
      // Distance from middle
      const distance = Math.abs(close - middle);
      const range = upper - lower;
      confidence = 1 - distance / (range / 2);
    }

    return normalizeConfidence(confidence);
  }

  private calculateBollingerBands(closes: number[]): {
    upper: number;
    middle: number;
    lower: number;
    bandwidth: number;
  } {
    const { PERIOD, DEVIATIONS } = this.analysisConfig.bollinger;
    const sma = this.calculateSMA(closes, PERIOD);
    const stdDev = this.calculateStandardDeviation(closes, sma, PERIOD);

    const upper = sma + DEVIATIONS * stdDev;
    const middle = sma;
    const lower = sma - DEVIATIONS * stdDev;
    const bandwidth = (upper - lower) / middle;

    return { upper, middle, lower, bandwidth };
  }

  private calculateSMA(data: number[], period: number): number {
    if (data.length < period) return 0;
    const sum = data.slice(-period).reduce((a, b) => a + b, 0);
    return sum / period;
  }

  private calculateStandardDeviation(
    data: number[],
    mean: number,
    period: number
  ): number {
    if (data.length < period) return 0;
    const squaredDiffs = data
      .slice(-period)
      .map((value) => Math.pow(value - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
    return Math.sqrt(variance);
  }

  private toString(
    close: number,
    upper: number,
    middle: number,
    lower: number,
    bandwidth: number
  ): string {
    const signal = this.getSignal(close, upper, middle, lower, bandwidth);
    const signalEmoji =
      signal === "up" ? "🔵" : signal === "down" ? "🔴" : "⚪";
    const signalText =
      signal === "up" ? "Bullish" : signal === "down" ? "Bearish" : "Neutral";
    const actionText =
      signal === "up"
        ? "Potential Buy"
        : signal === "down"
        ? "Potential Sell"
        : "No Clear Signal";

    return `BB: ${signalEmoji} ${signalText} (${close.toFixed(
      2
    )} | ${upper.toFixed(2)}, ${middle.toFixed(2)}, ${lower.toFixed(
      2
    )}) | ${actionText} | Weight: ${this.analysisConfig.bollinger.WEIGHT}`;
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
