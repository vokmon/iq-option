import type { Indicator, IndicatorResult } from "./TechnicalIndicators";
import { getAnalysisEnvConfig } from "../../models/environment/AnalysisEnvConfig";
import { normalizeConfidence } from "./TechnicalIndicators";

export class StochasticIndicator implements Indicator {
  private readonly analysisConfig = getAnalysisEnvConfig();
  private previousK: number = this.analysisConfig.stochastic.DEFAULT_VALUE;
  private previousD: number = this.analysisConfig.stochastic.DEFAULT_VALUE;

  calculate(
    closes: number[],
    highs: number[],
    lows: number[]
  ): IndicatorResult {
    if (closes.length < this.analysisConfig.stochastic.PERIOD) {
      return {
        calculation: { value: this.previousK },
        signal: "neutral",
        confidence: 0,
        string: "Insufficient data",
      };
    }

    const { k, d } = this.calculateStochastic(closes, highs, lows);
    this.previousK = k;
    this.previousD = d;

    const signal = this.getSignal(k, d);
    const confidence = this.calculateConfidence(k, d);

    return {
      calculation: { value: k },
      signal,
      confidence,
      string: this.toString(k, d),
    };
  }

  private getSignal(k: number, d: number): "up" | "down" | "neutral" {
    const { OVERBOUGHT, OVERSOLD } = this.analysisConfig.stochastic;

    // Crossover signals
    if (this.previousK < this.previousD && k > d) {
      return "up";
    }
    if (this.previousK > this.previousD && k < d) {
      return "down";
    }

    // Overbought/Oversold signals
    if (k <= OVERSOLD && d <= OVERSOLD) {
      return "up";
    }
    if (k >= OVERBOUGHT && d >= OVERBOUGHT) {
      return "down";
    }

    return "neutral";
  }

  private calculateConfidence(k: number, d: number): number {
    const { OVERBOUGHT, OVERSOLD } = this.analysisConfig.stochastic;
    let confidence = 0;

    // Distance from extreme levels
    if (k <= OVERSOLD && d <= OVERSOLD) {
      confidence = Math.max(1 - k / OVERSOLD, 1 - d / OVERSOLD);
    } else if (k >= OVERBOUGHT && d >= OVERBOUGHT) {
      confidence = Math.max(
        1 - (100 - k) / (100 - OVERBOUGHT),
        1 - (100 - d) / (100 - OVERBOUGHT)
      );
    }

    // Crossover confirmation
    if (
      (this.previousK < this.previousD && k > d) ||
      (this.previousK > this.previousD && k < d)
    ) {
      confidence = Math.max(confidence, 0.7);
    }

    return normalizeConfidence(confidence);
  }

  private calculateStochastic(
    closes: number[],
    highs: number[],
    lows: number[]
  ): { k: number; d: number } {
    const { PERIOD, SMOOTHING } = this.analysisConfig.stochastic;
    const k = this.calculateK(closes, highs, lows, PERIOD);
    const d = this.calculateD(k, SMOOTHING);
    return { k, d };
  }

  private calculateK(
    closes: number[],
    highs: number[],
    lows: number[],
    period: number
  ): number {
    const currentClose = closes[closes.length - 1]!;
    const highestHigh = Math.max(...highs.slice(-period));
    const lowestLow = Math.min(...lows.slice(-period));

    if (highestHigh === lowestLow)
      return this.analysisConfig.stochastic.DEFAULT_VALUE;
    return ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
  }

  private calculateD(k: number, smoothing: number): number {
    return this.calculateSMA([k], smoothing);
  }

  private calculateSMA(data: number[], period: number): number {
    if (data.length < period) return data[0]!;
    const sum = data.slice(-period).reduce((a, b) => a + b, 0);
    return sum / period;
  }

  private toString(k: number, d: number): string {
    const signal = this.getSignal(k, d);
    const signalEmoji =
      signal === "up" ? "🔵" : signal === "down" ? "🔴" : "⚪";
    const signalText =
      signal === "up"
        ? "Oversold"
        : signal === "down"
        ? "Overbought"
        : "Neutral";
    const actionText =
      signal === "up"
        ? "Potential Buy"
        : signal === "down"
        ? "Potential Sell"
        : "No Clear Signal";

    return `Stochastic: ${signalEmoji} ${signalText} (K: ${k.toFixed(
      2
    )}, D: ${d.toFixed(2)}) | ${actionText} | Weight: ${
      this.analysisConfig.stochastic.WEIGHT
    }`;
  }

  getEmptyValue(): IndicatorResult {
    return {
      calculation: { value: this.analysisConfig.stochastic.DEFAULT_VALUE },
      signal: "neutral",
      confidence: 0,
      string: "Insufficient data",
    };
  }
}
