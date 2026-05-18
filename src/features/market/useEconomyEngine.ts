/**
 * useEconomyEngine — LifeSync Fase 1
 *
 * Lee el "Índice de Economía de Johto" desde Supabase y lo usa para:
 *   1. Informar al UI del estado del mercado (BOOM / ESTABLE / RECESION / CRISIS).
 *   2. Parchear los precios de las tiendas en la RAM del emulador en tiempo real.
 *
 * Arquitectura:
 *   Supabase (economia_johto + precios_tienda_johto)
 *     └─► useEconomyEngine (este hook) — polling cada 60s
 *           └─► patchShopPricesInRAM() — inyección en WASM heap
 *
 * Los precios base del ROM (items.h) son sobrescritos en RAM por el patcher.
 * El juego lee los precios de la RAM, por lo que el cambio es instantáneo.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '@/shared/lib/supabase/client'

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type EstadoEconomia = 'BOOM' | 'ESTABLE' | 'RECESION' | 'CRISIS'

export interface PrecioItem {
  id_gba: number   // id_interno_gba — mapeado en master_objetos
  nombre: string
  precio_base: number
  precio: number   // precio_actual después de inflación
}

export interface EconomiaJohto {
  indice: number              // 0.5 – 3.0
  estado: EstadoEconomia
  descripcion: string
  variacion_promedio: number
  empresas_en_crisis: number
  multiplicador_npc: number   // cuánto pagan los NPCs al perder vs normal
  calculado_en: string
  precios: PrecioItem[]
}

interface EconomyState {
  economia: EconomiaJohto | null
  loading: boolean
  error: string | null
  lastPatchedAt: Date | null
}


// ─── RAM Patching ─────────────────────────────────────────────────────────────
//
// FireRed ItemData array layout (items.c):
//   struct ItemData { /* name[14] */ u8 name[14]; u8 _pad2; u8 itemId; u8 holdEffect; u8 holdEffectParam; u8 description[1]; u8 importance; u8 unk19; u16 price; u8 battleUsage; u8 battleUseFunc; u32 extraData; };
//   → sizeof(ItemData) = 44 bytes
//   → offsetof(price)  = 0x10 = 16 bytes
//
// GBA vanilla prices we use as a 4-item signature to locate the array in WASM heap:
//   ID 1 = Master Ball: 0       (free / gift)
//   ID 2 = Ultra Ball:  1200
//   ID 3 = Great Ball:  600
//   ID 4 = Poké Ball:   200

const ITEM_STRUCT_SIZE    = 44   // sizeof(ItemData) in bytes
const PRICE_OFFSET        = 16   // offsetof(ItemData, price) in bytes

// Precios ORIGINALES del ROM vanilla (solo para firma de detección)
const MASTER_BALL_VANILLA  =    0
const ULTRA_BALL_VANILLA   = 1200
const GREAT_BALL_VANILLA   =  600
const POKE_BALL_VANILLA    =  200

let cachedItemArrayBases: number[] = []

/** Limpia el caché de base del array (llamar al recargar el emulador). */
export function resetItemArrayCache() {
  cachedItemArrayBases = []
  console.info('🔄 ItemData base cache cleared')
}

/**
 * Localiza el ItemData array en el heap WASM usando una firma de 4 precios
 * consecutivos y parchea los precios de Supabase directamente en memoria.
 * Devuelve true si se parchó al menos 1 item.
 */
