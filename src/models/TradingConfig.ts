export interface IndicatorWeights {
  ema: number;
  rsi: number;
  macd: number;
  bollinger: number;
  stochastic: number;
}

export class TradingConfig {
  public readonly indicatorWeights: {
    ema: number;
    rsi: number;
    macd: number;
    bollinger: number;
    stochastic: number;
  };

  public readonly priceHistoryLength: number;
  public readonly minPriceHistoryLength: number;
  public readonly decisionThresholdUpper: number;
  public readonly decisionThresholdLower: number;
  public readonly minConfidence: number;
  public readonly minProfitThreshold: number;
  public readonly maxTradeCycles: number;
  public readonly isDemo: boolean;

  constructor(
    public readonly buyAmount: number,
    public readonly instrumentId: number
  ) {
    // Load all configurations from environment variables
    this.priceHistoryLength = parseFloat(
      process.env.PRICE_HISTORY_LENGTH || "300"
    );
    this.minPriceHistoryLength = parseFloat(
      process.env.MIN_PRICE_HISTORY_LENGTH || "100"
    );
    this.decisionThresholdUpper = parseFloat(
      process.env.DECISION_THRESHOLD_UPPER || "0.2"
    );
    this.decisionThresholdLower = parseFloat(
      process.env.DECISION_THRESHOLD_LOWER || "-0.2"
    );
    this.minConfidence = parseFloat(
      process.env.MIN_CONFIDENCE_THRESHOLD || "0.4"
    );
    this.minProfitThreshold = parseFloat(
      process.env.MIN_PROFIT_THRESHOLD || "0.25"
    );
    this.maxTradeCycles = parseInt(process.env.MAX_TRADE_CYCLES || "1");
    this.isDemo = process.env.IS_DEMO === "true";

    // Load weights from environment variables
    const envWeights = {
      ema: parseFloat(process.env.INDICATOR_WEIGHT_EMA || "0.3"),
      rsi: parseFloat(process.env.INDICATOR_WEIGHT_RSI || "0.2"),
      macd: parseFloat(process.env.INDICATOR_WEIGHT_MACD || "0.2"),
      bollinger: parseFloat(process.env.INDICATOR_WEIGHT_BOLLINGER || "0.15"),
      stochastic: parseFloat(process.env.INDICATOR_WEIGHT_STOCHASTIC || "0.15"),
    };

    // Set indicator weights
    this.indicatorWeights = envWeights;

    // Validate that weights sum to 1.0
    const sum = Object.values(this.indicatorWeights).reduce((a, b) => a + b, 0);
    if (Math.abs(sum - 1.0) > 0.0001) {
      throw new Error(`Indicator weights must sum to 1.0, got ${sum}`);
    }
  }
}
