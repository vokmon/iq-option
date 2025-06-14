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
bun start:trade <instrumentId> <buy amount>
```

Example:

```bash
bun start:trade EURUSD 100
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

## License

[Add your license information here]

## Disclaimer

Trading involves risk. This bot is provided for educational purposes only. Use at your own risk.
