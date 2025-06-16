import type { Indicator, IndicatorResult } from "./TechnicalIndicators";
import { getAnalysisEnvConfig } from "../../models/environment/AnalysisEnvConfig";
import { normalizeConfidence } from "./TechnicalIndicators";

export class EMACrossoverIndicator implements Indicator {
  private readonly analysisConfig = getAnalysisEnvConfig();
  private previousFastEMA: number = 0;
  private previousSlowEMA: number = 0;

  calculate(closes: number[]): IndicatorResult {
    if (closes.length < this.analysisConfig.ema.SLOW_PERIOD) {
      return {
        calculation: { value: 0 },
        signal: "neutral",
        confidence: 0,
        string: "Insufficient data",
      };
    }

    const { fastEMA, slowEMA } = this.calculateEMA(closes);
    this.previousFastEMA = fastEMA;
    this.previousSlowEMA = slowEMA;

    const signal = this.getSignal(fastEMA, slowEMA);
    const confidence = this.calculateConfidence(fastEMA, slowEMA);

    return {
      calculation: { value: fastEMA - slowEMA },
      signal,
      confidence,
      string: this.toString(fastEMA, slowEMA, signal, confidence),
    };
  }

  private getSignal(
    fastEMA: number,
    slowEMA: number
  ): "up" | "down" | "neutral" {
    const { THRESHOLD } = this.analysisConfig.ema;

    // Crossover detection
    if (this.previousFastEMA < this.previousSlowEMA && fastEMA > slowEMA) {
      return "up";
    }
    if (this.previousFastEMA > this.previousSlowEMA && fastEMA < slowEMA) {
      return "down";
    }

    // Distance-based signals
    const difference = Math.abs(fastEMA - slowEMA);
    if (difference > THRESHOLD) {
      return fastEMA > slowEMA ? "up" : "down";
    }

    return "neutral";
  }

  private calculateConfidence(fastEMA: number, slowEMA: number): number {
    const { THRESHOLD } = this.analysisConfig.ema;
    const difference = Math.abs(fastEMA - slowEMA);
    return normalizeConfidence(difference / THRESHOLD);
  }

  private calculateEMA(closes: number[]): { fastEMA: number; slowEMA: number } {
    const { FAST_PERIOD, SLOW_PERIOD } = this.analysisConfig.ema;
    const fastEMA = this.calculateSingleEMA(closes, FAST_PERIOD);
    const slowEMA = this.calculateSingleEMA(closes, SLOW_PERIOD);
    return { fastEMA, slowEMA };
  }

  private calculateSingleEMA(data: number[], period: number): number {
    const multiplier = 2 / (period + 1);
    let ema = data[0]!;

    for (let i = 1; i < data.length; i++) {
      ema = (data[i]! - ema) * multiplier + ema;
    }

    return ema;
  }

  private toString(
    fastEMA: number,
    slowEMA: number,
    signal: "up" | "down" | "neutral",
    confidence: number
  ): string {
    const shouldBuy = signal === "up";
    const buyEmoji = shouldBuy ? "✅" : "🚫";
    const signalEmoji =
      signal === "up" ? "⬆️" : signal === "down" ? "⬇️" : "↔️";
    const signalText =
      signal === "up"
        ? "Call - Fast Above Slow"
        : signal === "down"
        ? "Put - Fast Below Slow"
        : "Neutral";

    return `EMA | Buy: ${buyEmoji} ${
      shouldBuy ? "Yes" : "No"
    } | Action: ${signalEmoji} (${signalText}) | Confident: ${(
      confidence * 100
    ).toFixed(1)} | Weight: ${
      this.analysisConfig.ema.WEIGHT
    } | Fast: ${fastEMA.toFixed(2)} | Slow: ${slowEMA.toFixed(2)}`;
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
