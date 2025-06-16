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
      string: this.toString(currentVolume, avgVolume),
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

  private toString(currentVolume: number, avgVolume: number): string {
    const signal = this.getSignal(currentVolume, avgVolume, 0, 0);
    const signalEmoji =
      signal === "up" ? "🔵" : signal === "down" ? "🔴" : "⚪";
    const signalText =
      signal === "up"
        ? "High Volume"
        : signal === "down"
        ? "Low Volume"
        : "Normal Volume";
    const actionText =
      signal === "up"
        ? "Potential Buy"
        : signal === "down"
        ? "Potential Sell"
        : "No Clear Signal";

    return `Volume: ${signalEmoji} ${signalText} (Current: ${currentVolume.toFixed(
      2
    )}, Avg: ${avgVolume.toFixed(2)}) | ${actionText} | Weight: ${
      this.analysisConfig.volume.WEIGHT
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
