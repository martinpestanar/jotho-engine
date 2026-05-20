"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion } from "framer-motion"
import { EmulatorCanvas } from "@/features/emulator"
import { useGameStore } from "@/features/game"
import { useHabitStore } from "@/features/habits"
import { useCloudSave } from "@/features/cloudsave/useCloudSave"
import { EconomyStatusWidget } from "@/features/market/components/EconomyStatusWidget"
import { Play, Pause, RotateCcw, Gamepad2, ChevronLeft, Clock, Sparkles, CloudUpload, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { GAME } from "@/shared/config/constants"
import { cn } from "@/lib/utils"
import { supabase, supabaseReady } from "@/shared/lib/supabase/client"
import { useAppStore } from "@/store/useAppStore"
import { useEconomyEngine, resetItemArrayCache } from "@/features/market/useEconomyEngine"
import { useEconomyStore } from "@/store/useEconomyStore"
import { useRouter } from "next/navigation"

const SUPABASE_PUBLIC = "https://eafgbgooiefatkunoswz.supabase.co/storage/v1/object/public/save-states"
const ROM_URL = `${SUPABASE_PUBLIC}/johto.gba?v=${Date.now()}`
const KNOWN_ROMS = [ROM_URL, "/roms/johto.gba"]

// Auto-save interval in ms — every 60 seconds.
// Primary save detection is FS polling (30s) in useCloudSave.
// This is a safety net that also forces extraction from the emulator.
const AUTO_SAVE_INTERVAL_MS = 60_000

// Must match money.c #define MAX_MONEY 9999999
const MAX_PKD = 9_999_999

export default function AppShell() {
  const router = useRouter()
  const [romUrl, setRomUrl] = useState<string | null>(null)
  const [showHabits, setShowHabits] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  const phase = useGameStore((s) => s.phase)
  const setPhase = useGameStore((s) => s.setPhase)

  // ✅ Fuente de verdad única del saldo PKD
  const pkdBalance = useEconomyStore((s) => s.pkdBalance)

  const habitSetUserId = useHabitStore((s) => s.setUserId)
  const { decrementPlayTime, dailyPlayTimeRemaining } = useAppStore()

  const pct = Math.round((dailyPlayTimeRemaining / 600) * 100)
  const hrs = Math.floor(dailyPlayTimeRemaining / 60)
  const mins = dailyPlayTimeRemaining % 60

  // — Play time countdown —
  useEffect(() => {
    if (phase !== "playing") return
    const timer = setInterval(() => decrementPlayTime(1), 60000)
    return () => clearInterval(timer)
  }, [phase, decrementPlayTime])

  useEffect(() => {
    if (dailyPlayTimeRemaining <= 0) router.replace("/dashboard")
  }, [dailyPlayTimeRemaining, router])

  const {
    connected,
    ready: cloudReady,
    externalFiles,
    onSaveUpdate,
    syncPKD,
    savePKD,
    cloudPKD,
    injectLatestSave,
    forceUpload,
    isUploading,
    lastUploadAt,
    uploadError,
  } = useCloudSave(userId)

  // — Economy engine: patch shop prices into emulator RAM —
  const { forceRepatch } = useEconomyEngine()

  // Called when EmulatorJS fires EJS_onGameStart — ROM is in WASM heap at this point.
  // We retry for up to 10s because HEAPU8 may still be initializing.
  const handleGameReady = useCallback(() => {
    setPhase("playing")
    resetItemArrayCache()   // limpiar offset obsoleto de sesiones anteriores
    let attempts = 0
    const timer = setInterval(() => {
      attempts++
      const ok = forceRepatch()
      if (ok || attempts >= 20) {
        clearInterval(timer)
        if (ok) console.info("✅ Precios hardcore inyectados en RAM al arrancar el juego")
        else console.warn("⚠️ No se pudo inyectar precios tras 20 intentos")
      }
    }, 500)
  }, [setPhase, forceRepatch])

  const hasInjectedRef = useRef(false)

  // — Inject cloud save into emulator once ready —
  useEffect(() => {
    if (!cloudReady || !injectLatestSave || hasInjectedRef.current) return
    let att = 0
    const timer = setInterval(() => {
      att++
      if (injectLatestSave()) { 
        clearInterval(timer)
        hasInjectedRef.current = true
        console.info("Cloud save inyectado en emulador")
        return 
      }
      if (att > 50) { clearInterval(timer); console.warn("No se pudo inyectar cloud save tras 50 intentos") }
    }, 100)
    return () => clearInterval(timer)
  }, [cloudReady, injectLatestSave])
  // — Resolve userId —
  useEffect(() => {
    ;(async () => {
      if (supabaseReady && supabase) {
        const { data } = await supabase.auth.getSession()
        const uid = data?.session?.user?.id ?? null
        if (uid) {
          setUserId(uid)
          habitSetUserId(uid)
          return
        }
      }
      const deviceId = localStorage.getItem("johto-device-id") || crypto.randomUUID()
      localStorage.setItem("johto-device-id", deviceId)
      setUserId(deviceId); habitSetUserId(deviceId)
    })()
  }, [habitSetUserId])

  // — Sync PKD del juego (cloudSave) → economy store al conectar —
  // El Realtime lo mantiene actualizado en tiempo real.
  // syncPKD en useCloudSave ya llama modifySaldo, el Realtime propaga el cambio.
  useEffect(() => {
    if (userId && cloudReady && connected) {
      const raw = Math.max(cloudPKD ?? 0, savePKD ?? 0)
      if (raw > 0 && raw <= MAX_PKD) {
        const currentEconBalance = useEconomyStore.getState().pkdBalance
        if (Math.abs(raw - currentEconBalance) > 0) {
          console.info(`AppShell: seed inicial PKD → ${raw.toLocaleString()}`)
          useEconomyStore.getState()._setBalance(raw)
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, cloudReady, connected, cloudPKD, savePKD])



  // — ROM detection —
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      for (const url of KNOWN_ROMS) {
        try {
          const res = await fetch(url, { method: "HEAD" })
          if (res.ok && !cancelled) { setRomUrl(url); return }
        } catch { /* next */ }
      }
    })()
    return () => { cancelled = true }
  }, [])

  // — Manual sync button handler —
  const handleManualSync = useCallback(async () => {
    const ok = await forceUpload()
    if (!ok) console.warn("Sync manual falló — revisa la consola del navegador para detalles")
  }, [forceUpload])

  // — Sync status label —
  const syncLabel = isUploading
    ? "Guardando..."
    : uploadError
    ? "Error al guardar"
    : lastUploadAt
    ? `Guardado ${lastUploadAt.toLocaleTimeString()}`
    : "Guardar ahora"

  const SyncIcon = isUploading
    ? Loader2
    : uploadError
    ? AlertCircle
    : lastUploadAt
    ? CheckCircle
    : CloudUpload

  // — JSX —
  return (
    <div className="flex flex-col min-h-screen bg-page">
      {/* — Header — */}
      <header className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 bg-white/70 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/dashboard")} className="w-8 h-8 rounded-xl bg-joycon-cyan/10 border border-joycon-cyan/20 flex items-center justify-center hover:bg-joycon-cyan/20 transition-colors">
            <ChevronLeft className="w-4 h-4 text-joycon-cyan" />
          </button>
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-joycon-cyan shadow-sm" />
          <div>
            <p className="text-sm font-bold text-navy">Johto LifeSync</p>
            <p className="text-[10px] text-slate-400 font-mono">{GAME.CURRENCY_SYMBOL} {pkdBalance.toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowHabits(!showHabits)} className={cn("text-xs h-8 px-3 rounded-full border transition-all", showHabits ? "bg-joycon-cyan/10 border-joycon-cyan/30 text-joycon-cyan" : "bg-white border-slate-200 text-slate-400 hover:border-slate-300")}>
            <Gamepad2 className="w-3.5 h-3.5 mr-1 inline" />
            {showHabits ? "Habits" : "Console"}
          </button>
        </div>
      </header>

      {/* — Main — */}
      <main className="flex flex-1 overflow-hidden">
        {/* — Game Boy Console Area — */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {/* Atomic Purple Shell */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 16 }}
            className="relative w-full max-w-[700px] bg-gradient-to-br from-purple-500/20 via-purple-400/15 to-purple-300/20 backdrop-blur-xl border border-purple-300/40 rounded-[2.5rem] sm:rounded-[3rem] shadow-2xl shadow-purple-500/10 p-5 sm:p-7"
          >
            {/* Screen Bezel */}
            <div className="bg-slate-900 rounded-2xl sm:rounded-3xl p-2 sm:p-3 shadow-inner shadow-black/30">
              {/* Emulator */}
              <div className="rounded-xl sm:rounded-2xl overflow-hidden bg-black/40">
                <EmulatorCanvas
                  romUrl={romUrl ?? undefined}
                  externalFiles={externalFiles}
                  onSaveUpdate={onSaveUpdate}
                  onGameStart={handleGameReady}
                />
              </div>
            </div>

            {/* Bezel label */}
            <div className="flex items-center justify-between mt-3 px-1">
              <span className="text-[9px] tracking-[0.2em] text-purple-600/50 font-semibold uppercase">LifeSync Color</span>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-plant-green" />
                <span className="w-1.5 h-1.5 rounded-full bg-coral/60" />
              </div>
            </div>

            {/* Decorative D-Pad + A/B */}
            <div className="flex items-center justify-between mt-5 px-2 sm:px-4">
              {/* D-Pad */}
              <div className="relative w-20 h-20 sm:w-24 sm:h-24">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 bg-slate-600 rounded-sm shadow-inner" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-7 sm:w-8 h-6 sm:h-7 bg-slate-500 rounded-sm shadow-inner" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-7 sm:w-8 h-6 sm:h-7 bg-slate-500 rounded-sm shadow-inner" />
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-7 sm:h-8 w-6 sm:w-7 bg-slate-500 rounded-sm shadow-inner" />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 h-7 sm:h-8 w-6 sm:w-7 bg-slate-500 rounded-sm shadow-inner" />
              </div>
              {/* A/B buttons */}
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex flex-col items-center gap-0.5">
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-coral shadow-lg shadow-coral/30 flex items-center justify-center text-[10px] font-bold text-white -rotate-12">B</div>
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-coral shadow-lg shadow-coral/30 flex items-center justify-center text-[11px] font-bold text-white rotate-12">A</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Controls bar */}
          <div className="flex items-center gap-3 mt-4 flex-wrap justify-center">
            <button
              onClick={() => setPhase("idle")}
              disabled={phase === "idle"}
              className="h-8 w-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-navy disabled:opacity-30 shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setPhase(phase === "paused" ? "playing" : "paused")}
              disabled={phase === "idle"}
              className="h-8 px-4 rounded-full bg-white border border-slate-200 text-sm text-navy hover:bg-slate-50 disabled:opacity-30 shadow-sm flex items-center gap-1.5"
            >
              {phase === "paused" ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              {phase === "paused" ? "Resume" : "Pause"}
            </button>

            {/* Manual Sync Button */}
            <button
              onClick={handleManualSync}
              disabled={isUploading}
              title={syncLabel}
              className={cn(
                "h-8 px-3 rounded-full border text-xs flex items-center gap-1.5 transition-all shadow-sm",
                uploadError
                  ? "bg-coral/10 border-coral/30 text-coral hover:bg-coral/20"
                  : lastUploadAt && !uploadError
                  ? "bg-plant-green/10 border-plant-green/30 text-plant-green hover:bg-plant-green/20"
                  : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50",
                isUploading && "opacity-70 cursor-wait"
              )}
            >
              <SyncIcon className={cn("w-3.5 h-3.5", isUploading && "animate-spin")} />
              <span className="hidden sm:inline">{syncLabel}</span>
            </button>
          </div>

          {/* Play time indicator */}
          <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
            <Clock className="w-3 h-3" />
            <span className="font-mono">{hrs}h {mins}m / 3h</span>
            <div className="w-20 h-1.5 rounded-full bg-slate-200 overflow-hidden">
              <div className={`h-full rounded-full ${pct > 50 ? "bg-plant-green" : pct > 20 ? "bg-pk-yellow" : "bg-coral"}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>

        {/* — Habits Panel — */}
        {showHabits && (
          <aside className="w-full lg:w-[380px] border-l border-slate-200 bg-white/50 backdrop-blur-sm overflow-y-auto p-4 sm:p-5">
            {/* Play time card */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 mb-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Play Time</p>
                <p className="text-xs font-mono text-navy">{hrs}h {mins}m</p>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className={`h-full rounded-full ${pct > 50 ? "bg-gradient-to-r from-plant-green to-joycon-cyan" : pct > 20 ? "bg-gradient-to-r from-pk-yellow to-coral" : "bg-coral"}`} style={{ width: `${pct}%` }} />
              </div>
            </div>

            {/* PKD mini card with sync status */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">PKD</p>
                  <p className="text-lg font-bold text-navy font-mono">{pkdBalance.toLocaleString()}</p>
                  {lastUploadAt && !uploadError && (
                    <p className="text-[10px] text-plant-green mt-0.5 flex items-center gap-1">
                      <CheckCircle className="w-2.5 h-2.5" />
                      Sync {lastUploadAt.toLocaleTimeString()}
                    </p>
                  )}
                  {uploadError && (
                    <p className="text-[10px] text-coral mt-0.5 flex items-center gap-1">
                      <AlertCircle className="w-2.5 h-2.5" />
                      Sin sincronizar
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-10 h-10 rounded-full bg-pk-yellow/20 border border-pk-yellow/30 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-pk-yellow" />
                  </div>
                  <button
                    onClick={handleManualSync}
                    disabled={isUploading}
                    className={cn(
                      "text-[9px] px-2 py-0.5 rounded-full border transition-all",
                      isUploading ? "border-slate-200 text-slate-300" : "border-joycon-cyan/30 text-joycon-cyan hover:bg-joycon-cyan/10"
                    )}
                  >
                    {isUploading ? "..." : "Sync"}
                  </button>
                </div>
              </div>
            </div>

            {/* Economy Status Widget — muestra inflación de Johto en tiempo real */}
            <EconomyStatusWidget
              showPrices={false}
              className="mb-4 rounded-3xl"
            />
          </aside>
        )}
      </main>
    </div>
  )
}
