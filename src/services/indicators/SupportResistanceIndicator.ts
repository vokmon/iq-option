import type { Indicator } from "./Indicator";
import type { IndicatorResult } from "./Indicator";
import type { Candle } from "@quadcode-tech/client-sdk-js";
import { getAnalysisEnvConfig } from "../../models/environment/AnalysisEnvConfig";

export class SupportResistanceIndicator implements Indicator {
  private readonly analysisConfig = getAnalysisEnvConfig();

  private readonly period =
    this.analysisConfig.analysis.supportResistance.ANALYSIS_PERIOD_MINUTES;
  private readonly stdDevMultiplier =
    this.analysisConfig.analysis.supportResistance.STD_DEV_MULTIPLIER;
  private readonly stdDevMultiplier1 =
    this.analysisConfig.analysis.supportResistance.STD_DEV_MULTIPLIER_1;
  private readonly rsiBuyThreshold =
    this.analysisConfig.analysis.supportResistance.RSI_BUY_THRESHOLD; // RSI threshold for buy signals
  private readonly rsiSellThreshold =
    this.analysisConfig.analysis.supportResistance.RSI_SELL_THRESHOLD; // RSI threshold for sell signals
  private smallTimeframeCandles: Candle[] = [];
  private bigTimeframeCandles: Candle[] = [];

  public setTimeframeData(
    smallTimeframeCandles: Candle[],
    bigTimeframeCandles: Candle[]
  ) {
    this.smallTimeframeCandles = smallTimeframeCandles;
    this.bigTimeframeCandles = bigTimeframeCandles;
  }

  public getSignal(value: any): "up" | "down" | "neutral" {
    if (value.calculation.buyCon3) {
      return "up";
    } else if (value.calculation.sellCon3) {
      return "down";
    } else if (value.calculation.buyCon21) {
      return "up";
    } else if (value.calculation.sellCon21) {
      return "down";
    }
    return "neutral";
  }

  public calculateConfidence(value: any): number {
    if (value.calculation.buyCon3 || value.calculation.sellCon3) {
      return 0.8; // Highest confidence - all conditions met including RSI and previous candle pattern
    } else if (value.calculation.buyCon21 || value.calculation.sellCon21) {
      return 0.6; // Medium confidence - price action, BB, and RSI conditions met
    } else if (value.calculation.buyCon2 || value.calculation.sellCon2) {
      return 0.4; // Lower confidence - only price action and BB conditions met
    }
    return 0.0; // No confidence for neutral signals
  }

