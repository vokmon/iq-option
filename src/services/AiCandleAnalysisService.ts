import type {
  BinaryOptionsActive,
  ClientSdk,
} from "@quadcode-tech/client-sdk-js";
import { TradingState } from "../models/TradingState";
import { getCandles } from "../utils/ClientUtils";
import type { AnalysisResult } from "../models/Analysis";
import { AnalysisLogger } from "./helpers/logging/AnalysisLogger";
import { getAnalysisEnvConfig } from "../models/environment/AnalysisEnvConfig";
import { SupportResistanceAnalysisService } from "./SupportResistanceAnalysisService";
import { AiAnalysisService } from "./AiAnalysisService";

interface CandleData {
  instrumentId: number;
  date: Date;
}

export class AiCandleAnalysisService {
  private readonly analysisConfig = getAnalysisEnvConfig();
  private readonly aiAnalysisService = new AiAnalysisService();
  private readonly analysisLogger: AnalysisLogger;

  constructor(
    private readonly clientSdk: ClientSdk,
    private readonly active: BinaryOptionsActive,
    private readonly tradingState: TradingState
  ) {
    this.analysisLogger = new AnalysisLogger(tradingState);
  }

  async analyzeCandles(candleData: CandleData): Promise<AnalysisResult> {
    return new Promise(async (resolve) => {
      while (true) {
        const candles = await this.getCandleData(candleData);
        this.analysisLogger.logCandleData({
          ...candles,
          active: this.active,
        });

        const analysis = await this.aiAnalysisService.analyzeCandles({
          smallTimeframeCandles: candles.smallTimeframeCandles,
          bigTimeframeCandles: candles.bigTimeframeCandles,
        });

        this.analysisLogger.logAnalysisResult(analysis, this.active);

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
    const { instrumentId, date } = candleData;

    const [smallTimeframeCandles, bigTimeframeCandles] = await Promise.all([
      this.getTimeframeCandles(
        instrumentId,
        date,
        this.analysisConfig.SMALL_TIME_FRAME_CANDLE_INTERVAL_MINUTES
      ),
      this.getTimeframeCandles(
        instrumentId,
        date,
        this.analysisConfig.BIG_TIME_FRAME_CANDLE_INTERVAL_MINUTES
      ),
    ]);

    return {
      smallTimeframeCandles,
      bigTimeframeCandles,
    };
  }

  private async getTimeframeCandles(
    instrumentId: number,
    date: Date,
    intervalMinutes: number
  ) {
    const analysisMinutes =
      intervalMinutes * this.analysisConfig.LOOKBACK_PERIOD;

    return await getCandles({
      clientSdk: this.clientSdk,
      instrumentId,
      date,
      analysisMinutes,
      candleIntervalSeconds: intervalMinutes * 60,
    });
  }
}
