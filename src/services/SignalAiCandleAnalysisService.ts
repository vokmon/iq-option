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
import { getMinutesUntil } from "../utils/Dateutils";

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
    return new Promise(async (resolve, reject) => {
      while (true) {
        try {
          const binaryOptions = await this.clientSdk.binaryOptions();
          const instrument = await findInstrument(
            binaryOptions,
            candleData.instrumentId
          );

          // Wait until near the purchase end time
          const purchaseEndTime = instrument.purchaseEndTime();
          const waitUntilMinutes =
            this.analysisConfig.WAIT_UNITIL_TRADE_PURCHASE_END_TIME_MINUTES;
          const targetTime = new Date(
            purchaseEndTime.getTime() - waitUntilMinutes * 60 * 1000
          );

          if (targetTime.getTime() > new Date().getTime()) {
            const untilTargetTime = getMinutesUntil(targetTime);
            const untilTargetTimeInMinutes = getMinutesUntil(targetTime);
            this.analysisLogger.logWaitingForTradePurchaseEndTime(
              purchaseEndTime,
              untilTargetTimeInMinutes,
              targetTime
            );
            await new Promise((resolve) =>
              setTimeout(resolve, untilTargetTime * 60 * 1000)
            );
          }

          const candles = await this.getCandleData(candleData);

          this.analysisLogger.logCandleData({
            ...candles,
            active: this.active,
          });

          const analysis = await this.aiAnalysisService.analyzeCandles({
            smallTimeframeCandles: candles.smallTimeframeCandles,
            bigTimeframeCandles: candles.bigTimeframeCandles,
            signalDirection: candleData.signalDirection,
            instrument,
          });

          this.analysisLogger.logAnalysisResult(analysis, this.active);

          if (instrument.purchaseEndTime().getTime() < new Date().getTime()) {
            reject("Purchase end time has passed");
          }

          if (analysis.shouldTrade) {
            resolve(analysis);
            break;
          }

          this.analysisLogger.logWaitingForNextAnalysis();
          await new Promise((resolve) =>
            setTimeout(
              resolve,
              this.analysisConfig.ANALYSIS_WAIT_TIME_BETWEEN_TRADES_SECONDS *
                1000
            )
          );
        } catch (error) {
          this.analysisLogger.error("Error in trading service:", { error });
        }
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
