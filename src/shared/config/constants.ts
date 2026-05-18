export const EMULATOR = {
  CORE: "gba" as const,
  DATA_PATH: "https://cdn.emulatorjs.org/stable/data/",
  DEFAULT_WIDTH: 640,
  DEFAULT_HEIGHT: 480,
  VOLUME: 0.5,
} as const

export const GAME = {
  STARTING_PKD: 100,
  CURRENCY_SYMBOL: "PKD",
} as const

export const SUPABASE = {
  HABITS_TABLE: "habits",
  PLAYERS_TABLE: "players",
  TRANSACTIONS_TABLE: "transactions",
} as const
