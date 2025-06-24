import type {
  BinaryOptionsActiveInstrument,
  Candle,
  CurrentQuote,
} from "@quadcode-tech/client-sdk-js";
import { BinaryOptionsDirection } from "@quadcode-tech/client-sdk-js";
import type { AnalysisResult } from "../models/Analysis";
import { AiIndicator } from "./indicators/AiIndicator";
import { getAnalysisEnvConfig } from "../models/environment/AnalysisEnvConfig";

export class AiAnalysisService {
  private aiIndicator = new AiIndicator();
  private config = getAnalysisEnvConfig();

  public async analyzeCandles({
    smallTimeframeCandles,
    bigTimeframeCandles,
    instrument,
  }: {
    smallTimeframeCandles: Candle[]; // 20 fifteen-minute candles
    bigTimeframeCandles: Candle[]; // 20 sixty-minute candles
    instrument: BinaryOptionsActiveInstrument;
  }): Promise<AnalysisResult> {
    const indicatorResult = await this.aiIndicator.calculate(
      smallTimeframeCandles,
      bigTimeframeCandles,
      instrument
    );
    return {
      direction:
        indicatorResult.signal === "call"
          ? BinaryOptionsDirection.Call
          : indicatorResult.signal === "put"
          ? BinaryOptionsDirection.Put
          : null,
      confidence: indicatorResult.confidence,
      shouldTrade:
        indicatorResult.signal !== "neutral" &&
        indicatorResult.confidence >= this.config.MIN_CONFIDENCE_THRESHOLD,
      indicators: {
        ai: {
          string: indicatorResult.string,
        },
      },
    };
  }
}
