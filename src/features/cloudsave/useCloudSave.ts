/**
 * 🛑 CRITICAL FILE: CLOUD SAVE ENGINE
 * 
 * WARNING: This file contains fragile synchronization logic between EmulatorJS and Supabase.
 * - DO NOT "refactor" the polling logic (useEffect for FS polling).
 * - DO NOT remove uploadSaveRef (it's a stable ref to prevent interval destruction).
 * - DO NOT change the emergency save handlers (visibilitychange/beforeunload).
 * 
 * Historical Bugs:
 * 1. Interval destruction on re-render (Fixed via uploadSaveRef).
 * 2. Missing in-game saves on close (Fixed via visibilitychange + syncfs).
 * 3. Double-trigger uploads (Fixed via updating hash BEFORE async call).
 */

/**
 * Cloud Save Hook — bridges EmulatorJS .srm ↔ Supabase Storage
 *
 * ROM XOR encryption FULLY DISABLED (GetMoney/SetMoney are now plaintext).
 * Money at offset 0x490 (u32 LE). Direct read/write, no encryption.
 *
 * Injection strategy:
 *   1. Patch the .srm buffer with the new money value (plaintext)
 *   2. Write the patched .srm to the emulator's virtual FS
 *   3. Tell the emulator to reload save files from FS
 *   4. ALSO patch the live RAM directly (versionIdMagic - 0x532 = money offset)
 *      This makes the in-game display update WITHOUT requiring a game reload.
 */

"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { supabaseReady, supabase } from "@/shared/lib/supabase/client"
import { patchMoney, readMoney, validateSaveFile, diagnoseSaveFile, patchVar, readPlayerInfo } from "@/shared/lib/sav"
import { useHabitStore } from "@/features/habits/store/useHabitStore"
import { useGauntletStore } from "@/store/useGauntletStore"
import { applyPendingInjections } from "@/features/cloudsave/useInjectionQueue"
import { useEconomyStore } from "@/store/useEconomyStore"

const SAVE_BUCKET = "save-states"
const ROM_NAME = "johto"
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""

function buildPath(userId: string): string { return `${userId}/${ROM_NAME}.srm` }
function buildPublicUrl(userId: string): string { return `${SUPABASE_URL}/storage/v1/object/public/${SAVE_BUCKET}/${buildPath(userId)}` }

interface CloudSaveState {
  connected: boolean
  saveBuffer: ArrayBuffer | null
  savePKD: number
  cloudPKD: number
  ready: boolean
  error: string | null
  lastUploadAt: Date | null
  uploadError: string | null
  isUploading: boolean
}

