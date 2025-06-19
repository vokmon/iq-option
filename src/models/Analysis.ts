import type { BinaryOptionsDirection } from "@quadcode-tech/client-sdk-js";

export interface TechnicalIndicators {
  supportResistance?: {
    sma: number;
    upperBand: number;
    lowerBand: number;
    upperBand1: number;
    lowerBand1: number;
    rsi: number;
    r4: number;
    r3: number;
    s3: number;
    s4: number;
    buyCon1: boolean;
    buyCon2: boolean;
    buyCon21: boolean;
    buyCon3: boolean;
    sellCon1: boolean;
    sellCon2: boolean;
    sellCon21: boolean;
    sellCon3: boolean;
    string: string;
  };
  ai?: {
    string: string;
  };
}

export interface AnalysisResult {
  direction: BinaryOptionsDirection | null;
  confidence: number;
  shouldTrade: boolean;
  indicators: TechnicalIndicators;
}
