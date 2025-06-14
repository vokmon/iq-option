import type { Position } from "@quadcode-tech/client-sdk-js";

export class TradingState {
  private hasActiveOrder: boolean = false;
  private currentCycle: number = 1;
  private resultOfPositions: Position[] = [];

  setHasActiveOrder(hasActiveOrder: boolean): void {
    this.hasActiveOrder = hasActiveOrder;
  }

  getHasActiveOrder(): boolean {
    return this.hasActiveOrder;
  }

  addResultOfPosition(position: Position): void {
    this.resultOfPositions.push(position);
  }

  getResultOfPositions(): Position[] {
    return this.resultOfPositions;
  }

  getCurrentCycle(): number {
    return this.currentCycle;
  }

  incrementCurrentCycle(): void {
    this.currentCycle++;
  }
}
