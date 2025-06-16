import type { ClientSdk } from "@quadcode-tech/client-sdk-js";
import { TradingState } from "../models/TradingState";
import { getCandles } from "../utils/ClientUtils";
import { TechnicalAnalysisService } from "./TechnicalAnalysisService";
import type { AnalysisResult } from "../models/Analysis";
import { AnalysisLogger } from "./helpers/logging/AnalysisLogger";
import { getAnalysisEnvConfig } from "../models/environment/AnalysisEnvConfig";

interface CandleData {
  instrumentId: number;
  date: Date;
  analysisMinutes: number;
  candleIntervalSeconds: number;
}

export class CandleAnalysisService {
  private readonly analysisConfig = getAnalysisEnvConfig();
  private readonly technicalAnalysis = new TechnicalAnalysisService();
  private readonly analysisLogger: AnalysisLogger;

  constructor(
    private readonly clientSdk: ClientSdk,
    private readonly tradingState: TradingState
  ) {
    this.analysisLogger = new AnalysisLogger(tradingState);
  }

  async analyzeCandles(candleData: CandleData): Promise<AnalysisResult> {
    return new Promise(async (resolve) => {
      while (true) {
        const candles = await this.getCandleData(candleData);
        this.analysisLogger.logCandleData(candles);

        const analysis = this.technicalAnalysis.analyzeCandles(candles);
        this.analysisLogger.logAnalysisResult(analysis);

        if (analysis.shouldTrade) {
          resolve(analysis);
          break;
        }

        this.analysisLogger.logWaitingForNextAnalysis();
        await new Promise((resolve) =>
          setTimeout(
            resolve,
            this.analysisConfig.ANALYSIS_WAIT_TIME_BETWEEN_TRADES_SECONDS * 1000
          )
        );
      }
    });
  }

  private async getCandleData(candleData: CandleData) {
    const { instrumentId, date, analysisMinutes, candleIntervalSeconds } =
      candleData;
    const candles = await getCandles({
      clientSdk: this.clientSdk,
      instrumentId,
      date,
      analysisMinutes,
      candleIntervalSeconds,
    });
    return candles;
  }
}
