# IQ Option Auto Trading Bot

An automated trading bot for IQ Option platform that allows you to execute trades programmatically.

## Prerequisites

- [Bun](https://bun.sh) runtime (v1.2.16 or higher)
- IQ Option account
- API credentials (if required)

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd iq-option
```

2. Install dependencies:

```bash
bun install
```

## Usage

### List Available Instruments

To view all available trading instruments and their IDs:

```bash
bun start:list
```

### Start Trading

To start automated trading with a specific instrument:

```bash
bun start:trade <CANDLE_INTERVAL_SECONDS> <CANDLE_ANALYSIS_PERIOD_MINUTES> <MAX_TRADE_CYCLE> <INSTRUMENT_IDINSTRUMENT_ID/INSTRUMENT_NAME> <BUY_AMOUNT>
```

Example:

```bash
# with id
bun start:trade 15 15 3 2144 1

# with name
bun start:trade 15 15 3 USDJPY 1
```

## Features

- Automated trading execution
- Instrument listing and selection
- Configurable trade amounts
- Real-time market data processing

## Configuration

Make sure to configure your IQ Option credentials in the appropriate configuration file before starting to trade.

## Development

This project was created using `bun init` in bun v1.2.16. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

# IQ Option Trading Bot - Technical Analysis Configuration

This document explains the technical analysis parameters used in the trading bot and how to adjust them for optimal performance.

# Technical Analysis Documentation

## How Our Trading Bot Makes Decisions

Our bot uses several tools (called indicators) to help decide when to buy or sell. Think of these like different ways of looking at the market to make better decisions.

### The Final Decision

When our bot analyzes the market, it gives us:

#### Direction

- **Type**: `"call" | "put" | null`
- **What it means**:
  - `"call"`: Bot thinks price will go up (good time to buy)
  - `"put"`: Bot thinks price will go down (good time to sell)
  - `null`: Bot is unsure (better to wait)

#### Confidence

- **Type**: `number` (0.0 to 1.0)
- **What it means**:
  - `0.0` (0%): Bot is completely unsure
  - `0.5` (50%): Bot is somewhat confident
  - `1.0` (100%): Bot is very confident
- **Trading Rule**: Bot only trades when confidence is above 0.65 (65%)

#### Should Trade

- **Type**: `boolean` (true/false)
- **What it means**:
  - `true`: All conditions are good for trading
  - `false`: Better to wait for better conditions

#### Signal Strength

- **Type**: `number` (-1.0 to 1.0)
- **What it means**:
  - `-1.0` (-100%): All tools strongly suggest selling
  - `-0.5` (-50%): Most tools suggest selling
  - `0.0` (0%): Tools are mixed or unclear
  - `0.5` (50%): Most tools suggest buying
  - `1.0` (100%): All tools strongly suggest buying

### The Tools We Use

Our trading strategy uses a combination of technical indicators, each with specific parameters optimized for 15-minute trading periods. Here's what each indicator does and how to interpret its values:

#### RSI (Relative Strength Index)

- **Weight (0.2)**: How much influence this indicator has in our final decision (20% of total)
  - Min: 0, Max: 1 (100%)
- **Period (14)**: Number of candles to look back (standard is 14, higher = smoother but slower)
  - Min: 2, Max: 100 (recommended: 14)
- **Overbought (65)**: When RSI goes above this, the asset might be overvalued
  - Min: 50, Max: 100 (recommended: 65-80)
- **Oversold (35)**: When RSI goes below this, the asset might be undervalued
  - Min: 0, Max: 50 (recommended: 20-35)
- **Neutral (50)**: The middle point where RSI indicates no clear trend
  - Fixed value: 50

_Beginner Tip_: Think of RSI like a speedometer. When it's too high (above 65), the price might need to slow down. When it's too low (below 35), it might need to speed up.

_Medium Tip_: RSI helps identify potential reversals. A reading above 65 suggests a possible downward correction, while below 35 suggests a potential upward bounce.

#### MACD (Moving Average Convergence Divergence)

- **Weight (0.2)**: 20% influence on final decision
  - Min: 0, Max: 1 (100%)
- **Fast Period (8)**: Shorter-term trend (more sensitive to price changes)
  - Min: 2, Max: 50 (recommended: 8-12)
- **Slow Period (17)**: Longer-term trend (smoother, less sensitive)
  - Min: Fast Period + 1, Max: 100 (recommended: 17-26)
- **Signal Period (9)**: Smoothing line for the MACD
  - Min: 2, Max: 50 (recommended: 9)
- **Threshold (0.5)**: Minimum difference needed to generate a signal
  - Min: 0.1, Max: 5 (recommended: 0.5-1)

_Beginner Tip_: MACD is like two moving averages racing each other. When the fast one crosses above the slow one, it might be time to buy. When it crosses below, it might be time to sell.

_Medium Tip_: The threshold of 0.5 helps filter out weak signals. Higher values mean stronger trends but fewer signals.

#### Bollinger Bands

- **Weight (0.15)**: 15% influence on final decision
  - Min: 0, Max: 1 (100%)
- **Period (14)**: Number of candles for the middle band calculation
  - Min: 5, Max: 100 (recommended: 14-20)
- **Multiplier (1.8)**: How wide the bands are (higher = wider bands)
  - Min: 1, Max: 3 (recommended: 1.8-2)
- **Volatility Threshold (0.02)**: When bands are this wide, market is volatile
  - Min: 0.01, Max: 0.1 (recommended: 0.02-0.05)
- **Squeeze Threshold (0.2)**: When bands are this narrow, market is quiet
  - Min: 0.1, Max: 0.5 (recommended: 0.2-0.3)

_Beginner Tip_: Think of Bollinger Bands as a price channel. When price touches the top band, it might be too high. When it touches the bottom band, it might be too low.

_Medium Tip_: The squeeze threshold (0.2) helps identify periods of low volatility that often precede big moves. Higher values mean waiting for stronger squeezes.

#### Stochastic

- **Weight (0.15)**: 15% influence on final decision
  - Min: 0, Max: 1 (100%)
- **Period (9)**: Look-back period for price range
  - Min: 5, Max: 50 (recommended: 9-14)
- **Smoothing (3)**: How much to smooth the indicator (higher = smoother)
  - Min: 1, Max: 10 (recommended: 3)
- **Overbought (80)**: When indicator goes above this, price might be too high
  - Min: 70, Max: 90 (recommended: 80)
- **Oversold (20)**: When indicator goes below this, price might be too low
  - Min: 10, Max: 30 (recommended: 20)
- **Default Value (50)**: Starting point when there's no price movement
  - Fixed value: 50

_Beginner Tip_: Stochastic is like a price position indicator. It shows where the current price is compared to recent highs and lows.

_Medium Tip_: The smoothing of 3 helps reduce false signals. Higher values mean fewer but more reliable signals.

#### EMA (Exponential Moving Average)

- **Weight (0.2)**: 20% influence on final decision
  - Min: 0, Max: 1 (100%)
- **Fast Period (7)**: Short-term trend (more responsive)
  - Min: 2, Max: 50 (recommended: 7-12)
- **Slow Period (14)**: Long-term trend (more stable)
  - Min: Fast Period + 1, Max: 100 (recommended: 14-26)
- **Threshold (0.001)**: Minimum difference needed for a signal
  - Min: 0.0001, Max: 0.01 (recommended: 0.001-0.005)

_Beginner Tip_: EMA is like a smoothed price line. When the fast line crosses above the slow line, it might be time to buy.

_Medium Tip_: The threshold of 0.001 helps filter out weak crossovers. Higher values mean stronger trends but fewer signals.

#### ATR (Average True Range)

- **Weight (0.05)**: 5% influence on final decision
  - Min: 0, Max: 1 (100%)
- **Period (9)**: Number of candles to calculate average range
  - Min: 5, Max: 50 (recommended: 9-14)
- **Multiplier (1.5)**: How far to place bands from the price
  - Min: 1, Max: 3 (recommended: 1.5-2)

_Beginner Tip_: ATR measures how much the price moves on average. Higher ATR means more volatile price movement.

_Medium Tip_: The multiplier of 1.5 helps set stop losses and take profits. Higher values mean wider stops but more room for price movement.

#### Volume

- **Weight (0.03)**: 3% influence on final decision
  - Min: 0, Max: 1 (100%)
- **Period (9)**: Number of candles to calculate average volume
  - Min: 5, Max: 50 (recommended: 9-20)
- **Threshold (1.5)**: How much more volume is needed for a signal
  - Min: 1.1, Max: 3 (recommended: 1.5-2)

_Beginner Tip_: Volume shows how many trades are happening. High volume often means strong moves.

_Medium Tip_: The threshold of 1.5 means we need 50% more volume than average for a signal. Higher values mean stronger volume confirmation.

#### Trend

- **Weight (0.02)**: 2% influence on final decision
  - Min: 0, Max: 1 (100%)
- **Period (9)**: Number of candles to determine trend
  - Min: 5, Max: 50 (recommended: 9-20)
- **Threshold (25)**: Minimum percentage change for a trend signal
  - Min: 10, Max: 50 (recommended: 25-30)

_Beginner Tip_: Trend shows if the price is moving up or down over time.

_Medium Tip_: The threshold of 25 means we need a 25% price change to confirm a trend. Higher values mean stronger trends but fewer signals.

### How We Combine Everything

The bot looks at all these tools together to make a final decision:

- **Strong Buy Signal** (+100%): All tools agree it's a good time to buy
- **Moderate Buy Signal** (+50%): Most tools suggest buying
- **Neutral** (0%): Tools are mixed or unclear
- **Moderate Sell Signal** (-50%): Most tools suggest selling
- **Strong Sell Signal** (-100%): All tools agree it's a good time to sell

### Important Note

The bot is set up to be careful and only trade when it's very confident (above 65% confidence). This helps avoid risky trades and protect your money.

## Configuration

All these tools can be adjusted in the `config/env` file. The current settings are optimized for 15-minute trading periods, but they can be changed to match your trading style.

## Technical Analysis Parameters

### RSI (Relative Strength Index)

- Weight: 0.2
- Period: 14
- Overbought: 65
- Oversold: 35
- Neutral: 50

### MACD (Moving Average Convergence Divergence)

- Weight: 0.2
- Fast Period: 8
- Slow Period: 17
- Signal Period: 9
- Threshold: 0.5

### Bollinger Bands

- Weight: 0.15
- Period: 14
- Multiplier: 1.8
- Volatility Threshold: 0.02
- Squeeze Threshold: 0.2

### Stochastic

- Weight: 0.15
- Period: 9
- Smoothing: 3
- Overbought: 80
- Oversold: 20
- Default Value: 50

### EMA (Exponential Moving Average)

- Weight: 0.2
- Fast Period: 7
- Slow Period: 14
- Threshold: 0.001

### ATR (Average True Range)

- Weight: 0.05
- Period: 9
- Multiplier: 1.5

### Volume

- Weight: 0.03
- Period: 9
- Threshold: 1.5

### Trend

- Weight: 0.02
- Period: 9
- Threshold: 25

### Decision Parameters

- Minimum Confidence Threshold: 0.65
- Minimum Candles Required: 26 (matches longest period - MACD)
- Analysis Wait Time Between Trades: 1 second
