import { TradingConfig } from "../models/TradingConfig";

export class TechnicalAnalysis {
  private priceHistory: number[] = [];
  private volumeHistory: number[] = [];

  constructor(private readonly config: TradingConfig) {}

  addPrice(price: number, volume: number = 0): void {
    this.priceHistory.push(price);
    this.volumeHistory.push(volume);
    if (this.priceHistory.length > this.config.priceHistoryLength) {
      this.priceHistory.shift();
      this.volumeHistory.shift();
    }
  }

  getPriceHistory(): number[] {
    return [...this.priceHistory];
  }

  getVolumeHistory(): number[] {
    return [...this.volumeHistory];
  }

  getHistoryLength(): number {
    return this.priceHistory.length;
  }

  calculateEMA(prices: number[], period: number): number {
    const k = 2 / (period + 1);
    if (prices.length === 0) {
      return 0;
    }
    let ema: number = prices[0]!;
    for (let i = 1; i < prices.length; i++) {
      ema = prices[i]! * k + ema * (1 - k);
    }
    return ema;
  }

  calculateRSI(period: number = 14): number {
    if (this.priceHistory.length < period + 1) {
      return 50; // Default neutral value
    }

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
      const difference =
        this.priceHistory[this.priceHistory.length - i]! -
        this.priceHistory[this.priceHistory.length - i - 1]!;
      if (difference >= 0) {
        gains += difference;
      } else {
        losses -= difference;
      }
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - 100 / (1 + rs);
  }

  calculateMACD(): { macd: number; signal: number; histogram: number } {
    const ema12 = this.calculateEMA(this.priceHistory.slice(-12), 12);
    const ema26 = this.calculateEMA(this.priceHistory.slice(-26), 26);
    const macd = ema12 - ema26;
    const signal = this.calculateEMA([macd], 9);
    const histogram = macd - signal;

    return { macd, signal, histogram };
  }

  calculateBollingerBands(
    period: number = 20,
    stdDev: number = 2
  ): { upper: number; middle: number; lower: number } {
    if (this.priceHistory.length < period) {
      return { upper: 0, middle: 0, lower: 0 };
    }

    const prices = this.priceHistory.slice(-period);
    const sma = prices.reduce((a, b) => a + b, 0) / period;

    const squaredDiffs = prices.map((price) => Math.pow(price - sma, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
    const standardDeviation = Math.sqrt(variance);

    return {
      upper: sma + standardDeviation * stdDev,
      middle: sma,
      lower: sma - standardDeviation * stdDev,
    };
  }

  calculateStochastic(
    period: number = 14,
    smoothK: number = 3,
    smoothD: number = 3
  ): { k: number; d: number } {
    if (this.priceHistory.length < period) {
      return { k: 50, d: 50 }; // Default neutral values
    }

    const prices = this.priceHistory.slice(-period);
    const highestHigh = Math.max(...prices);
    const lowestLow = Math.min(...prices);
    const currentClose = prices[prices.length - 1]!;

    const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
    const d = this.calculateEMA([k], smoothD);

    return { k, d };
  }

  predictDirection(): {
    direction: "call" | "put" | "neutral";
    confidence: number;
  } {
    if (this.priceHistory.length < 26) {
      return { direction: "neutral", confidence: 0 };
    }

    const signals = {
      ema: 0,
      rsi: 0,
      macd: 0,
      bollinger: 0,
      stochastic: 0,
    };

    const ema5 = this.calculateEMA(this.priceHistory.slice(-5), 5);
    const ema20 = this.calculateEMA(this.priceHistory.slice(-20), 20);
    signals.ema = ema5 > ema20 ? 1 : -1;

    const rsi = this.calculateRSI();
    signals.rsi = rsi > 70 ? -1 : rsi < 30 ? 1 : 0;

    const { macd, signal } = this.calculateMACD();
    signals.macd = macd > signal ? 1 : -1;

    const { upper, lower } = this.calculateBollingerBands();
    const currentPrice = this.priceHistory[this.priceHistory.length - 1]!;
    signals.bollinger =
      currentPrice > upper ? -1 : currentPrice < lower ? 1 : 0;

    const { k, d } = this.calculateStochastic();
    signals.stochastic = k > 80 ? -1 : k < 20 ? 1 : 0;

    const weightedSum =
      signals.ema * this.config.indicatorWeights.ema +
      signals.rsi * this.config.indicatorWeights.rsi +
      signals.macd * this.config.indicatorWeights.macd +
      signals.bollinger * this.config.indicatorWeights.bollinger +
      signals.stochastic * this.config.indicatorWeights.stochastic;

    const confidence = Math.abs(weightedSum);

    // Load thresholds from environment variables
    const upperThreshold = this.config.decisionThresholdUpper;
    const lowerThreshold = this.config.decisionThresholdLower;

    let direction: "call" | "put" | "neutral";
    if (weightedSum > upperThreshold) {
      direction = "call";
    } else if (weightedSum < lowerThreshold) {
      direction = "put";
    } else {
      direction = "neutral";
    }

    return { direction, confidence };
  }

  getIndicators() {
    return {
      ema5: this.calculateEMA(this.priceHistory.slice(-5), 5),
      ema20: this.calculateEMA(this.priceHistory.slice(-20), 20),
      rsi: this.calculateRSI(),
      macd: this.calculateMACD(),
      bollinger: this.calculateBollingerBands(),
      stochastic: this.calculateStochastic(),
    };
  }
}