export function useCloudSave(userId: string | null) {
  const [state, setState] = useState<CloudSaveState>(() => ({
    connected: supabaseReady,
    saveBuffer: null,
    savePKD: 0,
    cloudPKD: 100,
    ready: !supabaseReady,
    error: null,
    lastUploadAt: null,
    uploadError: null,
    isUploading: false,
  }))
  const saveBufferRef = useRef<ArrayBuffer | null>(null)
  const loadedRef = useRef(false)
  const lastUploadedBalanceRef = useRef<number>(-1)

  // Dynamic cache buster: updated after every successful upload.
  // Initialized from profiles.last_save_time on mount.
  const lastSaveTimeRef = useRef<string>(String(Date.now()))

  // Debounce ref for onSaveUpdate — ensures we cancel previous pending uploads
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Hash of last uploaded buffer — used by FS polling to detect actual changes
  const lastFsHashRef = useRef<number>(0)

  // Stable ref to uploadSave — used by the FS poller so the interval never
  // gets torn down/recreated when uploadSave is re-created after a setState call.
  const uploadSaveRef = useRef<() => Promise<boolean>>(() => Promise.resolve(false))
  
  // — Initial Load from Cloud (on mount) —
  // 1. Fetch last_save_time from profiles for cache-busting
  // 2. Download the .srm using that timestamp
  useEffect(() => {
    if (!supabaseReady || !userId || loadedRef.current) return
    loadedRef.current = true

    let cancelled = false
    ;(async () => {
      // Step 1: Read last_save_time from profiles for accurate cache busting
      let profileTimestamp = String(Date.now())
      try {
        if (supabase) {
          const { data: profile } = await (supabase.from("profiles") as any)
            .select("last_save_time")
            .eq("id", userId)
            .single()
          if (profile?.last_save_time) {
            profileTimestamp = String(new Date(profile.last_save_time).getTime())
            console.info(`📅 last_save_time del perfil: ${profile.last_save_time}`)
          }
        }
      } catch { /* profile may not exist yet */ }
      lastSaveTimeRef.current = profileTimestamp

      // Step 2: Download the .srm with the profile-based cache buster
      const userPath = buildPublicUrl(userId)
      const rootPath = `${SUPABASE_URL}/storage/v1/object/public/${SAVE_BUCKET}/johto.srm`
      const urls = [userPath, rootPath]

      for (const url of urls) {
        if (cancelled) return
        try {
          console.info(`Intentando cargar save desde: ${url}`)
          const res = await fetch(`${url}?t=${profileTimestamp}`, { cache: "no-store" })
          if (!res.ok) {
            console.warn(`No se encontró save en ${url} (Status: ${res.status})`)
            continue
          }
          const buf = await res.arrayBuffer()
          const valid = validateSaveFile(buf)
          if (!valid.valid) {
            console.warn(`Cloud save en ${url} falló validación (posiblemente vacío o corrupto)`)
            continue
          }
          const m = readMoney(buf)
          let patchedBuf = buf
          
          // PHASE 4: Inject pending items and Pokémon from Supabase BEFORE applying var/money patches
          if (userId) {
            const playerInfo = readPlayerInfo(buf)
            // Even if we can't read player info correctly, we can pass dummy values if needed,
            // but the parser now returns "PLAYER" and the real OT ID or 0.
            if (playerInfo) {
              const injectionResult = await applyPendingInjections(patchedBuf, userId, playerInfo.otId, playerInfo.otName)
              patchedBuf = injectionResult.buffer
              if (injectionResult.appliedCount > 0) {
                console.info(`🎁 Inyecciones Fase 4 aplicadas: ${injectionResult.appliedCount}`)
              }
              if (injectionResult.errors.length > 0) {
                console.warn(`⚠️ Errores en inyección:`, injectionResult.errors)
              }
            } else {
              console.warn("No se pudo leer la info del jugador (SaveBlock2 no encontrado). Saltando inyecciones Fase 4.")
            }
          }

          // Inject Gauntlet level into VAR_0x40FB (index 251)
          const targetGym = useGauntletStore.getState().currentTargetGym
          if (targetGym !== null) {
            const tempBuf = patchVar(patchedBuf, 251, targetGym)
            if (tempBuf) patchedBuf = tempBuf
          }

          saveBufferRef.current = patchedBuf
          if (!cancelled) {
            setState(s => ({
              ...s,
              connected: true,
              saveBuffer: patchedBuf,
              savePKD: m?.money ?? 100,
              cloudPKD: m?.money ?? 100,
              ready: true,
              error: null,
            }))
            console.info(`✅ PARTIDA RECUPERADA desde ${url}: PKD=${m?.money?.toLocaleString()}`)
          }
          return
        } catch (e) {
          console.warn(`Error de red al cargar desde ${url}:`, (e as Error).message)
        }
      }

      if (!cancelled) {
        console.log("No se encontró cloud save — partida nueva")
        setState(s => ({ ...s, ready: true }))
      }
    })()
    return () => { cancelled = true }
  }, [userId])

  // — Cache save buffer from emulator —
  const handleSaveUpdate = useCallback((buf: ArrayBuffer) => {
    saveBufferRef.current = buf
    try {
      const m = readMoney(buf)
      setState(s => ({ ...s, saveBuffer: buf, savePKD: m?.money ?? s.savePKD }))
    } catch {
      setState(s => ({ ...s, saveBuffer: buf }))
    }
  }, [])

  // — Core upload: patch PKD into buffer and upload to Supabase —
  const uploadSave = useCallback(async (): Promise<boolean> => {
    if (!supabaseReady || !userId || !supabase) return false

    // NOTE: The FS poller captures the fresh buffer BEFORE calling uploadSave.
    // We do NOT call extractSaveFromEmulator() here to avoid a double flush
    // which would cause the next poll to see a stale hash and miss real saves.
    const buf = saveBufferRef.current
    if (!buf || buf.byteLength === 0) {
      console.warn("uploadSave: buffer vacío, abortando")
      return false
    }

    // Validate before patching
    const validation = validateSaveFile(buf)
    if (!validation.valid) {
      const diag = diagnoseSaveFile(buf)
      console.error("uploadSave: buffer inválido, abortando upload\n" + diag)
      setState(s => ({ ...s, uploadError: "Save inválido — no se subió" }))
      return false
    }

    // 🎯 SOURCE OF TRUTH FIX:
    // Read money from the actual GBA save buffer — this reflects what the player
    // currently has AFTER making purchases in the game.
    // We do NOT overwrite with the web PKD balance here — the game is the source of truth.
    const moneyInSave = readMoney(buf)
    const inGameBalance = moneyInSave?.money ?? useHabitStore.getState().balance

    // Upload the buffer AS-IS (with the real in-game money, no overwrite)
    setState(s => ({ ...s, isUploading: true, uploadError: null }))

    const { error } = await supabase.storage.from(SAVE_BUCKET)
      .upload(
        buildPath(userId),
        new Blob([buf], { type: "application/octet-stream" }),
        { upsert: true, contentType: "application/octet-stream" }
      )

    if (error) {
      console.warn("uploadSave: Supabase error:", error.message)
      setState(s => ({ ...s, isUploading: false, uploadError: error.message }))
      return false
    }

    // Update last_save_time in profiles for CDN cache-busting on next load.
    const now = new Date()
    const nowIso = now.toISOString()
    lastSaveTimeRef.current = String(now.getTime())
    try {
      await (supabase.from("profiles") as any)
        .update({ last_save_time: nowIso })
        .eq("id", userId)
    } catch (e) {
      console.warn("uploadSave: no se pudo actualizar last_save_time:", (e as Error).message)
    }

    // 🔄 Sync in-game balance BACK to the economy store (bidirectional sync)
    // The GBA save is the source of truth for what the player actually has.
    // We compute the delta from the current web balance and use the atomic RPC.
    const econStore = useEconomyStore.getState()
    if (moneyInSave) {
      const currentWebBalance = econStore.pkdBalance
      const delta = moneyInSave.money - currentWebBalance
      if (Math.abs(delta) > 0) {
        console.info(`🔄 Sync GBA → web: ${currentWebBalance.toLocaleString()} → ${moneyInSave.money.toLocaleString()} (delta=${delta})`)
        await econStore.modifySaldo(delta, 'game')
      }
    }

    lastUploadedBalanceRef.current = inGameBalance
    saveBufferRef.current = buf
    setState(s => ({ ...s, saveBuffer: buf, savePKD: inGameBalance, cloudPKD: inGameBalance, isUploading: false, lastUploadAt: now, uploadError: null }))
    console.info(`✅ Save subido: PKD juego=${inGameBalance.toLocaleString()} @ ${now.toLocaleTimeString()} (cache buster=${lastSaveTimeRef.current})`)
    return true
  }, [userId])

  // Keep the stable ref always pointing to the latest uploadSave.
  // This prevents the FS poller's setInterval from being torn down on re-renders.
  uploadSaveRef.current = uploadSave

  // — Full PKD sync: profile → patch .srm → upload → inject RAM —
  const syncPKD = useCallback(async (newBalance: number): Promise<boolean> => {
    // Calcular delta respecto al saldo actual en useEconomyStore
    const currentBalance = useEconomyStore.getState().pkdBalance
    const delta = newBalance - currentBalance

    if (delta !== 0 && supabaseReady && userId && supabase) {
      try {
        const result = await useEconomyStore.getState().modifySaldo(delta, 'game-sync')
        if (result === null) console.warn("syncPKD: modifySaldo falló")
      } catch { /* offline */ }
    }

    const buf = saveBufferRef.current
    if (!buf) {
      setState(s => ({ ...s, cloudPKD: newBalance }))
      return true
    }

    const patched = patchMoney(buf, newBalance)
    if (!patched) {
      console.error("syncPKD: patchMoney falló")
      return false
    }

    if (supabaseReady && userId && supabase) {
      const { error } = await supabase.storage.from(SAVE_BUCKET)
        .upload(
          buildPath(userId),
          new Blob([patched], { type: "application/octet-stream" }),
          { upsert: true, contentType: "application/octet-stream" }
        )
      if (error) {
        console.warn("syncPKD upload error:", error.message)
      } else {
        console.info(`✅ syncPKD: PKD=${newBalance.toLocaleString()} sincronizado`)
      }
    }

    saveBufferRef.current = patched
    setState(s => ({
      ...s,
      saveBuffer: patched,
      cloudPKD: newBalance,
      savePKD: newBalance,
      lastUploadAt: new Date(),
      uploadError: null,
    }))
    // reloadSave=false: only patch live RAM, don't disrupt in-progress gameplay
    injectSaveToEmulator(patched, newBalance, false)
    return true
  }, [userId])

  // — Called by EmulatorJS onSaveUpdate event —
  // We receive this buffer AFTER the emulator has already written it to its virtual FS.
  // We must NOT re-inject it back — that would create a circular loop.
  // We simply cache the buffer and upload it to Supabase.
  //
  // NOTE: For mGBA/GBA games, EJS_onSaveUpdate is UNRELIABLE — it may never fire.
  // The FS polling effect below is our primary save detection mechanism.
  // This callback is kept as a bonus trigger for when it DOES fire.
  const onSaveUpdate = useCallback((event: { save: ArrayBuffer }) => {
    console.info("📥 onSaveUpdate FIRED: nuevo save recibido del emulador, esperando 1s antes de subir...")
    handleSaveUpdate(event.save)

    // Cancel previous debounce if still pending
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Debounce 1000ms — let WASM FS finish flushing
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null
      uploadSave()
    }, 1000)
  }, [handleSaveUpdate, uploadSave])

  // 🛑 [PROTECTION BLOCK]: FS POLLING ENGINE
  // This block is high-risk. It handles mGBA synchronization via a forced-flush cycle.
  // DO NOT change dependencies [userId] or move logic out of this effect without extreme testing.
  // Polls every 10 seconds. Forces mGBA to flush SRAM → virtual FS before reading,
  // since EJS_fixedSaveInterval is unreliable across CDN versions.
  // Double-trigger is prevented: hash is updated BEFORE the async upload.
  useEffect(() => {
    if (!userId || !supabaseReady) return
    const FS_POLL_INTERVAL = 5_000 // 5 seconds (snappier sync)

    const interval = setInterval(() => {
      try {
        const iframe = document.querySelector("iframe") as HTMLIFrameElement | null
        if (!iframe?.contentWindow) return
        const emulator = (iframe.contentWindow as any).EJS_emulator
        const gm = emulator?.gameManager
        if (!gm) return

        // 1. Force flush mGBA SRAM → virtual FS
        if (typeof gm.saveSaveFiles === "function") gm.saveSaveFiles()
        if (gm.Module?.FS?.syncfs) gm.Module.FS.syncfs(false, () => {})

        // 2. Read the file — try getSaveFilePath first, then known paths
        let buf: ArrayBuffer | null = null

        if (gm.getSaveFilePath && gm.Module?.FS?.readFile) {
          try {
            const savePath = gm.getSaveFilePath()
            if (savePath) {
              const u8 = gm.Module.FS.readFile(savePath)
              buf = u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength)
            }
          } catch { /* fallthrough */ }
        }

        if (!buf && gm.Module?.FS?.readFile) {
          for (const p of ["/data/saves/mGBA/johto.srm", "/data/saves/johto.srm", "/johto.srm"]) {
            try {
              const u8 = gm.Module.FS.readFile(p)
              if (u8?.byteLength > 0) {
                buf = u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength)
                break
              }
            } catch { /* try next */ }
          }
        }

        if (!buf || (buf as ArrayBuffer).byteLength === 0) return

        const hash = simpleHash(new Uint8Array(buf as ArrayBuffer))

        if (lastFsHashRef.current === 0) {
          // First poll — record baseline hash, never upload on first read
          lastFsHashRef.current = hash
          console.info(`🔍 FS poll: baseline hash (${hash})`)
          return
        }

        if (hash !== lastFsHashRef.current) {
          console.info(`🔍 FS poll: save changed (${lastFsHashRef.current} → ${hash}), uploading...`)
          // ⚠️ Update BEFORE the async upload to prevent the next poll from double-triggering
          lastFsHashRef.current = hash
          saveBufferRef.current = buf as ArrayBuffer
          try {
            const m = readMoney(buf as ArrayBuffer)
            setState(s => ({ ...s, saveBuffer: buf as ArrayBuffer, savePKD: m?.money ?? s.savePKD }))
          } catch { /* ignore */ }
          uploadSaveRef.current()
        }
      } catch { /* poll errors are non-fatal */ }
    }, FS_POLL_INTERVAL)

    return () => clearInterval(interval)
  }, [userId])


  // 🛑 [PROTECTION BLOCK]: EMERGENCY SAVES
  // This block ensures in-game saves are NOT lost when the browser/tab is closed.
  // visibilitychange is the primary trigger for the async upload.
  // beforeunload is the secondary trigger for the sync FS flush.
  useEffect(() => {
    if (!userId || !supabaseReady) return

    const handleVisibilityHide = () => {
      if (document.visibilityState !== "hidden") return
      console.info("⚠️ Tab hidden — emergency save triggered")

      // Capture freshest bytes from the emulator before uploading
      const emergencyBuf = extractSaveFromEmulator()
      if (emergencyBuf && emergencyBuf.byteLength > 0) {
        saveBufferRef.current = emergencyBuf
      }
      // Fire-and-forget: async upload via stable ref (doesn't block UI)
      uploadSaveRef.current().then(ok => {
        console.info(ok ? "✅ Emergency save completado" : "⚠️ Emergency save falló (sin buffer o error de red)")
      })
    }

    // beforeunload: force mGBA to flush SRAM to virtual FS synchronously.
    // We can't await an upload here, but at least the FS is up-to-date for
    // the visibilitychange handler which fires just before this.
    const handleBeforeUnload = () => {
      try {
        const iframe = document.querySelector("iframe") as HTMLIFrameElement | null
        const gm = (iframe?.contentWindow as any)?.EJS_emulator?.gameManager
        if (gm?.saveSaveFiles) gm.saveSaveFiles()
      } catch { /* best effort */ }
    }

    document.addEventListener("visibilitychange", handleVisibilityHide)
    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityHide)
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [userId])

  // — Manual force upload (for sync button in UI) —
  const forceUpload = useCallback(async (): Promise<boolean> => {
    console.info("💾 Forzando upload manual — extrayendo save del emulador...")
    // For manual sync, explicitly grab the freshest bytes from the emulator FS
    const liveEmuBuffer = extractSaveFromEmulator()
    if (liveEmuBuffer && liveEmuBuffer.byteLength > 0) {
      saveBufferRef.current = liveEmuBuffer
      console.info("💾 Extracción manual del save del emulador exitosa.")
    }
    return uploadSave()
  }, [uploadSave])

  const injectLatestSave = useCallback(
    (): boolean => injectSaveToEmulator(state.saveBuffer),
    [state.saveBuffer]
  )

  // Paso 6: Cache buster dinámico — uses last_save_time from profiles,
  // updated after every successful upload. This guarantees the emulator
  // always loads the freshest .srm from Supabase Storage CDN.
  const externalFiles =
    supabaseReady && userId && supabase
      ? { "/data/saves/johto.srm": buildPublicUrl(userId) + `?t=${lastSaveTimeRef.current}` }
      : undefined

  return {
    ...state,
    externalFiles,
    onSaveUpdate,
    syncPKD,
    uploadSave,
    forceUpload,
    saveBufferRef,
    injectLatestSave,
  }
}

