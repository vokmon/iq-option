import {
  ClientSdk,
  BinaryOptionsDirection,
  Balance,
} from "@quadcode-tech/client-sdk-js";
import { TradingConfig } from "../models/TradingConfig";
import { PositionMonitor } from "./PositionMonitor";

export class OrderManager {
  private lastOrderExpiry: Date | null = null;
  private isPlacingOrder = false;
  private readonly positionMonitor: PositionMonitor;
  private completedCycles: number = 0;

  constructor(
    private readonly clientSdk: ClientSdk,
    private readonly balance: Balance,
    private readonly config: TradingConfig
  ) {
    this.positionMonitor = new PositionMonitor(clientSdk, config);
  }

  async handleSignal(direction: BinaryOptionsDirection): Promise<void> {
    if (this.isPlacingOrder) {
      // console.log("⏳ กำลังรอ order ก่อนหน้าเสร็จสิ้น...");
      return;
    }

    if (this.lastOrderExpiry && new Date() < this.lastOrderExpiry) {
      // console.log("⏳ ยังมี order ที่ยังไม่หมดอายุ");
      return;
    }

    this.isPlacingOrder = true;
    try {
      await this.placeOrder(direction);
    } finally {
      this.isPlacingOrder = false;
    }
  }

  private async placeOrder(direction: BinaryOptionsDirection): Promise<void> {
    try {
      console.log("🔄 เริ่มกระบวนการวาง order...");

      const binaryOptions = await this.clientSdk.binaryOptions();
      const amount = this.config.buyAmount;

      console.log(
        `💰 วาง order: ${
          direction === BinaryOptionsDirection.Call ? "📈 Call" : "📉 Put"
        } | จำนวน: ${amount}`
      );

      const instrument = await this.findInstrument(binaryOptions);
      if (!instrument) {
        throw new Error("ไม่พบ instrument ที่เหมาะสม");
      }

      console.log("🔄 กำลังส่งคำสั่งซื้อ...");
      const callOption = await binaryOptions.buy(
        instrument,
        direction,
        amount,
        this.balance
      );

      this.lastOrderExpiry = new Date(callOption.expiredAt);
      console.log(
        `✅ Order สำเร็จ: ${
          direction === BinaryOptionsDirection.Call ? "📈 Call" : "📉 Put"
        } | จำนวน: ${amount} | หมดอายุ: ${this.lastOrderExpiry.toLocaleTimeString()}`
      );

      await this.positionMonitor.monitorPosition(
        callOption.id,
        (pnl: number) => {
          this.handlePositionClosed(pnl);
          this.lastOrderExpiry = null;
          this.completedCycles++;

          if (this.completedCycles >= this.config.maxTradeCycles) {
            console.log("\n--------------------------------");
            console.log(
              `🛑 ถึงจำนวนรอบการเทรดสูงสุดแล้ว (${this.config.maxTradeCycles} รอบ)`
            );
            console.log("--------------------------------");
            process.exit(0);
          }
        },
        this.lastOrderExpiry
      );
    } catch (error) {
      console.error("❌ เกิดข้อผิดพลาดในการวาง order:", error);
      throw error;
    }
  }

  private async findInstrument(binaryOptions: any): Promise<any> {
    console.log("🔍 กำลังค้นหา active instrument...");
    const actives = binaryOptions
      .getActives()
      .filter((active: any) => active.canBeBoughtAt(new Date()));

    const active = actives.find(
      (active: any) => active.id === this.config.instrumentId
    );
    if (!active) {
      throw new Error(
        `ไม่พบ active instrument ID: ${this.config.instrumentId}`
      );
    }
    console.log(`✅ พบ active instrument: ${active.ticker}`);

    console.log("🔍 กำลังค้นหา available instruments...");
    const instruments = await active.instruments();
    if (!instruments) {
      throw new Error("ไม่พบ instruments");
    }

    const availableInstruments = instruments.getAvailableForBuyAt(new Date());
    if (!availableInstruments || availableInstruments.length === 0) {
      throw new Error("ไม่พบ available instruments");
    }
    console.log(
      `✅ พบ available instruments: ${availableInstruments.length} รายการ`
    );

    return availableInstruments[0];
  }

  private handlePositionClosed(pnl: number): void {
    if (pnl > 0) {
      console.log(`✅ ชนะ! กำไร: ${pnl}`);
    } else {
      console.log(`❌ แพ้! ขาดทุน: ${pnl}`);
    }
  }
}
