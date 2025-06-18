import { getGlobalEnvConfig } from "../models/environment/GlobalEnvConfig";
import { getTradeWorkerEnvConfig } from "../models/environment/TradeWorkerEnvConfig";
import { createWorkerLogger } from "../utils/AppLogger";
import {
  initializeClient,
  getActiveByInstrumentId,
  getBalance,
  getActiveByInstrumentName,
} from "../utils/ClientUtils";
import type {
  BinaryOptionsActive,
  ClientSdk,
} from "@quadcode-tech/client-sdk-js";
import { CandleAnalysisService } from "../services/CandleAnalysisService";
import { TradingState } from "../models/TradingState";
import { OrderService } from "../services/OrderService";
import { PositionMonitorService } from "../services/PositionMonitorService";
import { PositionMiddlewares } from "../services/middlewares/positions/impl/PositionMiddlewares";
import { TradingControllerLog } from "./helper/TradingControllerLog";

export class AutoTradingByInstrumentController {
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

      this.logTradingConfiguration(active);

      while (true) {
        try {
          const candleAnalysisService = new CandleAnalysisService(
            clientSdk,
            active,
            this.tradingState
          );

          const analysis = await candleAnalysisService.analyzeCandles({
            instrumentId: active.id,
            date: new Date(),
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
          this.tradingState.incrementCurrentTradeNumber();
          if (
            this.tradingState.getCurrentTradeNumber() >
            this.tradeConfig.MAX_TRADE_CYCLES
          ) {
            clientSdk.shutdown();
            break;
          }
        }
      }

      this.tradingControllerLog.printTradingSummary(this.tradingState);
    } catch (error) {
      this.logger.error("Error in trading service:", { error });
      // @ts-ignore
      if (clientSdk) {
        clientSdk?.shutdown();
      }
      throw error;
    }
  }

  private logTradingConfiguration(active: BinaryOptionsActive): void {
    const configInfo = `
▶️ ========================= เริ่มต้นการเทรด ${active.ticker} ========================= ▶️
🟢 เชื่อมต่อสำเร็จ!
⚙️ พารามิเตอร์การเทรด:
   • รหัสสินทรัพย์:              ${active.id}
   • ชื่อสินทรัพย์:               ${active.ticker}
   • จำนวนเงินที่ซื้อ:            ${this.tradeConfig.BUY_AMOUNT}
   • จำนวนรอบสูงสุด (รอบ):     ${this.tradeConfig.MAX_TRADE_CYCLES}
-------------------------------------------------------------------------\n\n
`;
    this.logger.info(configInfo);
  }
}
