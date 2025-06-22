export interface IndicatorResult {
  value?: number;
  signal: "call" | "put" | "neutral";
  confidence: number;
  string: string;
  [key: string]: any;
}

export interface Indicator {
  calculate(closes: number[], volumes?: number[]): IndicatorResult;
  getSignal(value: any): "call" | "put" | "neutral";
  calculateConfidence(value: any): number;
  toString(value: any): string;
}
