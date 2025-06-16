import type { Indicator, IndicatorResult } from "./TechnicalIndicators";
import { getAnalysisEnvConfig } from "../../models/environment/AnalysisEnvConfig";
import { normalizeConfidence } from "./TechnicalIndicators";

export class ATRIndicator implements Indicator {
  private readonly analysisConfig = getAnalysisEnvConfig();
  private previousATR: number = 0;

  calculate(
    closes: number[],
    highs: number[],
    lows: number[]
  ): IndicatorResult {
    if (closes.length < this.analysisConfig.atr.PERIOD) {
      return {
        calculation: { value: 0 },
        signal: "neutral",
        confidence: 0,
        string: "Insufficient data",
      };
    }

    const { atr, upperBand, lowerBand } = this.calculateATR(
      closes,
      highs,
      lows
    );
    this.previousATR = atr;

    const signal = this.getSignal(
      closes[closes.length - 1]!,
      upperBand,
      lowerBand
    );
    const confidence = this.calculateConfidence(atr, upperBand, lowerBand);

    return {
      calculation: { value: atr },
      signal,
      confidence,
      string: this.toString(atr, upperBand, lowerBand, signal, confidence),
    };
  }

  private getSignal(
    currentPrice: number,
    upperBand: number,
    lowerBand: number
  ): "up" | "down" | "neutral" {
    if (currentPrice > upperBand) {
      return "up";
    }
    if (currentPrice < lowerBand) {
      return "down";
    }
    return "neutral";
  }

  private calculateConfidence(
    atr: number,
    upperBand: number,
    lowerBand: number
  ): number {
    const currentPrice = this.previousATR;
    const range = upperBand - lowerBand;
    const distance = Math.min(
      Math.abs(currentPrice - upperBand),
      Math.abs(currentPrice - lowerBand)
    );
    return normalizeConfidence(1 - distance / range);
  }

  private calculateATR(
    closes: number[],
    highs: number[],
    lows: number[]
  ): { atr: number; upperBand: number; lowerBand: number } {
    const { PERIOD, MULTIPLIER } = this.analysisConfig.atr;
    const trueRanges: number[] = [];

    // Calculate True Range
    for (let i = 1; i < highs.length; i++) {
      const high = highs[i]!;
      const low = lows[i]!;
      const prevClose = closes[i - 1]!;
      const tr = Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      );
      trueRanges.push(tr);
    }

    // Calculate ATR
    let atr =
      trueRanges.slice(0, PERIOD).reduce((sum, tr) => sum + tr, 0) / PERIOD;
    for (let i = PERIOD; i < trueRanges.length; i++) {
      atr = (atr * (PERIOD - 1) + trueRanges[i]!) / PERIOD;
    }

    // Calculate bands
    const upperBand = closes[closes.length - 1]! + MULTIPLIER * atr;
    const lowerBand = closes[closes.length - 1]! - MULTIPLIER * atr;

    return { atr, upperBand, lowerBand };
  }

  private toString(
    atr: number,
    upperBand: number,
    lowerBand: number,
    signal: "up" | "down" | "neutral",
    confidence: number
  ): string {
    const shouldBuy = signal === "up";
    const buyEmoji = shouldBuy ? "✅" : "🚫";
    const signalEmoji =
      signal === "up" ? "⬆️" : signal === "down" ? "⬇️" : "↔️";
    const signalText =
      signal === "up"
        ? "Call - Bullish"
        : signal === "down"
        ? "Put - Bearish"
        : "Neutral";

    return `ATR | Buy: ${buyEmoji} ${
      shouldBuy ? "Yes" : "No"
    } | Action: ${signalEmoji} (${signalText}) | Confident: ${(
      confidence * 100
    ).toFixed(1)} | Weight: ${
      this.analysisConfig.atr.WEIGHT
    } | ATR: ${atr.toFixed(2)} | Upper: ${upperBand.toFixed(
      2
    )} | Lower: ${lowerBand.toFixed(2)}`;
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
