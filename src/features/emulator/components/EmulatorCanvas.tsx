"use client"

import { useCallback } from "react"
import { EmulatorJS } from "react-emulatorjs"
import type { EmulatorConfig } from "../model/types"
import { EMULATOR, GAME } from "@/shared/config/constants"
import { useGameStore } from "@/features/game/store/useGameStore"
import { useHabitStore } from "@/features/habits/store/useHabitStore"
import { HardDrive } from "lucide-react"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const EJS = EmulatorJS as React.ComponentType<any>

interface EmulatorCanvasProps {
  romUrl?: string
  config?: Partial<EmulatorConfig>
  externalFiles?: Record<string, string>
  onGameStart?: () => void
  onSaveUpdate?: (event: {
    save: ArrayBuffer
    screenshot: Blob
    format: string
    hash: string
  }) => void
}

export default function EmulatorCanvas({
  romUrl,
  config,
  externalFiles,
  onGameStart,
  onSaveUpdate,
}: EmulatorCanvasProps) {
  const setPhase = useGameStore((s) => s.setPhase)
  const phase = useGameStore((s) => s.phase)
  const pkdBalance = useHabitStore((s) => s.balance)

  const handleReady = useCallback(() => {
    if (onGameStart) onGameStart()
    else setPhase("playing")
  }, [setPhase, onGameStart])

  const handleGameStart = useCallback(() => {
    if (onGameStart) onGameStart()
    else setPhase("playing")
  }, [setPhase, onGameStart])

  if (!romUrl) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 bg-zinc-900/80 rounded-xl border-2 border-dashed border-zinc-700/50 p-16 w-[640px] h-[480px]">
        <HardDrive className="w-10 h-10 text-zinc-600" />
        <p className="text-zinc-400 text-sm font-mono text-center">
          No ROM loaded
        </p>
        <p className="text-zinc-600 text-xs font-mono text-center max-w-xs">
          Click <span className="text-amber-400">ROM</span> in the top bar to
          load a Pokémon <code className="text-amber-500">.gba</code> file
        </p>
      </div>
    )
  }

  return (
    <div className="relative inline-block rounded-lg overflow-hidden shadow-2xl shadow-black/50">
      <EJS
        EJS_core={config?.EJS_core ?? EMULATOR.CORE}
        EJS_gameUrl={romUrl}
        EJS_pathtodata={config?.EJS_pathtodata ?? EMULATOR.DATA_PATH}
        EJS_gameName={config?.EJS_gameName ?? "Pokémon Johto"}
        EJS_volume={config?.EJS_volume ?? EMULATOR.VOLUME}
        EJS_startOnLoaded={config?.EJS_startOnLoaded ?? true}
        EJS_language={config?.EJS_language ?? "en-US"}
        EJS_ready={handleReady}
        EJS_onGameStart={handleGameStart}
        EJS_onSaveUpdate={onSaveUpdate}
        EJS_externalFiles={externalFiles}
        EJS_fixedSaveInterval={5}
        width={EMULATOR.DEFAULT_WIDTH}
        height={EMULATOR.DEFAULT_HEIGHT}
      />
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 py-1.5 bg-black/70 backdrop-blur-sm pointer-events-none z-10">
        <span className="text-xs font-mono text-emerald-400">
          {GAME.CURRENCY_SYMBOL} {pkdBalance.toLocaleString()}
        </span>
        <span className="text-xs font-mono text-zinc-300 uppercase tracking-wider">
          {phase === "playing" && "● LIVE"}
          {phase === "paused" && "❚❚ PAUSED"}
          {phase === "oracle_speaking" && "◈ ORACLE"}
          {phase === "idle" && "○ IDLE"}
        </span>
      </div>
    </div>
  )
}
