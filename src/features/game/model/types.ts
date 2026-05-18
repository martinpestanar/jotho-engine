export interface GameEvent {
  type: "oracle_message" | "weather_change" | "reward" | "penalty"
  payload: Record<string, unknown>
  timestamp: number
}

export interface PKDTransaction {
  amount: number
  reason: string
  timestamp: number
}

export type GamePhase = "idle" | "playing" | "paused" | "oracle_speaking"

export interface GameState {
  phase: GamePhase
  pkdBalance: number
  transactions: PKDTransaction[]
  activeEvents: GameEvent[]
}
