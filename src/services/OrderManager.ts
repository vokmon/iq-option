import {
  ClientSdk,
  BinaryOptionsDirection,
  Balance,
  Position,
} from "@quadcode-tech/client-sdk-js";
import { TradingConfig } from "../models/TradingConfig";
import { PositionMonitor } from "./PositionMonitor";
import { MaxCyclesReachedError } from "../errors/MaxCyclesReachedError";
import { TradingState } from "../models/TradingState";

export class OrderManager {
  private lastOrderExpiry: Date | null = null;
  private isPlacingOrder = false;
  private readonly positionMonitor: PositionMonitor;

  constructor(
    private readonly clientSdk: ClientSdk,
    private readonly balance: Balance,
    private readonly config: TradingConfig,
    private readonly tradingState: TradingState
  ) {
    this.positionMonitor = new PositionMonitor(clientSdk, config, tradingState);
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
    this.tradingState.setHasActiveOrder(true);
    try {
      await this.placeOrder(direction);
    } finally {
      this.isPlacingOrder = false;
    }
  }

  private async placeOrder(direction: BinaryOptionsDirection): Promise<void> {
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

    console.log(
      "\n\n========================================================="
    );
    console.log(
      `🔄 กำลังส่งคำสั่งซื้อสำหรับรอบที่ ${this.tradingState.getCurrentCycle()}...`
    );
    const callOption = await binaryOptions.buy(
      instrument,
      direction,
      amount,
      this.balance
    );

    this.lastOrderExpiry = new Date(callOption.expiredAt);
    console.log(
      `✅ Order รอบที่ ${this.tradingState.getCurrentCycle()} สำเร็จ: ${
        direction === BinaryOptionsDirection.Call ? "📈 Call" : "📉 Put"
      } | จำนวน: ${amount} | หมดอายุ: ${this.lastOrderExpiry.toLocaleString()}`
    );

    try {
      await this.positionMonitor.monitorPosition(
        callOption.id,
        (position) => {
          this.handlePositionClosed(position);
          this.lastOrderExpiry = null;
          this.tradingState.setHasActiveOrder(false);
          if (
            this.tradingState.getCurrentCycle() >= this.config.maxTradeCycles
          ) {
            throw new MaxCyclesReachedError(this.config.maxTradeCycles);
          }
          this.tradingState.incrementCurrentCycle();
        },
        this.lastOrderExpiry
      );
    } catch (error) {
      if (error instanceof MaxCyclesReachedError) {
        throw error; // Re-throw MaxCyclesReachedError to be handled by TradingService
      }
      console.error("❌ เกิดข้อผิดพลาดในการติดตาม position:", error);
      throw error;
    }
  }

  private async findInstrument(binaryOptions: any): Promise<any> {
    console.log("🔍 กำลังค้นหา active instrument...");
    const actives = binaryOptions
      .getActives()
      .filter((active: any) => active.canBeBoughtAt(new Date()));

    const active = actives.find(
      (active: any) => active.id === this.config.instrument.id
    );
    if (!active) {
      throw new Error(
        `ไม่พบ active instrument ID: ${this.config.instrument.id}`
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

  private handlePositionClosed(position: Position): void {
    const pnl = position.pnl || 0;
    this.tradingState.addResultOfPosition(position);
    console.log(
      `\n🏁 ================== Position Closed สำหรับการซื้อรอบที่ ${this.tradingState.getCurrentCycle()} ================== 🏁`
    );
    console.log(`⏰ เวลา: ${new Date().toLocaleString()}`);

    // Position Summary
    console.log("\n📊 สรุปการซื้อ:");
    console.log(`   • รหัสคำสั่งซื้อ:        ${position.externalId}`);
    console.log(`   • ชื่อสินทรัพย์:         ${position.active?.name}`);
    console.log(`   • Direction:        ${position.direction?.toUpperCase()}`);
    console.log(`   • Status:            ${position.status}`);

    // Investment Details
    console.log("\n💰 รายละเอียดการซื้อ:");
    console.log(`   • จำนวนเงินที่ซื้อ:      ${position.invest}`);
    console.log(`   • ราคาเปิด:          ${position.openQuote}`);
    console.log(`   • ราคาเลิกซื้อ:        ${position.closeQuote}`);

    // Result
    console.log("\n📈 ผลลัพธ์:");
    console.log(`   • PNL:              ${pnl}`);
    console.log(`   • Net PNL:          ${position.pnlNet}`);
    console.log(`   • ผลการซื้อ:          ${pnl > 0 ? "✅ WIN" : "❌ LOSS"}`);
    console.log(`   • กำไร/ขาดทุน:       ${pnl > 0 ? "+" : ""}${pnl}`);

    // Trading Progress
    console.log("\n🔄 Trading Progress:");
    console.log(
      `   • Current Cycle:    ${this.tradingState.getCurrentCycle()}`
    );
    console.log(`   • Max Cycles:       ${this.config.maxTradeCycles}`);

    console.log("=========================================================\n");
  }
}
