import type { Position } from "@quadcode-tech/client-sdk-js";

export type PositionMiddleware = (
  position: Position,
  resolve: (position: Position) => void,
  reject: (error: any) => void
) => Promise<void> | void;
