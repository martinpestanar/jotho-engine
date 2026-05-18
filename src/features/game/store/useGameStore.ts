import { create } from "zustand"
import type { GameState, GamePhase, GameEvent, PKDTransaction } from "../model/types"

interface GameActions {
  setPhase: (phase: GamePhase) => void
  addPKD: (amount: number, reason: string) => void
  pushEvent: (event: GameEvent) => void
  pushTransaction: (tx: PKDTransaction) => void
  reset: () => void
}

const initialState: GameState = {
  phase: "idle",
  pkdBalance: 0,
  transactions: [],
  activeEvents: [],
}

export const useGameStore = create<GameState & GameActions>((set) => ({
  ...initialState,

  setPhase: (phase) => set({ phase }),

  addPKD: (amount, reason) =>
    set((state) => ({
      pkdBalance: state.pkdBalance + amount,
      transactions: [
        ...state.transactions,
        { amount, reason, timestamp: Date.now() },
      ],
    })),

  pushEvent: (event) =>
    set((state) => ({
      activeEvents: [...state.activeEvents, event],
    })),

  pushTransaction: (tx) =>
    set((state) => ({
      transactions: [...state.transactions, tx],
    })),

  reset: () => set(initialState),
}))