// ═══════════════════════════════════════════════════════════════

/**
 * Extracts the raw .srm save buffer directly from the emulator's virtual filesystem.
 * This is used to bypass EJS_onSaveUpdate when it fails to fire (common with mGBA/GBA).
 * Includes detailed diagnostic logging so failures are visible in the console.
 */
function extractSaveFromEmulator(): ArrayBuffer | null {
  try {
    const iframe = document.querySelector("iframe") as HTMLIFrameElement | null
    if (!iframe?.contentWindow) {
      console.info("extractSave: no iframe found")
      return null
    }
    const emulator = (iframe.contentWindow as any).EJS_emulator
    if (!emulator) {
      console.info("extractSave: EJS_emulator not found on iframe.contentWindow")
      return null
    }
    const gm = emulator.gameManager
    if (!gm) {
      console.info("extractSave: gameManager not found on EJS_emulator")
      return null
    }

    // Force flush SRAM to virtual FS before reading!
    try {
      if (typeof gm.saveSaveFiles === "function") {
        console.info("extractSave: Forcing flush via gm.saveSaveFiles()")
        gm.saveSaveFiles()
      } else if (typeof gm.exportSave === "function") {
        console.info("extractSave: Forcing flush via gm.exportSave()")
        gm.exportSave()
      }
      
      // Also try to force Emscripten FS sync
      if (gm.Module?.FS?.syncfs) {
         console.info("extractSave: Forcing FS.syncfs")
         gm.Module.FS.syncfs(false, () => {})
      }
    } catch (e) {
      console.warn("extractSave: Error during forced flush", e)
    }

    // Try getSaveFilePath first
    if (gm.getSaveFilePath && gm.Module?.FS?.readFile) {
      const savePath = gm.getSaveFilePath()
      if (savePath) {
        const u8 = gm.Module.FS.readFile(savePath)
        console.info(`extractSave: read ${u8.byteLength} bytes from ${savePath}`)
        return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength)
      }
    }

    // Fallback: try well-known mGBA save paths
    const FS = gm.Module?.FS
    if (FS?.readFile) {
      const fallbackPaths = [
        "/data/saves/mGBA/johto.srm",
        "/data/saves/johto.srm",
        "/johto.srm",
        "/data/johto.srm",
      ]
      for (const p of fallbackPaths) {
        try {
          const u8 = FS.readFile(p)
          if (u8 && u8.byteLength > 0) {
            console.info(`extractSave: fallback read ${u8.byteLength} bytes from ${p}`)
            return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength)
          }
        } catch { /* path doesn't exist, try next */ }
      }
    }

    // Fallback 2: try gm.getSaveFile() if it exists
    if (typeof gm.getSaveFile === "function") {
      const saveData = gm.getSaveFile()
      if (saveData && saveData.byteLength > 0) {
        console.info(`extractSave: getSaveFile() returned ${saveData.byteLength} bytes`)
        return saveData instanceof ArrayBuffer ? saveData : saveData.buffer.slice(saveData.byteOffset, saveData.byteOffset + saveData.byteLength)
      }
    }

    console.info("extractSave: all methods exhausted, no save found")
    return null
  } catch (e) {
    console.warn("extractSaveFromEmulator error:", (e as Error).message)
    return null
  }
}

