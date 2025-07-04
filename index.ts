import {
  ClientSdk,
  BalanceType,
  LoginPasswordAuthMethod,
  InstrumentType,
  type CallbackForCurrentQuoteUpdate,
  CurrentQuote,
} from "@quadcode-tech/client-sdk-js";
import { getCandles } from "./src/utils/ClientUtils";

const sdk = await ClientSdk.create(
  "wss://iqoption.com/echo/websocket",
  82,
  new LoginPasswordAuthMethod(
    "https://api.iqoption.com",
    "sukaya.suk275@gmail.com",
    "suk@1234"
  )
);

// Simple keep-alive mechanism
setInterval(async () => {}, 1500); // Check every 15 seconds

const balances = await sdk.balances();

const balance = balances
  .getBalances()
  .find((balance) => balance.type === BalanceType.Demo);

const binaryOptions = await sdk.binaryOptions();

const actives = binaryOptions
  .getActives()
  .filter((active) => active.canBeBoughtAt(new Date()));

const tickers = actives.map((active) => ({
  ticker: active.ticker,
  id: active.id,
}));
tickers.forEach((ticker) => {
  console.log(`${ticker.ticker} - ${ticker.id}`);
});

const candles = await sdk.candles();

const toDate = new Date();
const fromDate = new Date(toDate.getTime());

const lookbackPeriod = 1;
const intervalMinutes = 15;

const lookback = lookbackPeriod * intervalMinutes;

fromDate.setHours(fromDate.getHours() - lookback / 60);

console.log(fromDate);
const candlesData = await candles.getCandles(1858, intervalMinutes * 60, {
  from: Math.floor(
    Date.UTC(
      fromDate.getUTCFullYear(),
      fromDate.getUTCMonth(),
      fromDate.getUTCDate(),
      fromDate.getUTCHours(),
      fromDate.getUTCMinutes(),
      fromDate.getUTCSeconds()
    ) / 1000
  ),
  to: Math.floor(
    Date.UTC(
      toDate.getUTCFullYear(),
      toDate.getUTCMonth(),
      toDate.getUTCDate(),
      toDate.getUTCHours(),
      toDate.getUTCMinutes(),
      toDate.getUTCSeconds()
    ) / 1000
  ),
});
console.log(candlesData);

// const quotes = await sdk.quotes();

// const print = (quote: CurrentQuote) => {
//   console.log(quote);
//   // currentQuote.unsubscribeOnUpdate(print);
// };
// const currentQuote = await quotes.getCurrentQuoteForActive(81);
// currentQuote.subscribeOnUpdate(print);

// Buy
// const firstActive = actives.find((active) => active.ticker === "EURUSD");

// const firstActiveInstruments = await firstActive?.instruments();

// const firstActiveAvailableInstruments =
//   firstActiveInstruments?.getAvailableForBuyAt(new Date());

// console.log(firstActiveAvailableInstruments);
// const firstInstrument = firstActiveAvailableInstruments?.[0];
// const purchaseEndTime = firstInstrument?.purchaseEndTime();

// const callOption = await binaryOptions.buy(
//   firstInstrument!,
//   BinaryOptionsDirection.Call,
//   1,
//   balance!
// );
// console.log(callOption);

// const putOption = await binaryOptions.buy(
//   firstInstrument!,
//   BinaryOptionsDirection.Put,
//   1,
//   balance!
// );
// console.log(putOption);

// const positions = await sdk.positions();

// console.log(
//   positions
//     .getAllPositions()
//     .filter(
//       (position) => position.instrumentType === InstrumentType.BinaryOption
//     )
// );

// // positions.unsubscribeOnUpdatePosition(() => {});

// positions.subscribeOnUpdatePosition((position) => {
//   if (position.instrumentType === InstrumentType.BinaryOption) {
//     console.log(
//       `
//       ----------
//       ActiveId: ${position.activeId}
//       orderId: ${position.orderIds.map((id) => id.toString()).join(", ")}
//       Invest: ${position.invest}
//       Sell Profit: ${position.sellProfit},
//       Pnl: ${position.pnl}
//       Sell PnL Net: ${position.pnlNet}
//       expectedProfit: ${position.expectedProfit}
//       Status: ${position.status}
//       Direction: ${position.direction}
//       openQuote: ${position.openQuote}
//       closeQuote: ${position.closeQuote}
//       openTime: ${position.openTime}
//       closeTime: ${position.closeTime}
//       openTime: ${position.openTime}
//       active: ${JSON.stringify(position.active)}
//       closeProfit: ${position.closeProfit}
//       expirationTime: ${position.expirationTime}
//       ----------
//       `
//     );
//     console.log("\n\n");
//     if (
//       position.sellProfit &&
//       position.invest &&
//       position.pnl &&
//       position.pnl > position.invest + position.invest * 0.05
//     ) {
//       // position.sell();

//       console.log("Sold");
//     }
//     // position.sell();
//   }
// });
