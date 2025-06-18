import {
  BinaryOptionsOption,
  ClientSdk,
  Position,
  InstrumentType,
} from "@quadcode-tech/client-sdk-js";
import { TradingState } from "../models/TradingState";
import { getGlobalEnvConfig } from "../models/environment/GlobalEnvConfig";
import { initializeClient } from "../utils/ClientUtils";
import { PositionMonitorLogger } from "./helpers/logging/PositionMonitorLogger";
import type { PositionMiddleware } from "./middlewares/positions/PositionMiddleware";

export class PositionMonitorService {
  private intervalTimeInSeconds = 30;
  private readonly GlobalEnvConfig = getGlobalEnvConfig();
  private interval: NodeJS.Timeout | null = null;
  private currentClientSdk: ClientSdk | null = null;
  private readonly positionMonitorLogger: PositionMonitorLogger;
  private readonly middlewares: PositionMiddleware[] = [];

  constructor(
    private readonly tradingState: TradingState,
    middlewares?: PositionMiddleware[]
  ) {
    this.positionMonitorLogger = new PositionMonitorLogger(tradingState);
    this.middlewares = middlewares || [];
  }

  async monitorPosition(order: BinaryOptionsOption): Promise<Position | null> {
    return new Promise((resolve, reject) => {
      this.interval = setInterval(async () => {
        try {
          // Cleanup previous client if it exists
          if (this.currentClientSdk) {
            this.currentClientSdk.shutdown();
            this.currentClientSdk = null;
          }

          // Initialize new client
          this.currentClientSdk = await initializeClient(this.GlobalEnvConfig);
          this.positionMonitorLogger.logConnectionSuccess(order);

          const positions = await this.currentClientSdk.positions();
          const positionOrder = positions
            .getAllPositions()
            .filter(
              (position) =>
                position.instrumentType === InstrumentType.BinaryOption &&
                position.externalId === order.id
            );

          if (!positionOrder || positionOrder.length === 0) {
            resolve(null);
          }
          positions.subscribeOnUpdatePosition(async (position) => {
            if (position.externalId === order.id) {
              // print here can be too much
              // this.positionMonitorLogger.logPositionUpdate(position);

              // Run all middlewares
              for (const middleware of this.middlewares) {
                try {
                  await middleware(position, resolve, reject);
                } catch (error) {
                  console.error("Middleware error:", error);
                }
              }

              // If position is closed, cleanup and resolve
              if (position.status?.toLowerCase().includes("close")) {
                this.positionMonitorLogger.logPositionUpdate(position);
                this.cleanup();
                resolve(position);
              }
            }
          });
        } catch (error) {
          console.error("Error in position monitoring:", error);
          this.cleanup(); // Cleanup on error
          // reject(error);
        }
      }, this.intervalTimeInSeconds * 1000);
    });
  }

  // Add cleanup method
  cleanup() {
    if (this.interval) {
      clearInterval(this.interval);
    }
    if (this.currentClientSdk) {
      this.currentClientSdk.shutdown();
      this.currentClientSdk = null;
    }
  }
}
