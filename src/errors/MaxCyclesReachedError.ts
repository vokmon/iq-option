export class MaxCyclesReachedError extends Error {
  constructor(cycles: number) {
    const message = `🛑 ถึงจำนวนรอบการเทรดสูงสุดแล้ว (${cycles} รอบ)`;
    super(message);
    this.name = this.constructor.name;
  }
}
