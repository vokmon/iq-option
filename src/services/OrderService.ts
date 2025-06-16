import type {
  BinaryOptionsDirection,
  ClientSdk,
  Balance,
  BinaryOptions,
  BinaryOptionsActive,
  BinaryOptionsOption,
  BinaryOptionsActiveInstrument,
} from "@quadcode-tech/client-sdk-js";
import { OrderLogger } from "./helpers/logging/OrderLogger";
import type { TradingState } from "../models/TradingState";

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
    const instrument = await this.findInstrument(binaryOptions, instrumentId);
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

  private async findInstrument(
    binaryOptions: BinaryOptions,
    instrumentId: number
  ): Promise<BinaryOptionsActiveInstrument> {
    const actives = binaryOptions
      .getActives()
      .filter((active: BinaryOptionsActive) =>
        active.canBeBoughtAt(new Date())
      );

    const active = actives.find(
      (active: BinaryOptionsActive) => active.id === instrumentId
    );
    if (!active) {
      this.orderLogger.logError("Active instrument not found", {
        instrumentId,
      });
      throw new Error(`ไม่พบ active instrument ID: ${instrumentId}`);
    }

    const instruments = await active.instruments();
    if (!instruments) {
      this.orderLogger.logError("No instruments available", {
        activeId: active.id,
      });
      throw new Error("ไม่พบ instruments");
    }

    const availableInstruments = instruments.getAvailableForBuyAt(new Date());
    if (!availableInstruments || availableInstruments.length === 0) {
      this.orderLogger.logError("No available instruments for buying", {
        activeId: active.id,
      });
      throw new Error("ไม่พบ available instruments");
    }

    const instrument = availableInstruments[0];
    if (!instrument) {
      this.orderLogger.logError("No instrument found", { activeId: active.id });
      throw new Error("ไม่พบ instrument");
    }

    return instrument;
  }
}
