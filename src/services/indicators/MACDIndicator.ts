import type { Indicator, IndicatorResult } from "./TechnicalIndicators";
import { getAnalysisEnvConfig } from "../../models/environment/AnalysisEnvConfig";
import { normalizeConfidence } from "./TechnicalIndicators";

export class MACDIndicator implements Indicator {
  private readonly analysisConfig = getAnalysisEnvConfig();
  private previousMACD: number = 0;
  private previousSignal: number = 0;
  private previousHistogram: number = 0;

  calculate(closes: number[]): IndicatorResult {
    if (closes.length < this.analysisConfig.macd.SLOW_PERIOD) {
      return {
        calculation: { value: this.previousMACD },
        signal: "neutral",
        confidence: 0,
        string: "Insufficient data",
      };
    }

    const { macd, signal, histogram } = this.calculateMACD(closes);
    this.previousMACD = macd;
    this.previousSignal = signal;
    this.previousHistogram = histogram;

    const macdSignal = this.getSignal(macd, signal, histogram);
    const confidence = this.calculateConfidence(macd, signal, histogram);

    return {
      calculation: { value: macd },
      signal: macdSignal,
      confidence,
      string: this.toString(macd, signal, histogram),
    };
  }

  private getSignal(
    macd: number,
    signal: number,
    histogram: number
  ): "up" | "down" | "neutral" {
    const { THRESHOLD } = this.analysisConfig.macd;

    // Crossover detection
    if (this.previousMACD < this.previousSignal && macd > signal) {
      return "up";
    }
    if (this.previousMACD > this.previousSignal && macd < signal) {
      return "down";
    }

    // Threshold-based signals
    if (histogram > THRESHOLD) {
      return "up";
    }
    if (histogram < -THRESHOLD) {
      return "down";
    }

    return "neutral";
  }

  private calculateConfidence(
    macd: number,
    signal: number,
    histogram: number
  ): number {
    const { THRESHOLD } = this.analysisConfig.macd;
    let confidence = 0;

    // Histogram strength
    confidence = Math.min(Math.abs(histogram) / THRESHOLD, 1);

    // Crossover confirmation
    if (
      (this.previousMACD < this.previousSignal && macd > signal) ||
      (this.previousMACD > this.previousSignal && macd < signal)
    ) {
      confidence = Math.max(confidence, 0.7);
    }

    // Trend consistency
    if (Math.sign(histogram) === Math.sign(this.previousHistogram)) {
      confidence = Math.min(confidence * 1.2, 1);
    }

    return normalizeConfidence(confidence);
  }

  private calculateMACD(closes: number[]): {
    macd: number;
    signal: number;
    histogram: number;
  } {
    const { FAST_PERIOD, SLOW_PERIOD, SIGNAL_PERIOD } =
      this.analysisConfig.macd;

    const fastEMA = this.calculateEMA(closes, FAST_PERIOD);
    const slowEMA = this.calculateEMA(closes, SLOW_PERIOD);
    const macd = fastEMA - slowEMA;

    const signal = this.calculateEMA([macd], SIGNAL_PERIOD);
    const histogram = macd - signal;

    return { macd, signal, histogram };
  }

  private calculateEMA(data: number[], period: number): number {
    const multiplier = 2 / (period + 1);
    let ema = data[0]!;

    for (let i = 1; i < data.length; i++) {
      ema = (data[i]! - ema) * multiplier + ema;
    }

    return ema;
  }

  private toString(macd: number, signal: number, histogram: number): string {
    const macdSignal = this.getSignal(macd, signal, histogram);
    const signalEmoji =
      macdSignal === "up" ? "🔵" : macdSignal === "down" ? "🔴" : "⚪";
    const signalText =
      macdSignal === "up"
        ? "Bullish"
        : macdSignal === "down"
        ? "Bearish"
        : "Neutral";
    const actionText =
      macdSignal === "up"
        ? "Potential Buy"
        : macdSignal === "down"
        ? "Potential Sell"
        : "No Clear Signal";

    return `MACD: ${signalEmoji} ${signalText} (${macd.toFixed(
      2
    )}, ${signal.toFixed(2)}, ${histogram.toFixed(
      2
    )}) | ${actionText} | Weight: ${this.analysisConfig.macd.WEIGHT}`;
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
