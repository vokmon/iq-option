import {
  ClientSdk,
  BalanceType,
  LoginPasswordAuthMethod,
  InstrumentType,
} from "@quadcode-tech/client-sdk-js";

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
const candlesData = await candles.getCandles(1858, 5, {
  from:
    Math.floor(
      Date.UTC(
        new Date().getUTCFullYear(),
        new Date().getUTCMonth(),
        new Date().getUTCDate(),
        new Date().getUTCHours(),
        new Date().getUTCMinutes(),
        new Date().getUTCSeconds()
      ) / 1000
    ) -
    60 * 15,
  to: Math.floor(
    Date.UTC(
      new Date().getUTCFullYear(),
      new Date().getUTCMonth(),
      new Date().getUTCDate(),
      new Date().getUTCHours(),
      new Date().getUTCMinutes(),
      new Date().getUTCSeconds()
    ) / 1000
  ),
});
console.log(candlesData);

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

// positions.unsubscribeOnUpdatePosition(() => {});

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
