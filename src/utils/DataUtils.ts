import { Candle } from "@quadcode-tech/client-sdk-js";

export const transformCandles = (candles: Candle[]) => {
  return candles.map((candle) => {
    const { volume, ...rest } = candle;
    return rest;
  });
};
