export interface IndicatorResult {
  value?: number;
  signal: "up" | "down" | "neutral";
  confidence: number;
  string: string;
  [key: string]: any;
}

export interface Indicator {
  calculate(closes: number[], volumes?: number[]): IndicatorResult;
  getSignal(value: any): "up" | "down" | "neutral";
  calculateConfidence(value: any): number;
  toString(value: any): string;
}
