import { BinaryOptionsDirection } from "@quadcode-tech/client-sdk-js";
import { type TradeWorkerEnvConfig } from "../models/environment/TradeWorkerEnvConfig";

export const convertSignalDirectionToBinaryOptionsDirection = (
  signalDirection: TradeWorkerEnvConfig["SIGNAL_DIRECTION"]
): BinaryOptionsDirection => {
  const normalizedDirection = signalDirection.toLowerCase();

  switch (normalizedDirection) {
    case "buy":
      return BinaryOptionsDirection.Call;
    case "sell":
      return BinaryOptionsDirection.Put;
    default:
      throw new Error(`Invalid signal direction: ${signalDirection}`);
  }
};
