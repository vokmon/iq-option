import { createWorkerLogger } from "../utils/AppLogger";
import { TradingControllerLog } from "./helper/TradingControllerLog";
import { getGlobalEnvConfig } from "../models/environment/GlobalEnvConfig";
import { getTradeWorkerEnvConfig } from "../models/environment/TradeWorkerEnvConfig";
import { TradingState } from "../models/TradingState";
import { PositionMiddlewares } from "../services/middlewares/positions/impl/PositionMiddlewares";
import type { ClientSdk } from "@quadcode-tech/client-sdk-js";
import {
  getActiveByInstrumentId,
  getActiveByInstrumentName,
  getBalance,
  initializeClient,
} from "../utils/ClientUtils";
import { OrderService } from "../services/OrderService";
import { PositionMonitorService } from "../services/PositionMonitorService";
import { SignalAiCandleAnalysisService } from "../services/SignalAiCandleAnalysisService";
import { convertSignalDirectionToBinaryOptionsDirection } from "../utils/SignalUtils";

export class SignalAiTradeController {
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
    clientSdk = await initializeClient(this.globalConfig);
    const balance = await getBalance(clientSdk, this.globalConfig.IS_REAL);
    const orderService = new OrderService(
      clientSdk,
      balance,
      this.tradingState
    );
    const positionMonitorService = new PositionMonitorService(
      this.tradingState,
      [this.positionMiddlewares.getSellWhenProfitAbovePercentageMiddleware()]
    );
    const active =
      typeof this.tradeConfig.INSTRUMENT === "string"
        ? await getActiveByInstrumentName(
            clientSdk,
            this.tradeConfig.INSTRUMENT
          )
        : await getActiveByInstrumentId(
            clientSdk,
            this.tradeConfig.INSTRUMENT as number
          );
    this.tradingControllerLog.logTradingConfiguration(active);

    try {
      const candleAnalysisService = new SignalAiCandleAnalysisService(
        clientSdk,
        active,
        this.tradingState
      );

      const binaryOptionsDirection =
        convertSignalDirectionToBinaryOptionsDirection(
          this.tradeConfig.SIGNAL_DIRECTION
        );
      const analysis = await candleAnalysisService.analyzeCandles({
        instrumentId: active.id,
        date: new Date(),
        signalDirection: binaryOptionsDirection,
      });
      const order = await orderService.placeOrder({
        instrumentId: active.id,
        direction: analysis.direction!,
        amount: this.tradeConfig.BUY_AMOUNT,
      });
      const position = await positionMonitorService.monitorPosition(order);
      if (position) {
        this.tradingState.addResultOfPosition(position);
        this.tradingControllerLog.logTradingPositionClosed(position);
      }
    } catch (error) {
      this.logger.error("Error in trading service:", { error });
    } finally {
      clientSdk.shutdown();
    }
  }
}
