export interface TradeWorkerEnvConfig {
  INSTRUMENT: number | string;
  CANDLE_INTERVAL_SECONDS: number;
  CANDLE_ANALYSIS_PERIOD_MINUTES: number;
  MAX_TRADE_CYCLES: number;
  BUY_AMOUNT: number;
}

export const getTradeWorkerEnvConfig = (): TradeWorkerEnvConfig => {
  if (!process.env.INSTRUMENT) {
    throw new Error("INSTRUMENT environment variable is required");
  }

  return {
    INSTRUMENT: !isNaN(parseInt(process.env.INSTRUMENT))
      ? parseInt(process.env.INSTRUMENT)
      : process.env.INSTRUMENT,
    CANDLE_INTERVAL_SECONDS: parseInt(
      process.env.CANDLE_INTERVAL_SECONDS || "15"
    ),
    CANDLE_ANALYSIS_PERIOD_MINUTES: parseInt(
      process.env.CANDLE_ANALYSIS_PERIOD_MINUTES || "15"
    ),
    MAX_TRADE_CYCLES: parseInt(process.env.MAX_TRADE_CYCLES || "5"),
    BUY_AMOUNT: parseInt(process.env.BUY_AMOUNT || "1"),
  };
};
