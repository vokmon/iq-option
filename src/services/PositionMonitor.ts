import { ClientSdk, Position } from "@quadcode-tech/client-sdk-js";
import { TradingConfig } from "../models/TradingConfig";
import { TradingState } from "../models/TradingState";

export class PositionMonitor {
  constructor(
    private readonly clientSdk: ClientSdk,
    private readonly config: TradingConfig,
    private readonly tradingState: TradingState
  ) {}

  async monitorPosition(
    orderId: number,
    onPositionClosed: (position: Position) => void,
    expiryDate: Date
  ): Promise<void> {
    try {
      this.logStartMonitoring(orderId);
      let isMonitoring = true;

      const positions = await this.clientSdk.positions();
      return new Promise((resolve, reject) => {
        positions.subscribeOnUpdatePosition(async (position) => {
          if (!isMonitoring) return;

          if (position.externalId === orderId) {
            this.logPositionUpdate(position, expiryDate);

            if (this.shouldSellPosition(position)) {
              this.logSellDecision(position);
              await position.sell();
              try {
                onPositionClosed(position);
              } catch (error) {
                reject(error);
                return;
              }
              this.logPositionSold(orderId, position.pnl || 0);
              positions.unsubscribeOnUpdatePosition(() => {});
            }
            if (position.status === "closed") {
              try {
                onPositionClosed(position);
              } catch (error) {
                reject(error);
                return;
              }
              isMonitoring = false;
              positions.unsubscribeOnUpdatePosition(() => {});
              resolve();
            }
          }
        });
      });
    } catch (error) {
      console.error("❌ เกิดข้อผิดพลาดในการติดตาม position:", error);
      throw error;
    }
  }

  private logStartMonitoring(orderId: number): void {
    console.log(
      `\n🔍 ================== Position Monitoring Started สำหรับการซื้อรอบที่ ${this.tradingState.getCurrentCycle()} ================== 🔍`
    );
    console.log(`📌 Order ID: ${orderId}`);
    console.log("=========================================================\n");
  }

  private logPositionUpdate(position: Position, expiryDate: Date): void {
    console.log(
      `\n📊 ================== Position Update สำหรับการซื้อรอบที่ ${this.tradingState.getCurrentCycle()} ================== 📊`
    );
    console.log(`⏰ เวลา: ${new Date().toLocaleString()}`);

    // Investment Details
    console.log("\n💰 รายละเอียดการซื้อ:");
    console.log(`   • รหัสคำสั่งซื้อ:        ${position.externalId}`);
    console.log(`   • ชื่อสินทรัพย์:         ${position.active?.name}`);
    console.log(`   • จำนวนเงินที่ซื้อ:      ${position.invest}`);
    console.log(`   • ราคาเปิด:          ${position.openQuote}`);
    console.log(
      `   • Min Profit:       ${this.config.minProfitThreshold * 100}%`
    );

    // Profit/Loss Information
    console.log("\n📈 ผลการซื้อ:");
    console.log(`   • PNL:              ${position.pnl}`);
    console.log(`   • Net PNL:          ${position.pnlNet}`);
    console.log(`   • Sell Profit:      ${position.sellProfit}`);

    // Position Status
    console.log("\n⚡ Position Status:");
    console.log(`   • Direction:        ${position.direction?.toUpperCase()}`);
    console.log(`   • Status:           ${position.status}`);
    console.log(`   • Expiry:           ${expiryDate.toLocaleString()}`);

    console.log("=========================================================\n");
  }

  private logPositionSold(orderId: number, pnl: number): void {
    console.log(
      `\n🟢 ================== Position Sold สำหรับการซื้อรอบที่ ${this.tradingState.getCurrentCycle()} ================== 🟢`
    );
    console.log(`📌 รหัสคำสั่งซื้อ: ${orderId}`);
    console.log(`💰 กำไร/ขาดทุน: ${pnl}`);
    console.log("=========================================================\n");
  }

  private shouldSellPosition(position: any): boolean {
    return !!(
      position.pnl &&
      position.pnl >
        position.invest + position.invest * this.config.minProfitThreshold
    );
  }

  private logSellDecision(position: Position): void {
    console.log(
      `\n🎯 ================== Sell Decision สำหรับการซื้อรอบที่ ${this.tradingState.getCurrentCycle()} ================== 🎯`
    );
    console.log(`⏰ เวลา: ${new Date().toLocaleString()}`);

    // Position Details
    console.log("\n📊 รายละเอียดการซื้อ:");
    console.log(`   • รหัสคำสั่งซื้อ:         ${position.externalId}`);
    console.log(`   • ชื่อสินทรัพย์:      ${position.active?.name}`);
    console.log(`   • Direction:        ${position.direction?.toUpperCase()}`);
    console.log(`   • จำนวนเงินที่ซื้อ:    ${position.invest}`);

    // Profit Analysis
    console.log("\n💰 Profit Analysis:");
    console.log(`   • PNL:      ${position.pnl}`);
    console.log(
      `   • กำไรที่ต้องการ(%):  ${this.config.minProfitThreshold * 100}%`
    );
    console.log(
      `   • กำไรที่ต้องการ:    ${
        (position.invest || 0) +
        (position.invest || 0) * this.config.minProfitThreshold
      }`
    );
    console.log(`   • Current Quote:    ${position.closeQuote}`);

    // Decision
    console.log("\n✅ การตัดสินใจ:");
    console.log(`   • การตัดสินใจ:       ขายสินทรัพย์`);
    console.log(`   • เหตุผล:           กำไรที่ต้องการถึงจุด`);
    console.log("=========================================================\n");
  }
}
