export type IndicatorType =
  | "rsi"
  | "macd"
  | "bollinger"
  | "stochastic"
  | "ema"
  | "atr"
  | "volume"
  | "trend";

export interface IndicatorResult {
  calculation: any;
  signal: "up" | "down" | "neutral";
  confidence: number;
  string: string;
}

export interface Indicator {
  calculate(
    closes: number[],
    highs?: number[],
    lows?: number[],
    volumes?: number[]
  ): IndicatorResult;
  getEmptyValue(): IndicatorResult;
}

export interface TechnicalIndicators {
  rsi: Indicator;
  macd: Indicator;
  bollinger: Indicator;
  stochastic: Indicator;
  ema: Indicator;
  atr: Indicator;
  volume: Indicator;
  trend: Indicator;
}

export function normalizeConfidence(confidence: number): number {
  if (isNaN(confidence) || !isFinite(confidence)) {
    return 0;
  }
  return Math.max(0, Math.min(1, confidence));
}