/**
 * Fast non-cryptographic hash for change detection.
 * Uses DJB2 algorithm — fast, good distribution for binary data.
 */
function simpleHash(data: Uint8Array): number {
  let hash = 5381
  // Sample every 64th byte for speed (131KB file → ~2048 samples)
  for (let i = 0; i < data.length; i += 64) {
    hash = ((hash << 5) + hash + data[i]) | 0
  }
  return hash >>> 0
}

/**
 * Inject a patched save buffer into the running EmulatorJS instance.
 * @param reloadSave - if true, calls gm.loadSaveFiles() after writing to FS.
 *   Use true on initial load so the emulator actually reads the injected data.
 *   Use false on mid-session PKD sync — we only patch live RAM, no FS reload needed.
 */
function injectSaveToEmulator(buffer: ArrayBuffer | null, newMoney?: number, reloadSave = true): boolean {
  if (!buffer || buffer.byteLength === 0) return false
  try {
    const iframe = document.querySelector("iframe") as HTMLIFrameElement | null
    if (!iframe?.contentWindow) return false
    const emulator = (iframe.contentWindow as any).EJS_emulator
    const gm = emulator?.gameManager
    if (!gm) return false

    // Step 1: Write .srm to the emulator's virtual FS
    let fsWritten = false
    if (gm.getSaveFilePath && gm.writeFile) {
      const savePath = gm.getSaveFilePath()
      if (savePath) {
        gm.writeFile(savePath, new Uint8Array(buffer))
        fsWritten = true
      }
    }

    // Step 2: On initial load (reloadSave=true), tell the emulator to read from FS.
    // On mid-session PKD sync (reloadSave=false), skip this — the emulator's live RAM
    // is already up-to-date and calling loadSaveFiles() mid-session can revert player progress.
    if (fsWritten && reloadSave && gm.loadSaveFiles) {
      gm.loadSaveFiles()
      console.info("injectSaveToEmulator: loadSaveFiles() called — emulator loading cloud save")
    }

    // Step 3: Patch live RAM for instant in-game money update
    if (newMoney !== undefined) {
      patchEmulatorRAM(gm, newMoney)
    }

    return fsWritten
  } catch (e) {
    console.warn("injectSaveToEmulator error:", (e as Error).message)
    return false
  }
}

