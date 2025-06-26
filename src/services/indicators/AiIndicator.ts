import type {
  BinaryOptionsActiveInstrument,
  Candle,
} from "@quadcode-tech/client-sdk-js";
import type { IndicatorResult } from "./Indicator";
import { getChatGoogleGenerativeAI } from "../../utils/AiModel";
import {
  BaseOutputParser,
  JsonOutputParser,
  StringOutputParser,
} from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { getAnalysisEnvConfig } from "../../models/environment/AnalysisEnvConfig";
import { getMinutesUntil } from "../../utils/Dateutils";
import { transformCandles } from "../../utils/DataUtils";

export class AiIndicator {
  private analysisConfig = getAnalysisEnvConfig();

  public async calculate(
    smallTimeframeCandles: Candle[],
    bigTimeframeCandles: Candle[],
    instrument: BinaryOptionsActiveInstrument
  ): Promise<IndicatorResult> {
    const chain = await this.getChain(
      this.prompt,
      new JsonOutputParser<IndicatorResult>()
    );

    const result = await chain.invoke({
      smallTimeframeCandles: JSON.stringify(
        transformCandles(smallTimeframeCandles)
      ).replace(/'/g, ""),
      smallTimeframeCandlesLookback: smallTimeframeCandles.length,
      smallTimeframeCandlesInterval:
        this.analysisConfig.SMALL_TIME_FRAME_CANDLE_INTERVAL_MINUTES,

      bigTimeframeCandles: JSON.stringify(
        transformCandles(bigTimeframeCandles)
      ).replace(/'/g, ""),
      bigTimeframeCandlesLookback: bigTimeframeCandles.length,
      bigTimeframeCandlesInterval:
        this.analysisConfig.BIG_TIME_FRAME_CANDLE_INTERVAL_MINUTES,

      nextTradeMinutes: getMinutesUntil(instrument.expiredAt),
      currentPrice:
        smallTimeframeCandles[smallTimeframeCandles.length - 1]?.close,
      currentTimestamp: new Date().getTime() / 1000,
    });

    return result as IndicatorResult;
  }

  private getChain = async (
    promptTemplate: string,
    parser?: BaseOutputParser
  ) => {
    const prompt = await PromptTemplate.fromTemplate(promptTemplate);

    const llm = getChatGoogleGenerativeAI();
    return RunnableSequence.from([
      prompt,
      llm,
      parser || new StringOutputParser(),
    ]);
  };

  private prompt = `
You are an expert Quantitative Analyst specializing in high-frequency binary options trading.
Analyze multi-timeframe candlestick data to determine whether a trade should be placed now.
Your primary goal is to predict the price direction over the next {nextTradeMinutes} minutes and provide a clear, actionable trading signal.

Inputs
smallTimeframeCandles: Candlestick data on a short timeframe ({smallTimeframeCandlesInterval} minutes), with {smallTimeframeCandlesLookback} periods — for precision entry signal.
bigTimeframeCandles: Candlestick data on a higher timeframe ({bigTimeframeCandlesInterval} minutes), with {bigTimeframeCandlesLookback} periods — for analyzing overall and trend of market context.
currentPrice: The current, live market price of the asset. This is your potential trade entry point.

Main Idea:
1. Analyze both timeframes together to form a clear view of:
 - Market trend direction (short-term and long-term)
 - Momentum shifts
 - Recent breakout or rejection behavior

2. Note any reversal or continuation patterns, such as:
 - Engulfing candles
 - Doji at key levels
 - Pin bars, hammers, shooting stars
 - Inside bars, breakouts, or false breakouts
 - Other patterns that you think are important

3. Incorporate other models or techniques where appropriate, such as:
 - Moving averages, trendlines, or zones
 - RSI/MACD divergence
 - Volume shifts or volatility changes
 - Any technical indicator that strengthens the signal
 - Other patterns that you think are important

 4. Critically, every potential signal must be evaluated for its **confluence** and **risk context**. A signal is only as good as the point at which it is proven wrong.

Your Task:
Execute a step-by-step analysis to determine if a trade should be placed.

1. Strategic Landscape Analysis (Big Timeframe: {bigTimeframeCandlesInterval} min):
Your goal here is to establish the overall market context and bias.

 - Trend and Structure: Is the market in a clear uptrend, downtrend, or a ranging/consolidating phase? Infer this by analyzing the sequence of swing highs and lows as if you were plotting key moving averages.
 - Key Price Zones: Identify the most significant horizontal support and resistance levels. These are the major 'lines in the sand.'

 - Macro Chart Patterns: Scan for large-scale patterns that define the current structure. Consider models such as:
   - Head and Shoulders (or Inverse)
   - Double/Triple Tops and Bottoms
   - Triangles (Ascending, Descending, Symmetrical)
   - Channels and Wedges
   - Other patterns that you think are important
 - Volume Profile Context: Note where the majority of trading volume has occurred. This helps confirm the strength of support/resistance zones.

2. Tactical Entry Analysis (Small Timeframe: {smallTimeframeCandlesInterval} min):
Your goal here is to find a high-precision, tactical entry point confirming it with the currentPrice that aligns with the big-picture analysis.

- Price Action & Momentum: How is the price reacting as it approaches the key zones identified in Step 1? Look for signs of confirmation or rejection. Infer momentum conditions as if you were looking at an oscillator like RSI or MACD (e.g., Price is re-testing a major resistance level from the big timeframe, and the small timeframe shows bearish divergence with weakening upward momentum').
- High-Probability Candlestick Formations: Identify specific, actionable candlestick signals. Your toolkit must include:
  - Reversal Patterns: Engulfing (Bullish/Bearish), Pin Bars (Hammers/Shooting Stars), Dojis at key levels, Tweezer Tops/Bottoms, Morning/Evening Star formations.
  - Continuation Patterns: Inside Bars, Flags, Pennants suggesting a pause before resuming the trend.
- Volume Spread Analysis (VSA): This is critical for precision. Analyze the relationship between a candle's volume and its price spread (range). Note signals like:
  - Strength: 'Stopping Volume' (ultra-high volume halting a downtrend), 'Effort to Rise'.
  - Weakness: 'No Demand Bar' (a narrow-spread up-bar on low volume), 'Effort to Fall'.
- Current Price Evaluation: This is a critical confirmation step. Evaluate the current price of {currentPrice} in real-time.
  - Where is it relative to the high/low of the last closed candle?
  - Is it actively breaking a key immediate level, or is it showing signs of rejection from it right now? Your decision must be based on this live context.
- Volatility Analysis: Assess the current market volatility. Are the Bollinger Bands expanding (suggesting a powerful move or breakout) or contracting (suggesting consolidation or a potential 'squeeze')? Is the Average True Range (ATR) increasing or decreasing? This context is critical for binary options.
  - Other patterns that you think are important

3. Signal Synthesis & Confluence:
  - Synthesize the findings. A high-quality signal requires strong confluence (e.g., big timeframe is in an uptrend, small timeframe shows a bullish pin bar at support, and the current price of {currentPrice} is now moving above that pin bar's high).
  - If the small timeframe action contradicts the big timeframe bias, or if the current price of {currentPrice} is failing to confirm a pattern, advise caution (likely neutral)
  - Identify the Counter-Argument & Invalidation Point: What would prove this trade idea wrong? Explicitly state the price level that, if broken, would invalidate the signal.
    - Example for a 'call' signal: "The signal is based on the support at $1.2500. The idea is invalid if the price breaks decisively below this level."

Confidence Score Calculation:**
Calculate confidence on a scale of 0.0 to 1.0 based on the number of confluence factors.
- Start at 0.5 (Neutral).
- +0.1 for clear Big Timeframe trend alignment.
- +0.1 for a strong Key Price Zone (well-tested support/resistance).
- +0.1 for a classic, unambiguous candlestick pattern on the Small Timeframe.
- +0.1 for confirmation from Volume (VSA or high-volume reaction).
- +0.1 for confirmation from an indicator (e.g., MACD/RSI divergence, Bollinger Band behavior).
- -0.2 if small timeframe action directly contradicts the big timeframe bias (e.g., bearish pattern in a strong uptrend).


Your Goal and Final Decision:
Based on your synthesis, and evaluating if the current price of {currentPrice} is an optimal entry point, determine the optimal trading decision for a {nextTradeMinutes}-minute expiration.
'call' → If the price is likely to be higher than {currentPrice} after {nextTradeMinutes} minutes.
'put' →  If the price is likely to be lower than {currentPrice} after {nextTradeMinutes} minutes.
'neutral' → If conditions are unclear, risky, or contradicting

Your output must be a single, clean JSON object with the following structure.
  signal: call | put | neutral,
  confidence: 0.0 to 1.0,
  string: Thai-language explanation in bullet points

Be direct and actionable

Provide a concise explanation (in Thai) for the decision

Make sure the result helps a trader decide immediately

Current Timestamp in seconds
{currentTimestamp}

Current price:
{currentPrice}

--------------------------------

Candle Data
Fields: explanation
id: id of the candle
from: start time of the candle. timestamp in seconds
to: end time of the candle. timestamp in seconds
open: open price of the candle
close: close price of the candle
min: minimum price of the candle
max: maximum price of the candle
at: time of the candle in timestamp in nanoseconds

smallTimeframeCandles ({smallTimeframeCandlesInterval} min):
{smallTimeframeCandles}

bigTimeframeCandles ({bigTimeframeCandlesInterval} min):
{bigTimeframeCandles}

`;
}
