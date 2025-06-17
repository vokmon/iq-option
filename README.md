# IQ Option Trading Bot

A TypeScript-based trading bot for IQ Option platform that implements a Support/Resistance strategy with multiple timeframe analysis.

## Features

- Support/Resistance strategy implementation
- Multiple timeframe analysis (15m and 60m)
- Bollinger Bands and RSI indicators
- Configurable trading parameters
- Detailed logging system

## Environment Configuration

Create a `.env` file in the root directory with the following parameters:

```env
# API Configuration
API_URL=wss://iqoption.com/echo/websocket
ACCESS_TOKEN=your_access_token
LOGIN_URL=https://api.iqoption.com

# Login credentials for IQ Option
LOGIN_EMAIL=your_email
LOGIN_PASSWORD=your_password

# Trading Configuration
IS_REAL=false  # Set to true for real balance, false for demo balance

# Logger Configuration
LOG_PATH=/path/to/logs
LOG_TO_FILE=false  # Set to true to write logs to file, false to only log to console

# Technical Analysis Parameters
LOOKBACK_PERIOD=20                    # Number of candles to analyze for support/resistance
SMALL_TIME_FRAME_CANDLE_INTERVAL_MINUTES=15  # Small timeframe interval
BIG_TIME_FRAME_CANDLE_INTERVAL_MINUTES=60    # Big timeframe interval
MIN_CONFIDENCE_THRESHOLD=0.80         # Minimum confidence required to enter a trade

# Trading Behavior
ANALYSIS_WAIT_TIME_BETWEEN_TRADES_SECONDS=10  # Wait time between analyses
SELL_WHEN_PROFIT_ABOVE_PERCENTAGE=20         # Take profit percentage

# Support/Resistance Indicator Parameters
ANALYSIS_PERIOD_MINUTES=14           # Base period for SMA, Bollinger Bands, and RSI calculations
STD_DEV_MULTIPLIER=2.0              # Standard deviation multiplier for main Bollinger Bands
STD_DEV_MULTIPLIER_1=1.75           # Standard deviation multiplier for secondary Bollinger Bands
RSI_BUY_THRESHOLD=40                # RSI threshold for buy signals (oversold condition)
RSI_SELL_THRESHOLD=60               # RSI threshold for sell signals (overbought condition)
```

## Strategy Overview

The bot implements a Support/Resistance strategy with multiple timeframe analysis (15m and 60m) and configurable technical indicators.

### Multiple Timeframe Analysis

- 15-minute timeframe for short-term signals
- 60-minute timeframe for long-term trend confirmation

### Risk Management

- Minimum confidence threshold (0.80) required for trade entry
- Take profit at 20% gain
- Wait period between trades to avoid overtrading

## Technical Analysis Parameters

The strategy uses several configurable parameters that can be adjusted in the environment configuration:

```env
# Technical Analysis Parameters
ANALYSIS_PERIOD_MINUTES=14           # Base period for SMA, Bollinger Bands, and RSI calculations
STD_DEV_MULTIPLIER=2.0              # Standard deviation multiplier for main Bollinger Bands
STD_DEV_MULTIPLIER_1=1.75           # Standard deviation multiplier for secondary Bollinger Bands
RSI_BUY_THRESHOLD=40                # RSI threshold for buy signals (oversold condition)
RSI_SELL_THRESHOLD=60               # RSI threshold for sell signals (overbought condition)
```

### Parameter Descriptions

1. **ANALYSIS_PERIOD_MINUTES**

   - Base period used for calculating SMA (Simple Moving Average)
   - Also used for Bollinger Bands and RSI calculations
   - Lower values make the indicator more responsive but more volatile
   - Higher values provide smoother signals but may lag

2. **STD_DEV_MULTIPLIER**

   - Main multiplier for Bollinger Bands calculation
   - Determines the width of the main bands
   - Higher values create wider bands (less signals)
   - Lower values create tighter bands (more signals)

3. **STD_DEV_MULTIPLIER_1**

   - Secondary multiplier for Bollinger Bands
   - Creates inner bands for additional confirmation
   - Should be lower than the main multiplier
   - Used for early signal detection

4. **RSI_BUY_THRESHOLD**

   - RSI level below which buy signals are considered
   - Lower values (e.g., 30) indicate stronger oversold conditions
   - Higher values (e.g., 40) generate more buy signals
   - Typical range: 30-40

5. **RSI_SELL_THRESHOLD**
   - RSI level above which sell signals are considered
   - Higher values (e.g., 70) indicate stronger overbought conditions
   - Lower values (e.g., 60) generate more sell signals
   - Typical range: 60-70

### Signal Generation and Confidence Levels

The indicator generates signals based on the following conditions:

1. **Buy Signals** (when any of these conditions are met):

   - Price below lower band + RSI below buy threshold
   - Price below secondary lower band + price action confirmation
   - All conditions met with highest confidence (0.8)

2. **Sell Signals** (when any of these conditions are met):
   - Price above upper band + RSI above sell threshold
   - Price above secondary upper band + price action confirmation
   - All conditions met with highest confidence (0.8)

Confidence Levels:

- 0.8: Highest confidence (all conditions met)
- 0.6: Medium confidence (price action, BB, and RSI conditions)
- 0.4: Lower confidence (only price action and BB conditions)
- 0.0: No signal (neutral)

## Prompt to adjust the param

```
I need help adjusting the technical analysis parameters for my trading strategy. the based parameters are optimized for:
- Small timeframe: 15 minutes
- Long timeframe: 60 minutes

Based parameters:
ANALYSIS_PERIOD_MINUTES=14
STD_DEV_MULTIPLIER=2
STD_DEV_MULTIPLIER_1=1.75
RSI_BUY_THRESHOLD=40
RSI_SELL_THRESHOLD=60
LOOKBACK_PERIOD=20

I want to adjust these parameters for:
- Small timeframe: [X] minutes
- Long timeframe: [Y] minutes

Please provide the adjusted parameters in the following format:

ANALYSIS_PERIOD_MINUTES=[value]
STD_DEV_MULTIPLIER=[value]
STD_DEV_MULTIPLIER_1=[value]
RSI_BUY_THRESHOLD=[value]
RSI_SELL_THRESHOLD=[value]
LOOKBACK_PERIOD=[value]

For each parameter, please explain:
- The recommended new value
- Why this value is appropriate for the new timeframe combination
- How it compares to the original value

The parameters should:
1. Maintain the same strategy logic but be more responsive to the new timeframe
2. Generate more trading signals while keeping reasonable risk management
3. Consider the ratio between small and long timeframes (Y/X) when adjusting parameters

```

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create and configure your `.env` file
4. Build the project:
   ```bash
   npm run build
   ```

## Usage

Start the bot:

```bash
npm start
```

## Logging

The bot provides detailed logging of:

- Candle data analysis for both timeframes
- Trading signals and confidence levels
- Trade execution and results
- System status and errors

## Development

- Built with TypeScript
- Uses IQ Option WebSocket API
- Implements custom technical analysis indicators
- Modular architecture for easy extension

## License

MIT License
