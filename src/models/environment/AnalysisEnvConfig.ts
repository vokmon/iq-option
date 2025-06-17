export interface AnalysisEnvConfig {
  LOOKBACK_PERIOD: number;
  MIN_CONFIDENCE_THRESHOLD: number;
  ANALYSIS_WAIT_TIME_BETWEEN_TRADES_SECONDS: number;
  SMALL_TIME_FRAME_CANDLE_INTERVAL_MINUTES: number;
  BIG_TIME_FRAME_CANDLE_INTERVAL_MINUTES: number;
  analysis: {
    ANALYSIS_PERIOD_MINUTES: number;
    STD_DEV_MULTIPLIER: number;
    STD_DEV_MULTIPLIER_1: number;
    RSI_BUY_THRESHOLD: number;
    RSI_SELL_THRESHOLD: number;
  };
}

export function getAnalysisEnvConfig(): AnalysisEnvConfig {
  return {
    LOOKBACK_PERIOD: Number(process.env.LOOKBACK_PERIOD) || 20,
    MIN_CONFIDENCE_THRESHOLD:
      Number(process.env.MIN_CONFIDENCE_THRESHOLD) || 0.8,
    ANALYSIS_WAIT_TIME_BETWEEN_TRADES_SECONDS:
      Number(process.env.ANALYSIS_WAIT_TIME_BETWEEN_TRADES_SECONDS) || 15,
    SMALL_TIME_FRAME_CANDLE_INTERVAL_MINUTES:
      Number(process.env.SMALL_TIME_FRAME_CANDLE_INTERVAL_MINUTES) || 15,
    BIG_TIME_FRAME_CANDLE_INTERVAL_MINUTES:
      Number(process.env.BIG_TIME_FRAME_CANDLE_INTERVAL_MINUTES) || 60,
    analysis: {
      ANALYSIS_PERIOD_MINUTES:
        Number(process.env.ANALYSIS_PERIOD_MINUTES) || 14,
      STD_DEV_MULTIPLIER: Number(process.env.STD_DEV_MULTIPLIER) || 2,
      STD_DEV_MULTIPLIER_1: Number(process.env.STD_DEV_MULTIPLIER_1) || 1.75,
      RSI_BUY_THRESHOLD: Number(process.env.RSI_BUY_THRESHOLD) || 40,
      RSI_SELL_THRESHOLD: Number(process.env.RSI_SELL_THRESHOLD) || 60,
    },
  };
}
