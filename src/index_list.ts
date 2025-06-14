import {
  ClientSdk,
  LoginPasswordAuthMethod,
} from "@quadcode-tech/client-sdk-js";

// Load environment variables
const env = process.env;

const requiredEnvVars = [
  "API_URL",
  "ACCESS_TOKEN",
  "LOGIN_URL",
  "LOGIN_EMAIL",
  "LOGIN_PASSWORD",
] as const;

const clientSdk = await ClientSdk.create(
  env.API_URL!,
  parseInt(env.ACCESS_TOKEN!),
  new LoginPasswordAuthMethod(
    env.LOGIN_URL!,
    env.LOGIN_EMAIL!,
    env.LOGIN_PASSWORD!
  )
);

const binaryOptions = await clientSdk.binaryOptions();

const actives = binaryOptions
  .getActives()
  .filter((active) => active.canBeBoughtAt(new Date()));

const tickers = actives.map((active) => ({
  ticker: active.ticker,
  id: active.id,
}));

tickers.sort((a, b) => a.ticker.localeCompare(b.ticker));
tickers.forEach((ticker) => {
  console.log(`${ticker.ticker} - ${ticker.id}`);
});

process.exit(0);
