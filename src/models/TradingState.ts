import type { Position } from "@quadcode-tech/client-sdk-js";

export class TradingState {
  private currentTradeNumber: number = 1;
  private resultOfPositions: Position[] = [];

  addResultOfPosition(position: Position): void {
    this.resultOfPositions.push(position);
  }

  getResultOfPositions(): Position[] {
    return this.resultOfPositions;
  }

  getCurrentTradeNumber(): number {
    return this.currentTradeNumber;
  }

  incrementCurrentTradeNumber(): void {
    this.currentTradeNumber++;
  }
}
