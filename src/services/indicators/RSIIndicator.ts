import type { Indicator, IndicatorResult } from "./TechnicalIndicators";
import { getAnalysisEnvConfig } from "../../models/environment/AnalysisEnvConfig";
import { normalizeConfidence } from "./TechnicalIndicators";

export class RSIIndicator implements Indicator {
  private readonly analysisConfig = getAnalysisEnvConfig();
  private previousRSI: number = this.analysisConfig.rsi.NEUTRAL;

  calculate(closes: number[]): IndicatorResult {
    if (closes.length < this.analysisConfig.rsi.PERIOD) {
      return {
        calculation: { value: this.previousRSI },
        signal: "neutral",
        confidence: 0,
        string: "Insufficient data",
      };
    }

    const rsi = this.calculateRSI(closes);
    this.previousRSI = rsi;

    const signal = this.getSignal(rsi);
    const confidence = this.calculateConfidence(rsi);

    return {
      calculation: { value: rsi },
      signal,
      confidence,
      string: this.toString(rsi),
    };
  }

  private getSignal(rsi: number): "up" | "down" | "neutral" {
    const { OVERSOLD, OVERBOUGHT } = this.analysisConfig.rsi;

    if (rsi <= OVERSOLD) {
      return "up";
    }
    if (rsi >= OVERBOUGHT) {
      return "down";
    }

    return "neutral";
  }

  private calculateConfidence(rsi: number): number {
    const { OVERSOLD, OVERBOUGHT, NEUTRAL } = this.analysisConfig.rsi;
    let confidence = 0;

    // Distance from extreme levels
    if (rsi <= OVERSOLD) {
      confidence = 1 - rsi / OVERSOLD;
    } else if (rsi >= OVERBOUGHT) {
      confidence = 1 - (100 - rsi) / (100 - OVERBOUGHT);
    } else {
      // Distance from neutral
      const distanceFromNeutral = Math.abs(rsi - NEUTRAL);
      confidence = Math.max(0, 1 - distanceFromNeutral / NEUTRAL);
    }

    return normalizeConfidence(confidence);
  }

  private calculateRSI(closes: number[]): number {
    const period = this.analysisConfig.rsi.PERIOD;
    const gains: number[] = [];
    const losses: number[] = [];

    for (let i = 1; i < closes.length; i++) {
      const difference = closes[i]! - closes[i - 1]!;
      gains.push(Math.max(0, difference));
      losses.push(Math.max(0, -difference));
    }

    const avgGain = this.calculateAverage(gains, period);
    const avgLoss = this.calculateAverage(losses, period);

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - 100 / (1 + rs);
  }

  private calculateAverage(values: number[], period: number): number {
    if (values.length < period) return 0;
    const sum = values.slice(-period).reduce((a, b) => a + b, 0);
    return sum / period;
  }

  private toString(rsi: number): string {
    const signal = this.getSignal(rsi);
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

    return `RSI: ${signalEmoji} ${signalText} (${rsi.toFixed(
      2
    )}) | ${actionText} | Weight: ${this.analysisConfig.rsi.WEIGHT}`;
  }

  getEmptyValue(): IndicatorResult {
    return {
      calculation: { value: this.analysisConfig.rsi.NEUTRAL },
      signal: "neutral",
      confidence: 0,
      string: "Insufficient data",
    };
  }
}
