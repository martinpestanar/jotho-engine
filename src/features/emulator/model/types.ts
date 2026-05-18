import type { PlatformId, Language } from "react-emulatorjs"

export interface EmulatorConfig {
  EJS_core?: PlatformId
  EJS_gameUrl?: string
  EJS_pathtodata?: string
  EJS_biosUrl?: string
  EJS_gameName?: string
  EJS_volume?: number
  EJS_startOnLoaded?: boolean
  EJS_fullscreenOnLoad?: boolean
  EJS_language?: Language
}

export interface EmulatorState {
  isRunning: boolean
  isPaused: boolean
  isFullscreen: boolean
  currentROM: string | null
  fps: number
}
