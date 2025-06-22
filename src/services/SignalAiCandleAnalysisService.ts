import type {
  BinaryOptionsActive,
  BinaryOptionsDirection,
  ClientSdk,
} from "@quadcode-tech/client-sdk-js";
import { TradingState } from "../models/TradingState";
import { findInstrument, getCandles } from "../utils/ClientUtils";
import type { AnalysisResult } from "../models/Analysis";
import { AnalysisLogger } from "./helpers/logging/AnalysisLogger";
import { getAnalysisEnvConfig } from "../models/environment/AnalysisEnvConfig";
import { SignalAiAnalysisService } from "./SignalAiAnalysisService";

interface CandleData {
  instrumentId: number;
  date: Date;
  signalDirection: BinaryOptionsDirection;
}

export class SignalAiCandleAnalysisService {
  private readonly analysisConfig = getAnalysisEnvConfig();
  private readonly aiAnalysisService = new SignalAiAnalysisService();
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

        const binaryOptions = await this.clientSdk.binaryOptions();
        const instrument = await findInstrument(
          binaryOptions,
          candleData.instrumentId
        );

        const analysis = await this.aiAnalysisService.analyzeCandles({
          smallTimeframeCandles: candles.smallTimeframeCandles,
          bigTimeframeCandles: candles.bigTimeframeCandles,
          signalDirection: candleData.signalDirection,
          instrument,
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
    lookbackPeriods: number
  ) {
    const analysisMinutes = intervalMinutes * lookbackPeriods;

    return await getCandles({
      clientSdk: this.clientSdk,
      instrumentId,
      date,
      analysisMinutes,
      candleIntervalSeconds: intervalMinutes * 60,
    });
  }
}
