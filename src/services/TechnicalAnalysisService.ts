import type {
  TechnicalIndicators as ServiceIndicators,
  IndicatorType,
} from "./indicators/TechnicalIndicators";
import { RSIIndicator } from "./indicators/RSIIndicator";
import { MACDIndicator } from "./indicators/MACDIndicator";
import { BollingerBandsIndicator } from "./indicators/BollingerBandsIndicator";
import { StochasticIndicator } from "./indicators/StochasticIndicator";
import { EMACrossoverIndicator } from "./indicators/EMACrossoverIndicator";
import { ATRIndicator } from "./indicators/ATRIndicator";
import { VolumeIndicator } from "./indicators/VolumeIndicator";
import { TrendStrengthIndicator } from "./indicators/TrendStrengthIndicator";
import type { Candle } from "@quadcode-tech/client-sdk-js";
import { BinaryOptionsDirection } from "@quadcode-tech/client-sdk-js";
import type { AnalysisResult, TechnicalIndicators } from "../models/Analysis";
import { getAnalysisEnvConfig } from "../models/environment/AnalysisEnvConfig";

export class TechnicalAnalysisService {
  private indicators: ServiceIndicators;
  private analysisConfig = getAnalysisEnvConfig();

  constructor() {
    this.indicators = {
      rsi: new RSIIndicator(),
      macd: new MACDIndicator(),
      bollinger: new BollingerBandsIndicator(),
      stochastic: new StochasticIndicator(),
      ema: new EMACrossoverIndicator(),
      atr: new ATRIndicator(),
      volume: new VolumeIndicator(),
      trend: new TrendStrengthIndicator(),
    };
  }

  public analyzeCandles(candles: Candle[]): AnalysisResult {
    if (candles.length < this.analysisConfig.decision.MIN_CANDLES_REQUIRED) {
      return {
        direction: null,
        confidence: 0,
        shouldTrade: false,
        indicators: this.getEmptyIndicators(),
        signalStrength: 0,
      };
    }

    const closes = candles.map((c) => c.close);
    const highs = candles.map((c) => c.max);
    const lows = candles.map((c) => c.min);

    // Calculate indicator values
    const indicatorResults: Partial<Record<IndicatorType, any>> = {};
    for (const [key, indicator] of Object.entries(this.indicators)) {
      indicatorResults[key as IndicatorType] = indicator.calculate(
        closes,
        highs,
        lows
      );
    }

    // Calculate weighted confidence
    let totalConfidence = 0;
    let totalWeight = 0;
    let callSignals = 0;
    let putSignals = 0;

    // First pass: calculate total weight
    for (const [indicator, result] of Object.entries(indicatorResults)) {
      if (result.signal !== "neutral") {
        const weight = this.analysisConfig[indicator as IndicatorType].WEIGHT;
        totalWeight += weight;
      }
    }

    // Second pass: calculate weighted confidence using normalized weights
    for (const [indicator, result] of Object.entries(indicatorResults)) {
      if (result.signal !== "neutral") {
        const weight = this.analysisConfig[indicator as IndicatorType].WEIGHT;
        // Normalize the weight to sum to 1
        const normalizedWeight = totalWeight > 0 ? weight / totalWeight : 0;
        // Ensure individual confidence is between 0 and 1
        const normalizedConfidence = Math.max(
          0,
          Math.min(1, result.confidence)
        );
        totalConfidence += normalizedConfidence * normalizedWeight;

        if (result.signal === "up") {
          callSignals++;
        } else {
          putSignals++;
        }
      }
    }

    // The weighted confidence is now already normalized between 0 and 1
    const weightedConfidence = totalConfidence;

    const signalStrength =
      Math.abs(callSignals - putSignals) / Object.keys(indicatorResults).length;

    // Determine final direction
    let direction: BinaryOptionsDirection | null = null;
    if (
      weightedConfidence >=
      this.analysisConfig.decision.MIN_CONFIDENCE_THRESHOLD
    ) {
      direction =
        callSignals > putSignals
          ? BinaryOptionsDirection.Call
          : BinaryOptionsDirection.Put;
    }

    return {
      direction,
      confidence: weightedConfidence,
      shouldTrade: direction !== null,
      indicators: Object.entries(indicatorResults).reduce(
        (acc, [key, value]) => ({
          ...acc,
          [key]: {
            ...value.calculation,
            string: value.string,
          },
        }),
        {} as TechnicalIndicators
      ),
      signalStrength,
    };
  }

  private getEmptyIndicators(): TechnicalIndicators {
    return Object.keys(this.indicators).reduce(
      (acc, type) => ({
        ...acc,
        [type]:
          this.indicators[type as keyof TechnicalIndicators].getEmptyValue()
            .calculation,
      }),
      {} as TechnicalIndicators
    );
  }
}
