import type {
  BinaryOptionsDirection,
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

export class SignalAiIndicator {
  public async calculate(
    smallTimeframeCandles: Candle[],
    bigTimeframeCandles: Candle[],
    signalDirection: BinaryOptionsDirection
  ): Promise<IndicatorResult> {
    const chain = await this.getChain(
      this.prompt,
      new JsonOutputParser<IndicatorResult>()
    );

    const result = await chain.invoke({
      smallTimeframeCandles: JSON.stringify(smallTimeframeCandles).replace(
        /"/g,
        ""
      ),
      smallTimeframeCandlesLookback: smallTimeframeCandles.length,
      bigTimeframeCandles: JSON.stringify(bigTimeframeCandles).replace(
        /"/g,
        ""
      ),
      bigTimeframeCandlesLookback: bigTimeframeCandles.length,
      signalDirection: signalDirection,
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
You are a professional binary options analyst. Analyze the following candlestick data to determine whether a binary option trade should be placed now, and in which direction.

Inputs:
smallTimeframeCandles: Candlesticks from a short timeframe (15-minute), using a lookback of {smallTimeframeCandlesLookback} periods.

bigTimeframeCandles: Candlesticks from a higher timeframe (1-hour), using a lookback of {bigTimeframeCandlesLookback} periods.

signalDirection: A suggested direction from an external signal system. It can be "up", "down", or "neutral".

Your task:

- Analyze price action patterns across both timeframes.

- Focus your analysis on what is likely to happen in the next 15 minutes

- Consider 
  - Trend direction and momentum across both timeframes
  - Key candlestick formations (e.g., engulfing, pin bar, doji)
  - Reversal or continuation signals
  - Support/resistance areas and recent breakout behavior
    and other technical indicators you see fit.
  - Determine if the data supports entering a call (up) or put (down) trade — or if its best to wait (neutral).

- Use signalDirection as an additional reference:
  - If it confirms your analysis, increase your confidence.
  -If it conflicts, decide if there's enough price action evidence to follow or wait.

Your goal is to determine whether to enter a trade now, and if so:
Call (up): If price is likely to go up within the next 15 minutes
Put (down): If price is likely to go down within the next 15 minutes
Neutral (hold): If no clear signal or conflicting evidence

json

  signal: up | down | neutral,  // Direction for the binary option trade - The output should directly help you decide whether to enter a call (up) trade, put (down) trade, or hold (neutral)
  confidence: number,        // Value from 0 to 1 indicating how strong the signal is
  string: ...              // A clear and brief explanation - output in Thai language - output format in bullet points

Be direct and actionable. Your output should help a trader decide whether to place a binary option trade right now.
The decision should be optimized for 15-minute expiration.

--------------------------------

smallTimeframeCandles with 15 minutes interval:

{smallTimeframeCandles}

--------------------------------

bigTimeframeCandles with 1 hour interval:

{bigTimeframeCandles}
--------------------------------

Signal direction: {signalDirection}
`;
}
