export interface TradeWorkerEnvConfig {
  INSTRUMENT: number | string;
  MAX_TRADE_CYCLES: number;
  BUY_AMOUNT: number;
  SIGNAL_DIRECTION: "Buy" | "Sell";
}

export const getTradeWorkerEnvConfig = (): TradeWorkerEnvConfig => {
  if (!process.env.INSTRUMENT) {
    throw new Error("INSTRUMENT environment variable is required");
  }

  return {
    INSTRUMENT: !isNaN(parseInt(process.env.INSTRUMENT))
      ? parseInt(process.env.INSTRUMENT)
      : process.env.INSTRUMENT,
    MAX_TRADE_CYCLES: parseInt(process.env.MAX_TRADE_CYCLES || "5"),
    BUY_AMOUNT: parseInt(process.env.BUY_AMOUNT || "1"),
    SIGNAL_DIRECTION: process.env.SIGNAL_DIRECTION as "Buy" | "Sell",
  };
};