/**
 * Patch money directly in the emulator's WASM heap (live RAM).
 *
 * Layout from global.h:
 *   SaveBlock1.money:          offset 0x0490 (u32)
 *   SaveBlock1.versionIdMagic: offset 0x09C2 (u32, value 0xE8F828BC)
 *
 * Distance: versionIdMagic - money = 0x09C2 - 0x0490 = 0x0532 bytes
 *
 * Strategy: scan WASM heap for the magic number, then go back 0x532 bytes
 * to find the money field. Since money is now PLAINTEXT (no XOR), we write
 * the value directly.
 */
function patchEmulatorRAM(gm: any, newMoney: number): boolean {
  try {
    const Module = gm?.Module
    if (!Module?.HEAPU8) return false
    const heap = Module.HEAPU8 as Uint8Array

    // SaveBlock1.versionIdMagic = 0xE8F828BC (set in new_game.c)
    const MAGIC = 0xE8F828BC
    const m0 = MAGIC & 0xFF
    const m1 = (MAGIC >> 8) & 0xFF
    const m2 = (MAGIC >> 16) & 0xFF
    const m3 = (MAGIC >> 24) & 0xFF

    // Distance from money to versionIdMagic within SaveBlock1
    const MONEY_TO_MAGIC = 0x0532  // 0x09C2 - 0x0490

    // Limit scan to first 32MB of heap (GBA emulator RAM)
    const scanLimit = Math.min(heap.length - 4, 33554432)
    let patched = false

    for (let i = 0; i < scanLimit; i++) {
      if (heap[i] === m0 && heap[i + 1] === m1 && heap[i + 2] === m2 && heap[i + 3] === m3) {
        // Found versionIdMagic at offset i — money is 0x532 bytes before
        const moneyOff = i - MONEY_TO_MAGIC
        if (moneyOff < 0) continue

        // Read current money value for logging
        const old = (heap[moneyOff] | (heap[moneyOff + 1] << 8) | (heap[moneyOff + 2] << 16) | (heap[moneyOff + 3] << 24)) >>> 0

        // Write new money value (plaintext, little-endian)
        const val = Math.min(Math.max(0, newMoney), 9_999_999) >>> 0
        heap[moneyOff] = val & 0xFF
        heap[moneyOff + 1] = (val >> 8) & 0xFF
        heap[moneyOff + 2] = (val >> 16) & 0xFF
        heap[moneyOff + 3] = (val >> 24) & 0xFF

        console.info(`🎮 RAM patch: ${old.toLocaleString()} → ${val.toLocaleString()} (heap offset 0x${moneyOff.toString(16)}, magic at 0x${i.toString(16)})`)
        patched = true
        // Don't break — patch ALL instances (SaveBlock1 can exist in multiple locations due to ASLR)
      }
    }

    if (!patched) {
      console.warn("RAM patch: versionIdMagic (0xE8F828BC) no encontrado en heap — el juego puede no haberse iniciado aún")
    }
    return patched
  } catch (e) {
    console.warn("RAM patch error:", (e as Error).message)
    return false
  }
}
