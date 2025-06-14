import { ClientSdk } from "@quadcode-tech/client-sdk-js";
import { TradingConfig } from "../models/TradingConfig";

export class PositionMonitor {
  constructor(
    private readonly clientSdk: ClientSdk,
    private readonly config: TradingConfig
  ) {}

  async monitorPosition(
    orderId: number,
    onPositionClosed: (pnl: number) => void,
    expiryDate: Date
  ): Promise<void> {
    try {
      console.log(`🔍 เริ่มติดตาม order ID: ${orderId}`);
      let isMonitoring = true;

      const positions = await this.clientSdk.positions();
      positions.subscribeOnUpdatePosition(async (position) => {
        if (!isMonitoring) return;

        if (position.externalId === orderId) {
          console.log("\n--------------------------------");
          console.log(`📊 ติดตาม Position: ${orderId}`);
          console.log(`💰 Invest: ${position.invest}`);
          console.log(`💰 Open Quote: ${position.openQuote}`);
          console.log(`💰 กำไร/ขาดทุน (PNL): ${position.pnl}`);
          console.log(`💰 Pnl Net: ${position.pnlNet}`);
          console.log(
            `💰 กำไร/ขาดทุนจากการขาย (Sell Profit): ${position.sellProfit}`
          );
          console.log(`💰 Expected Profit: ${position.expectedProfit}`);
          console.log(
            `💰 ขายทันทีเมื่อกำไร: ${this.config.minProfitThreshold * 100}%`
          );
          console.log(`💰 Direction: ${position.direction}`);
          console.log(`⏱️ สถานะ: ${position.status}`);
          console.log(`⏱️ หมดอายุ: ${expiryDate.toLocaleString()}`);
          console.log("--------------------------------");

          if (
            position.expectedProfit &&
            position.invest &&
            position.pnl &&
            position.pnl >
              position.invest + position.invest * this.config.minProfitThreshold
          ) {
            await position.sell();
            onPositionClosed(position.pnl || 0);
            console.log("\n--------------------------------");
            console.log(`🟢 ขาย Position ${orderId}`);
            console.log(`💰 กำไร/ขาดทุน: ${position.pnl}`);
            console.log("--------------------------------");
          }
          if (position.status === "closed") {
            console.log("🔄 Position ปิดแล้ว");
            onPositionClosed(position.pnl || 0);
            isMonitoring = false;
          }
        }
      });
    } catch (error) {
      console.error("❌ เกิดข้อผิดพลาดในการติดตาม position:", error);
    }
  }
}
