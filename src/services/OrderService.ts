import type {
  BinaryOptionsDirection,
  ClientSdk,
  Balance,
  BinaryOptionsOption,
} from "@quadcode-tech/client-sdk-js";
import { OrderLogger } from "./helpers/logging/OrderLogger";
import type { TradingState } from "../models/TradingState";
import { findInstrument } from "../utils/ClientUtils";

export class OrderService {
  private readonly orderLogger: OrderLogger;

  constructor(
    private readonly clientSdk: ClientSdk,
    private readonly balance: Balance,
    private readonly tradingState: TradingState
  ) {
    this.orderLogger = new OrderLogger(tradingState);
  }

  async placeOrder({
    instrumentId,
    direction,
    amount,
  }: {
    instrumentId: number;
    direction: BinaryOptionsDirection;
    amount: number;
  }): Promise<BinaryOptionsOption> {
    this.orderLogger.logOrderStart({
      instrumentId,
      direction,
      amount,
      balance: this.balance,
    });

    const binaryOptions = await this.clientSdk.binaryOptions();
    const instrument = await findInstrument(binaryOptions, instrumentId);
    if (!instrument) {
      this.orderLogger.logError("Instrument not found", { instrumentId });
      throw new Error("ไม่พบ instrument ที่เหมาะสม");
    }

    const callOption = await binaryOptions.buy(
      instrument,
      direction,
      amount,
      this.balance
    );

    this.orderLogger.logOrderComplete(callOption);
    return callOption;
  }
}