function patchShopPricesInRAM(precios: PrecioItem[]): boolean {
  try {
    const iframe = document.querySelector('iframe') as HTMLIFrameElement | null
    if (!iframe?.contentWindow) return false
    const emulator = (iframe.contentWindow as any).EJS_emulator
    const gm = emulator?.gameManager
    if (!gm?.Module?.HEAPU8) return false

    const heap = gm.Module.HEAPU8 as Uint8Array
    const view = new DataView(heap.buffer, heap.byteOffset)
    // Limite de escaneo: todo el heap disponible, con margen
    const SCAN_LIMIT = heap.length - ITEM_STRUCT_SIZE * 10

    let candidateBases: number[] = [...cachedItemArrayBases]

    if (candidateBases.length === 0) {
      // Buscar la firma en todo el heap
      // Incremento de 2 porque el ROM y las estructuras siempre mantienen alineación de al menos 2 bytes
      for (let i = 0; i < SCAN_LIMIT; i += 2) {
        const val = view.getUint16(i, true)
        if (val !== POKE_BALL_VANILLA) continue

        const candidateBase = i - PRICE_OFFSET - (4 * ITEM_STRUCT_SIZE)
        if (candidateBase < 0) continue

        const readPrice = (id: number) =>
          view.getUint16(candidateBase + id * ITEM_STRUCT_SIZE + PRICE_OFFSET, true)

        const ub = readPrice(2)   // Ultra Ball   → 1200
        const gb = readPrice(3)   // Great Ball   → 600
        const pb = readPrice(4)   // Poké Ball    → 200

        if (ub === ULTRA_BALL_VANILLA && gb === GREAT_BALL_VANILLA && pb === POKE_BALL_VANILLA) {
          candidateBases.push(candidateBase)
          console.info(`🏪 ItemData array encontrado en heap offset 0x${candidateBase.toString(16)}`)
        }
      }
      
      if (candidateBases.length > 0) {
        // Cacheamos TODAS las bases encontradas
        cachedItemArrayBases = [...candidateBases]
      }
    }

    if (candidateBases.length === 0) {
      console.warn('🏪 ItemData array NO encontrado — ROM aún cargando o layout diferente')
      return false
    }

    // Parchear precios en TODAS las copias encontradas del array
    let patchCount = 0
    for (const base of candidateBases) {
      for (const item of precios) {
        if (item.id_gba <= 0 || item.id_gba > 400) continue
        if (item.precio <= 0) continue   // items regalo, no tocar

        const offset = base + item.id_gba * ITEM_STRUCT_SIZE + PRICE_OFFSET
        if (offset + 2 > heap.length) continue

        const oldPrice = view.getUint16(offset, true)
        const newPrice = Math.min(65535, item.precio)
        view.setUint16(offset, newPrice, true)
        patchCount++
      }
      console.info(`✅ Precios inyectados en instancia base 0x${base.toString(16)}`)
    }

    if (patchCount > 0) {
      console.info(`✅ Se inyectaron precios en ${candidateBases.length} instancias en RAM`)
    }
    return patchCount > 0
  } catch (e) {
    console.warn('patchShopPricesInRAM error:', (e as Error).message)
    return false
  }
}


// ─── Hook principal ───────────────────────────────────────────────────────────

export function useEconomyEngine() {
  const [state, setState] = useState<EconomyState>({
    economia: null,
    loading: true,
    error: null,
    lastPatchedAt: null,
  })
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const economiaRef = useRef<EconomiaJohto | null>(null)

  const fetchAndPatch = useCallback(async () => {
    try {
      // Leer el estado actual de la economía (sin recalcular, solo lectura rápida)
      const { data, error } = await supabase.rpc('get_economia_johto')
      if (error) throw error

      const economia = data as EconomiaJohto
      economiaRef.current = economia

      setState(s => ({
        ...s,
        economia,
        loading: false,
        error: null,
      }))

      // Intentar parchear RAM del emulador
      const patched = patchShopPricesInRAM(economia.precios)
      if (patched) {
        setState(s => ({ ...s, lastPatchedAt: new Date() }))
      }
    } catch (e) {
      setState(s => ({
        ...s,
        loading: false,
        error: (e as Error).message,
      }))
    }
  }, [])

  // Polling: fetch + patch cada 60 segundos
  useEffect(() => {
    fetchAndPatch()
    intervalRef.current = setInterval(fetchAndPatch, 60_000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchAndPatch])

  // Suscripción en tiempo real a cambios en economia_johto via Realtime
  useEffect(() => {
    const channelId = `economia-realtime-${Math.random()}`
    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'economia_johto',
      }, () => {
        // El mercado acaba de hacer tick — re-fetchear y re-parchear
        fetchAndPatch()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchAndPatch])

  /**
   * Forzar re-patch de RAM (útil cuando el emulador acaba de cargar)
   */
  const forceRepatch = useCallback(() => {
    const eco = economiaRef.current
    if (!eco) return false
    return patchShopPricesInRAM(eco.precios)
  }, [])

  /**
   * Disparar recálculo global de la economía (solo llamar tras eventos importantes)
   */
  const recalcularEconomia = useCallback(async () => {
    const { data, error } = await supabase.rpc('calcular_indice_economia')
    if (!error && data) {
      const economia = data as EconomiaJohto
      economiaRef.current = economia
      setState(s => ({ ...s, economia, lastPatchedAt: new Date() }))
      patchShopPricesInRAM(economia.precios)
    }
  }, [])

  return {
    ...state,
    forceRepatch,
    recalcularEconomia,
  }
}
