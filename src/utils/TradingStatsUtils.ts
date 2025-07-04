import { Position } from "@quadcode-tech/client-sdk-js";

export interface TradingStats {
  totalTrades: number;
  totalWins: number;
  totalDraws: number;
  totalLosses: number;
  totalPnL: number;
  winRate: number;
}

export function calculateTradingStats(positions: Position[]): TradingStats {
  const totalTrades = positions.length;
  const totalWins = positions.filter((pos) => (pos.pnl ?? 0) > 0).length;
  const totalDraws = positions.filter((pos) => (pos.pnl ?? 0) === 0).length;
  const totalLosses = totalTrades - totalWins - totalDraws;
  const totalPnL = positions.reduce((sum, pos) => sum + (pos.pnl ?? 0), 0);
  const winRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0;

  return {
    totalTrades,
    totalWins,
    totalDraws,
    totalLosses,
    totalPnL,
    winRate,
  };
}
