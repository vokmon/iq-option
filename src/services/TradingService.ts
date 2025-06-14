import { ClientSdk, Balance } from "@quadcode-tech/client-sdk-js";
import { TradingConfig } from "../models/TradingConfig";
import { OrderManager } from "./OrderManager";
import { SignalGenerator } from "./SignalGenerator";
import { TradingState } from "../models/TradingState";

export class TradingService {
  private readonly orderManager: OrderManager;
  private readonly signalGenerator: SignalGenerator;

  constructor(
    private readonly clientSdk: ClientSdk,
    balance: Balance,
    private readonly config: TradingConfig,
    private readonly tradingState: TradingState
  ) {
    this.orderManager = new OrderManager(
      clientSdk,
      balance,
      config,
      this.tradingState
    );
    this.signalGenerator = new SignalGenerator(config, this.tradingState);
  }

  async start(): Promise<void> {
    console.log("🟢 เชื่อมต่อสำเร็จ!");
    console.log(
      `📊 เริ่มเทรด หมายเลขสินทรัพย์(Instrument ID - ${this.config.instrument.id}): ${this.config.instrument.ticker}`
    );
    console.log(`💰 จำนวนเงินที่จะซื้อ: ${this.config.buyAmount}`);
    console.log(`🔄 จำนวนรอบการเทรดสูงสุด: ${this.config.maxTradeCycles}`);

    const quotes = await this.clientSdk.quotes();
    const currentQuote = await quotes.getCurrentQuoteForActive(
      this.config.instrument.id
    );
    console.log("\n=========================================================");
    console.log("🔄 เริ่มติดตามราคา");

    return new Promise((_resolve, reject) => {
      currentQuote.subscribeOnUpdate(async (updatedCurrentQuote) => {
        try {
          await this.handleQuoteUpdate(updatedCurrentQuote);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  private async handleQuoteUpdate(updatedCurrentQuote: any): Promise<void> {
    const price = updatedCurrentQuote.ask;
    if (!price) return;

    const signal = await this.signalGenerator.processPrice(price);
    if (signal) {
      await this.orderManager.handleSignal(signal);
    }
  }
}