  public calculate(closes: number[], volumes?: number[]): IndicatorResult {
    // Calculate support and resistance levels using last value (matching Pine Script exactly)
    const r4 =
      this.bigTimeframeCandles[this.bigTimeframeCandles.length - 1]!.max;
    const r3 =
      this.smallTimeframeCandles[this.smallTimeframeCandles.length - 1]!.max;
    const s3 =
      this.smallTimeframeCandles[this.smallTimeframeCandles.length - 1]!.min;
    const s4 =
      this.bigTimeframeCandles[this.bigTimeframeCandles.length - 1]!.min;

    // Calculate back levels using previous values (matching Pine Script exactly)
    const bigHighBack = Math.max(
      r4,
      this.bigTimeframeCandles[this.bigTimeframeCandles.length - 2]!.max
    );
    const bigLowBack = Math.max(
      s4,
      this.bigTimeframeCandles[this.bigTimeframeCandles.length - 2]!.min
    );
    const smallHighBack = Math.max(
      r3,
      this.smallTimeframeCandles[this.smallTimeframeCandles.length - 2]!.max
    );
    const smallLowBack = Math.max(
      s3,
      this.smallTimeframeCandles[this.smallTimeframeCandles.length - 2]!.min
    );

    // Calculate base SMA and bands using small timeframe data
    const opens = this.smallTimeframeCandles.map((c) => c.open);

    if (closes.length < this.period || opens.length < this.period) {
      return this.getEmptyValue();
    }

    // Calculate base SMA and bands (matching Pine Script exactly)
    const base = this.calculateSMA(closes, this.period);
    const stdDev = this.calculateStandardDeviation(closes, this.period);
    const upperBand = base + stdDev * this.stdDevMultiplier;
    const lowerBand = base - stdDev * this.stdDevMultiplier;
    const upperBand1 = base + stdDev * this.stdDevMultiplier1;
    const lowerBand1 = base - stdDev * this.stdDevMultiplier1;

    // Calculate RSI (matching Pine Script exactly)
    const myrsi = this.calculateRSI(closes, this.period);

    // Ensure we have enough data for the conditions
    if (closes.length < 3 || opens.length < 3) {
      return this.getEmptyValue();
    }

    // Get the latest values for buy/sell conditions (matching Pine Script indexing)
    const close = closes[0]!; // current close
    const open = opens[0]!; // current open
    const close1 = closes[1]!; // close[1]
    const open1 = opens[1]!; // open[1]
    const close2 = closes[2]!; // close[2]
    const open2 = opens[2]!; // open[2]

    // Buy conditions (matching Pine Script exactly)
    const buyCon1 = close <= close1 && open1 >= close1 && open >= close;
    const buyCon2 = buyCon1 && close <= lowerBand1;
    const buyCon21 =
      buyCon1 &&
      close2 > open2 &&
      close <= lowerBand &&
      myrsi <= this.rsiBuyThreshold;
    const buyCon3 =
      buyCon2 &&
      close1 <= close2 &&
      open2 > close2 &&
      myrsi <= this.rsiBuyThreshold;

    // Sell conditions (matching Pine Script exactly)
    const sellCon1 = close >= close1 && open1 <= close1 && open <= close;
    const sellCon2 = sellCon1 && close >= upperBand1;
    const sellCon21 =
      sellCon1 &&
      close2 < open2 &&
      close >= upperBand &&
      myrsi >= this.rsiSellThreshold;
    const sellCon3 =
      sellCon2 &&
      close1 >= close2 &&
      open2 < close2 &&
      myrsi >= this.rsiSellThreshold;

    const calculation = {
      sma: base,
      upperBand,
      lowerBand,
      upperBand1,
      lowerBand1,
      rsi: myrsi,
      r4,
      r3,
      s3,
      s4,
      bigHighBack,
      bigLowBack,
      smallHighBack,
      smallLowBack,
      buyCon1,
      buyCon2,
      buyCon21,
      buyCon3,
      sellCon1,
      sellCon2,
      sellCon21,
      sellCon3,
    };

    const signal = this.getSignal({ calculation });
    const confidence = this.calculateConfidence({ calculation });

    return {
      signal,
      confidence,
      calculation,
      string: this.toString({ signal, confidence, calculation }),
    };
  }

  private calculateSMA(data: number[], period: number): number {
    if (data.length < period) return 0;
    const sum = data.slice(-period).reduce((a, b) => a + b, 0);
    return sum / period;
  }

  private calculateStandardDeviation(data: number[], period: number): number {
    if (data.length < period) return 0;
    const sma = this.calculateSMA(data, period);
    const squaredDiffs = data
      .slice(-period)
      .map((value) => Math.pow(value - sma, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
    return Math.sqrt(variance);
  }

  private calculateRSI(data: number[], period: number): number {
    if (data.length < period + 1) return 0;

    const changes = data.slice(1).map((value, i) => value - data[i]!);
    const gains = changes.map((change) => (change > 0 ? change : 0));
    const losses = changes.map((change) => (change < 0 ? -change : 0));

    const avgGain = this.calculateSMA(gains, period);
    const avgLoss = this.calculateSMA(losses, period);

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - 100 / (1 + rs);
  }

  public getEmptyValue(): IndicatorResult {
    return {
      signal: "neutral",
      confidence: 0,
      calculation: {
        sma: 0,
        upperBand: 0,
        lowerBand: 0,
        upperBand1: 0,
        lowerBand1: 0,
        rsi: 0,
        r4: 0,
        r3: 0,
        s3: 0,
        s4: 0,
        bigHighBack: 0,
        bigLowBack: 0,
        smallHighBack: 0,
        smallLowBack: 0,
        buyCon1: false,
        buyCon2: false,
        buyCon21: false,
        buyCon3: false,
        sellCon1: false,
        sellCon2: false,
        sellCon21: false,
        sellCon3: false,
      },
      string: "No data available",
    };
  }

  public toString(value: any): string {
    const signalEmoji =
      value.signal === "up" ? "⬆️" : value.signal === "down" ? "⬇️" : "↔️";
    const signalText =
      value.signal === "up"
        ? "Call"
        : value.signal === "down"
        ? "Put"
        : "Neutral";

    // Determine price zone
    const close = value.calculation.close;
    const zone =
      close >= value.calculation.r3
        ? "Resistance Zone"
        : close <= value.calculation.s3
        ? "Support Zone"
        : "Neutral Zone";

    return `Action: ${signalEmoji} (${signalText}) | Zone: ${zone} | Confident: ${(
      value.confidence * 100
    ).toFixed(1)}% | RSI: ${Math.round(value.calculation.rsi)}`;
  }
}
