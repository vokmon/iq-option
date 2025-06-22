import {
  ClientSdk,
  BalanceType,
  LoginPasswordAuthMethod,
  Balance,
  BinaryOptionsActive,
  Candle,
  BinaryOptions,
  BinaryOptionsActiveInstrument,
} from "@quadcode-tech/client-sdk-js";
import type { GlobalEnvConfig } from "../models/environment/GlobalEnvConfig";

export async function initializeClient(
  config: GlobalEnvConfig
): Promise<ClientSdk> {
  return await ClientSdk.create(
    config.API_URL,
    parseInt(config.ACCESS_TOKEN),
    new LoginPasswordAuthMethod(
      config.LOGIN_URL,
      config.LOGIN_EMAIL,
      config.LOGIN_PASSWORD
    )
  );
}

export async function getBalance(
  clientSdk: ClientSdk,
  isReal: boolean
): Promise<Balance> {
  const balances = await clientSdk.balances();
  const balance = balances
    .getBalances()
    .find((balance) =>
      isReal
        ? balance.type === BalanceType.Real
        : balance.type === BalanceType.Demo
    );

  if (!balance) {
    throw new Error(`ไม่พบ ${isReal ? "real" : "demo"} balance`);
  }

  return balance;
}

export async function getActiveByInstrumentId(
  clientSdk: ClientSdk,
  instrumentId: number
): Promise<BinaryOptionsActive> {
  const binaryOptions = await clientSdk.binaryOptions();
  const actives = binaryOptions.getActives();
  const active = actives.find(
    (active: BinaryOptionsActive) => active.id === instrumentId
  );
  if (!active) {
    throw new Error(`ไม่พบสินทรัพย์ที่ต้องการ: ${instrumentId}`);
  }
  return active;
}

export async function getActiveByInstrumentName(
  clientSdk: ClientSdk,
  instrumentName: string
): Promise<BinaryOptionsActive> {
  const binaryOptions = await clientSdk.binaryOptions();
  const actives = binaryOptions
    .getActives()
    .filter((active) => active.canBeBoughtAt(new Date()));
  const active = actives.find(
    (active: BinaryOptionsActive) => active.ticker === instrumentName
  );
  if (!active) {
    throw new Error(`ไม่พบสินทรัพย์ที่ต้องการ: ${instrumentName}`);
  }
  return active;
}

export async function getCandles({
  clientSdk,
  instrumentId,
  date,
  analysisMinutes,
  candleIntervalSeconds,
}: {
  clientSdk: ClientSdk;
  instrumentId: number;
  date: Date;
  analysisMinutes: number;
  candleIntervalSeconds: number;
}): Promise<Candle[]> {
  const toUtc = Math.floor(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      new Date().getUTCSeconds()
    ) / 1000
  );

  const fromUtc = toUtc - analysisMinutes * 60;

  const candles = await clientSdk.candles();
  const candlesData = await candles.getCandles(
    instrumentId,
    candleIntervalSeconds,
    {
      from: fromUtc,
      to: toUtc,
    }
  );
  return candlesData;
}

export const findInstrument = async (
  binaryOptions: BinaryOptions,
  instrumentId: number
): Promise<BinaryOptionsActiveInstrument> => {
  const actives = binaryOptions
    .getActives()
    .filter((active: BinaryOptionsActive) => active.canBeBoughtAt(new Date()));

  const active = actives.find(
    (active: BinaryOptionsActive) => active.id === instrumentId
  );
  if (!active) {
    throw new Error(`ไม่พบ active instrument ID: ${instrumentId}`);
  }

  const instruments = await active.instruments();
  if (!instruments) {
    throw new Error("ไม่พบ instruments");
  }

  const availableInstruments = instruments.getAvailableForBuyAt(new Date());
  if (!availableInstruments || availableInstruments.length === 0) {
    throw new Error("ไม่พบ available instruments");
  }

  const instrument = availableInstruments[0];
  if (!instrument) {
    throw new Error("ไม่พบ instrument");
  }

  return instrument;
};
