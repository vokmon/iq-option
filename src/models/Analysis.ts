import type { BinaryOptionsDirection } from "@quadcode-tech/client-sdk-js";

export interface TechnicalIndicators {
  rsi: {
    value: number;
    string: string;
  };
  macd: {
    macdLine: number;
    signalLine: number;
    histogram: number;
    string: string;
  };
  bollinger: {
    upper: number;
    middle: number;
    lower: number;
    string: string;
  };
  stochastic: {
    k: number;
    d: number;
    rsi: number;
    string: string;
  };
  ema: {
    fast: number;
    slow: number;
    crossover: number;
    string: string;
  };
  atr: {
    atr: number;
    upperBand: number;
    lowerBand: number;
    string: string;
  };
  volume: {
    volume: number;
    volumeMA: number;
    volumeRatio: number;
    string: string;
  };
  trend: {
    adx: number;
    trendStrength: number;
    trendDirection: number;
    string: string;
  };
}

export interface AnalysisResult {
  direction: BinaryOptionsDirection | null;
  confidence: number;
  shouldTrade: boolean;
  indicators: TechnicalIndicators;
  signalStrength: number;
}
