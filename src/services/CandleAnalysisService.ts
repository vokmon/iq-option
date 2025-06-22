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

interface CandleData {
  instrumentId: number;
  date: Date;
}

export class CandleAnalysisService {
  private readonly analysisConfig = getAnalysisEnvConfig();
  private readonly supportResistanceAnalysisService =
    new SupportResistanceAnalysisService();
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

        const analysis = this.supportResistanceAnalysisService.analyzeCandles({
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
        this.analysisConfig.SMALL_TIME_FRAME_CANDLE_INTERVAL_MINUTES,
        this.analysisConfig.SMALL_TIME_FRAME_CANDLE_LOOKBACK_PERIODS
      ),
      this.getTimeframeCandles(
        instrumentId,
        date,
        this.analysisConfig.BIG_TIME_FRAME_CANDLE_INTERVAL_MINUTES,
        this.analysisConfig.BIG_TIME_FRAME_CANDLE_LOOKBACK_PERIODS
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
    intervalMinutes: number,
    lookbackPeriod: number
  ) {
    const analysisMinutes = intervalMinutes * lookbackPeriod;

    return await getCandles({
      clientSdk: this.clientSdk,
      instrumentId,
      date,
      analysisMinutes,
      candleIntervalSeconds: intervalMinutes * 60,
    });
  }
}
