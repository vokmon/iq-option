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
```

## Strategy Overview

The bot implements a Support/Resistance strategy with the following components:

1. **Multiple Timeframe Analysis**

   - 15-minute timeframe for short-term signals
   - 60-minute timeframe for long-term trend confirmation

2. **Technical Indicators**

   - Bollinger Bands (14-period SMA with 2.0 and 1.75 standard deviations)
   - RSI (14-period)
   - Support/Resistance levels based on 20-period lookback

3. **Entry Conditions**

   - Buy signals when price is below lower Bollinger Band and RSI ≤ 40
   - Sell signals when price is above upper Bollinger Band and RSI ≥ 60
   - Additional confirmation from price action patterns

4. **Risk Management**
   - Minimum confidence threshold (0.80) required for trade entry
   - Take profit at 20% gain
   - Wait period between trades to avoid overtrading

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
