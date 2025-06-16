import type { Indicator, IndicatorResult } from "./TechnicalIndicators";
import { getAnalysisEnvConfig } from "../../models/environment/AnalysisEnvConfig";
import { normalizeConfidence } from "./TechnicalIndicators";

export class VolumeIndicator implements Indicator {
  private readonly analysisConfig = getAnalysisEnvConfig();
  private previousClose: number = 0;

  calculate(closes: number[], volumes: number[]): IndicatorResult {
    if (closes.length < this.analysisConfig.volume.PERIOD) {
      return {
        calculation: { value: 0 },
        signal: "neutral",
        confidence: 0,
        string: "Insufficient data",
      };
    }

    const currentVolume = volumes[volumes.length - 1]!;
    const currentClose = closes[closes.length - 1]!;
    const avgVolume = this.calculateAverageVolume(volumes);

    const signal = this.getSignal(
      currentVolume,
      avgVolume,
      currentClose,
      this.previousClose
    );
    const confidence = this.calculateConfidence(currentVolume, avgVolume);

    this.previousClose = currentClose;

    return {
      calculation: { value: currentVolume },
      signal,
      confidence,
      string: this.toString(currentVolume, avgVolume, signal, confidence),
    };
  }

  private getSignal(
    currentVolume: number,
    avgVolume: number,
    currentClose: number,
    previousClose: number
  ): "up" | "down" | "neutral" {
    const { THRESHOLD } = this.analysisConfig.volume;
    const volumeRatio = currentVolume / avgVolume;
    const priceChange = currentClose - previousClose;

    if (volumeRatio > THRESHOLD) {
      return priceChange > 0 ? "up" : "down";
    }
    return "neutral";
  }

  private calculateConfidence(
    currentVolume: number,
    avgVolume: number
  ): number {
    const { THRESHOLD } = this.analysisConfig.volume;
    const volumeRatio = currentVolume / avgVolume;
    return normalizeConfidence(Math.min(volumeRatio / THRESHOLD, 1));
  }

  private calculateAverageVolume(volumes: number[]): number {
    const { PERIOD } = this.analysisConfig.volume;
    const recentVolumes = volumes.slice(-PERIOD);
    return recentVolumes.reduce((sum, vol) => sum + vol, 0) / PERIOD;
  }

  private toString(
    currentVolume: number,
    avgVolume: number,
    signal: "up" | "down" | "neutral",
    confidence: number
  ): string {
    const shouldBuy = signal === "up";
    const buyEmoji = shouldBuy ? "✅" : "🚫";
    const signalEmoji =
      signal === "up" ? "⬆️" : signal === "down" ? "⬇️" : "↔️";
    const signalText =
      signal === "up"
        ? "Call - High Volume"
        : signal === "down"
        ? "Put - Low Volume"
        : "Neutral";

    return `Volume | Buy: ${buyEmoji} ${
      shouldBuy ? "Yes" : "No"
    } | Action: ${signalEmoji} (${signalText}) | Confident: ${(
      confidence * 100
    ).toFixed(1)} | Weight: ${
      this.analysisConfig.volume.WEIGHT
    } | Current: ${currentVolume.toFixed(2)} | Avg: ${avgVolume.toFixed(2)}`;
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
