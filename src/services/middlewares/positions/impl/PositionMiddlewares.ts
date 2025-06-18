import { PositionMonitorLogger } from "../../../helpers/logging/PositionMonitorLogger";
import { TradingState } from "../../../../models/TradingState";
import type { PositionMiddleware } from "../PositionMiddleware";
import { getGlobalEnvConfig } from "../../../../models/environment/GlobalEnvConfig";
import type { Position } from "@quadcode-tech/client-sdk-js";

export class PositionMiddlewares {
  private readonly positionMonitorLogger: PositionMonitorLogger;
  private readonly globalConfig = getGlobalEnvConfig();

  constructor(private readonly tradingState: TradingState) {
    this.positionMonitorLogger = new PositionMonitorLogger(tradingState);
  }

  getSellWhenProfitAbovePercentageMiddleware(): PositionMiddleware {
    return async (position: Position, resolve, reject) => {
      if (
        position.pnl &&
        position.invest &&
        position.pnl >=
          position.invest *
            (this.globalConfig.SELL_WHEN_PROFIT_ABOVE_PERCENTAGE / 100)
      ) {
        await position.sell();
        this.positionMonitorLogger.logSellDecision(position);
        // resolve(position);
      }
    };
  }
}
