import { ClientSdk, Balance } from "@quadcode-tech/client-sdk-js";
import { TradingConfig } from "../models/TradingConfig";
import { OrderManager } from "./OrderManager";
import { PositionMonitor } from "./PositionMonitor";
import { SignalGenerator } from "./SignalGenerator";

export class TradingService {
  private readonly orderManager: OrderManager;
  private readonly positionMonitor: PositionMonitor;
  private readonly signalGenerator: SignalGenerator;

  constructor(
    private readonly clientSdk: ClientSdk,
    private readonly balance: Balance,
    private readonly config: TradingConfig
  ) {
    this.orderManager = new OrderManager(clientSdk, balance, config);
    this.positionMonitor = new PositionMonitor(clientSdk, config);
    this.signalGenerator = new SignalGenerator(config);
  }

  async start(): Promise<void> {
    console.log("🟢 เชื่อมต่อสำเร็จ!");
    console.log(`📊 เริ่มเทรด INSTRUMENT_ID: ${this.config.instrumentId}`);
    console.log(`💰 BUY_AMOUNT: ${this.config.buyAmount}`);
    console.log(`🔄 จำนวนรอบการเทรดสูงสุด: ${this.config.maxTradeCycles}`);

    const quotes = await this.clientSdk.quotes();
    const currentQuote = await quotes.getCurrentQuoteForActive(
      this.config.instrumentId
    );

    currentQuote.subscribeOnUpdate(async (updatedCurrentQuote) => {
      try {
        await this.handleQuoteUpdate(updatedCurrentQuote);
      } catch (error) {
        console.error("❌ เกิดข้อผิดพลาดในการประมวลผลข้อมูล:", error);
      }
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
