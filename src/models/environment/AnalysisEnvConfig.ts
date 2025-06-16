export interface AnalysisEnvConfig {
  rsi: {
    PERIOD: number;
    OVERBOUGHT: number;
    OVERSOLD: number;
    NEUTRAL: number;
    WEIGHT: number;
  };
  macd: {
    FAST_PERIOD: number;
    SLOW_PERIOD: number;
    SIGNAL_PERIOD: number;
    THRESHOLD: number;
    WEIGHT: number;
  };
  bollinger: {
    PERIOD: number;
    DEVIATIONS: number;
    VOLATILITY_THRESHOLD: number;
    SQUEEZE_THRESHOLD: number;
    WEIGHT: number;
  };
  stochastic: {
    PERIOD: number;
    SMOOTHING: number;
    OVERBOUGHT: number;
    OVERSOLD: number;
    WEIGHT: number;
    DEFAULT_VALUE: number;
  };
  ema: {
    FAST_PERIOD: number;
    SLOW_PERIOD: number;
    THRESHOLD: number;
    WEIGHT: number;
  };
  atr: {
    PERIOD: number;
    MULTIPLIER: number;
    WEIGHT: number;
  };
  volume: {
    PERIOD: number;
    THRESHOLD: number;
    WEIGHT: number;
  };
  trend: {
    PERIOD: number;
    THRESHOLD: number;
    WEIGHT: number;
  };
  decision: {
    MIN_CONFIDENCE_THRESHOLD: number;
    MIN_CANDLES_REQUIRED: number;
  };
  ANALYSIS_WAIT_TIME_BETWEEN_TRADES_SECONDS: number;
}

export function getAnalysisEnvConfig(): AnalysisEnvConfig {
  return {
    rsi: {
      PERIOD: Number(process.env.RSI_PERIOD) || 14,
      OVERBOUGHT: Number(process.env.RSI_OVERBOUGHT) || 65,
      OVERSOLD: Number(process.env.RSI_OVERSOLD) || 35,
      NEUTRAL: Number(process.env.RSI_NEUTRAL) || 50,
      WEIGHT: Number(process.env.RSI_WEIGHT) || 0.2,
    },
    macd: {
      FAST_PERIOD: Number(process.env.MACD_FAST_PERIOD) || 8,
      SLOW_PERIOD: Number(process.env.MACD_SLOW_PERIOD) || 17,
      SIGNAL_PERIOD: Number(process.env.MACD_SIGNAL_PERIOD) || 9,
      THRESHOLD: Number(process.env.MACD_THRESHOLD) || 0.5,
      WEIGHT: Number(process.env.MACD_WEIGHT) || 0.2,
    },
    bollinger: {
      PERIOD: Number(process.env.BOLLINGER_PERIOD) || 14,
      DEVIATIONS: Number(process.env.BOLLINGER_MULTIPLIER) || 1.8,
      VOLATILITY_THRESHOLD:
        Number(process.env.BOLLINGER_VOLATILITY_THRESHOLD) || 0.02,
      SQUEEZE_THRESHOLD:
        Number(process.env.BOLLINGER_SQUEEZE_THRESHOLD) || 0.01,
      WEIGHT: Number(process.env.BOLLINGER_WEIGHT) || 0.15,
    },
    stochastic: {
      PERIOD: Number(process.env.STOCHASTIC_PERIOD) || 9,
      SMOOTHING: Number(process.env.STOCHASTIC_SMOOTHING) || 3,
      OVERBOUGHT: Number(process.env.STOCHASTIC_OVERBOUGHT) || 80,
      OVERSOLD: Number(process.env.STOCHASTIC_OVERSOLD) || 20,
      WEIGHT: Number(process.env.STOCHASTIC_WEIGHT) || 0.15,
      DEFAULT_VALUE: Number(process.env.STOCHASTIC_DEFAULT_VALUE) || 50,
    },
    ema: {
      FAST_PERIOD: Number(process.env.EMA_FAST_PERIOD) || 7,
      SLOW_PERIOD: Number(process.env.EMA_SLOW_PERIOD) || 14,
      THRESHOLD: Number(process.env.EMA_THRESHOLD) || 0.001,
      WEIGHT: Number(process.env.EMA_WEIGHT) || 0.2,
    },
    atr: {
      PERIOD: Number(process.env.ATR_PERIOD) || 9,
      MULTIPLIER: Number(process.env.ATR_MULTIPLIER) || 1.5,
      WEIGHT: Number(process.env.ATR_WEIGHT) || 0.05,
    },
    volume: {
      PERIOD: Number(process.env.VOLUME_PERIOD) || 9,
      THRESHOLD: Number(process.env.VOLUME_THRESHOLD) || 1.5,
      WEIGHT: Number(process.env.VOLUME_WEIGHT) || 0.03,
    },
    trend: {
      PERIOD: Number(process.env.TREND_PERIOD) || 9,
      THRESHOLD: Number(process.env.TREND_THRESHOLD) || 25,
      WEIGHT: Number(process.env.TREND_WEIGHT) || 0.02,
    },
    decision: {
      MIN_CONFIDENCE_THRESHOLD:
        Number(process.env.MIN_CONFIDENCE_THRESHOLD) || 0.65,
      MIN_CANDLES_REQUIRED: Number(process.env.MIN_CANDLES_REQUIRED) || 26,
    },
    ANALYSIS_WAIT_TIME_BETWEEN_TRADES_SECONDS:
      Number(process.env.ANALYSIS_WAIT_TIME_BETWEEN_TRADES_SECONDS) || 15,
  };
}
