import type { Candle } from "@quadcode-tech/client-sdk-js";
import type { Indicator, IndicatorResult } from "./Indicator";
import { getChatGoogleGenerativeAI } from "../../utils/AiModel";
import {
  BaseOutputParser,
  JsonOutputParser,
  StringOutputParser,
} from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";

export class AiIndicator {
  public async calculate(
    smallTimeframeCandles: Candle[],
    bigTimeframeCandles: Candle[]
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
      bigTimeframeCandles: JSON.stringify(bigTimeframeCandles).replace(
        /"/g,
        ""
      ),
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
You are a professional binary options analyst. Analyze the following candlestick data to determine if a trade should be placed now.

Inputs:

smallTimeframeCandles: Candlesticks from a short timeframe (e.g., 1-minute or 5-minute).

bigTimeframeCandles: Candlesticks from a higher timeframe (e.g., 1-hour or 4-hour).

Your task:

Analyze price action patterns across both timeframes.

Consider trend direction, momentum, reversals, and candlestick signals.

Determine if the data supports entering a call (up) or put (down) trade — or if its best to wait (neutral).

Output format (JSON):

json

  signal: up | down | neutral,  // Direction for the binary option trade - The output should directly help you decide whether to enter a call (up) trade, put (down) trade, or hold (neutral)
  confidence: number,        // Value from 0 to 1 indicating how strong the signal is
  string: ...              // A clear and brief explanation - output in Thai language

Be direct and actionable. Your output should help a trader decide whether to place a binary option trade right now.

--------------------------------

smallTimeframeCandles:

{smallTimeframeCandles}

--------------------------------

bigTimeframeCandles:

{bigTimeframeCandles}
--------------------------------

`;
}
