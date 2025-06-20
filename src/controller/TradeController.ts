import type { ClientSdk } from "@quadcode-tech/client-sdk-js";
import { getGlobalEnvConfig } from "../models/environment/GlobalEnvConfig";
import { getTradeWorkerEnvConfig } from "../models/environment/TradeWorkerEnvConfig";
import { TradingState } from "../models/TradingState";
import { PositionMiddlewares } from "../services/middlewares/positions/impl/PositionMiddlewares";
import { OrderService } from "../services/OrderService";
import { createWorkerLogger } from "../utils/AppLogger";
import {
  getActiveByInstrumentName,
  getBalance,
  initializeClient,
} from "../utils/ClientUtils";
import { TradingControllerLog } from "./helper/TradingControllerLog";
import { PositionMonitorService } from "../services/PositionMonitorService";
import { convertSignalDirectionToBinaryOptionsDirection } from "../utils/SignalUtils";

export class TradeController {
  private readonly globalConfig = getGlobalEnvConfig();
  private readonly tradeConfig = getTradeWorkerEnvConfig();

  private readonly logger = createWorkerLogger({
    logFolderPath: process.env.LOG_FOLDER_PATH!,
    workerId: String(this.tradeConfig.INSTRUMENT),
  });

  private readonly tradingState = new TradingState();

  private readonly positionMiddlewares = new PositionMiddlewares(
    this.tradingState
  );

  private readonly tradingControllerLog = new TradingControllerLog(
    this.tradingState
  );

  async start() {
    let clientSdk: ClientSdk;
    try {
      clientSdk = await initializeClient(this.globalConfig);
      const balance = await getBalance(clientSdk, this.globalConfig.IS_REAL);
      const orderService = new OrderService(
        clientSdk,
        balance,
        this.tradingState
      );

      const active = await getActiveByInstrumentName(
        clientSdk,
        this.tradeConfig.INSTRUMENT as string
      );

      const order = await orderService.placeOrder({
        instrumentId: active.id,
        direction: convertSignalDirectionToBinaryOptionsDirection(
          this.tradeConfig.SIGNAL_DIRECTION
        ),
        amount: this.tradeConfig.BUY_AMOUNT,
      });

      const positionMonitorService = new PositionMonitorService(
        this.tradingState,
        [this.positionMiddlewares.getSellWhenProfitAbovePercentageMiddleware()]
      );

      const position = await positionMonitorService.monitorPosition(order);
      if (position) {
        this.tradingState.addResultOfPosition(position);
        this.tradingControllerLog.logTradingPositionClosed(position);
      }
    } catch (error) {
      this.logger.error("Error in trading service:", { error });
      // @ts-ignore
      if (clientSdk) {
        clientSdk?.shutdown();
      }
      throw error;
    }
  }
}
