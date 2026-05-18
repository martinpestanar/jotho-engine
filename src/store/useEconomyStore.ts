/**
 * ================================================================
 * useEconomyStore — FUENTE DE VERDAD ÚNICA DEL SALDO PKD
 * ================================================================
 *
 * ARQUITECTURA:
 *   Supabase profiles.pkd_balance  ←→  useEconomyStore.pkdBalance
 *
 * REGLAS:
 *   1. Este es el ÚNICO store que guarda el saldo PKD en el frontend.
 *   2. Nunca modifiques profiles.pkd_balance con UPDATE directo desde el cliente.
 *      Siempre usa `modifySaldo(delta, origen)` que llama a fn_modificar_saldo RPC.
 *   3. El saldo se sincroniza automáticamente via Supabase Realtime (WebSocket).
 *      Cuando cualquier parte del sistema (GBA, Oráculo, Trading, Minijuego)
 *      cambia el saldo en Supabase, este store se actualiza SOLO en tiempo real.
 *
 * ESCALABILIDAD:
 *   Para agregar un nuevo minijuego que gane/pierda PKD, solo llama:
 *     useEconomyStore.getState().modifySaldo(+500, 'casino')
 *   El resto de la app (dashboard, header, mercado) se actualiza automáticamente.
 */

"use client"

import { create } from "zustand"
import { supabase, supabaseReady } from "@/shared/lib/supabase/client"

const MAX_PKD = 9_999_999

interface EconomyState {
  /** Saldo PKD actual — leer desde aquí en TODOS los componentes */
  pkdBalance: number
  /** true cuando el balance fue cargado desde Supabase al menos una vez */
  isReady: boolean
  /** ID del usuario actualmente suscrito (para cleanup) */
  _subscribedUserId: string | null

  /**
   * Activa la suscripción Realtime para el usuario dado.
   * Llámalo una sola vez al resolver el userId (ej. en AppShell o en layout).
   * Devuelve una función de limpieza para llamar al desmontar.
   */
  subscribe: (userId: string) => () => void

  /**
   * Modifica el saldo llamando a la RPC atómica `fn_modificar_saldo`.
   * @param delta  - Cantidad a sumar (positivo) o restar (negativo)
   * @param origen - Etiqueta del origen: 'oracle' | 'trade' | 'game' | 'habit' | 'minigame' | ...
   * @returns      - Nuevo saldo después de la operación, o null si falla
   */
  modifySaldo: (delta: number, origen: string) => Promise<number | null>

  /** Carga el balance desde profiles (una sola vez al arrancar) */
  loadBalance: (userId: string) => Promise<void>

  /** Uso interno — actualiza el estado local directamente (llamado por Realtime) */
  _setBalance: (amount: number) => void
}

export const useEconomyStore = create<EconomyState>((set, get) => ({
  pkdBalance: 0,
  isReady: false,
  _subscribedUserId: null,

  // ── Carga inicial ──────────────────────────────────────────────
  loadBalance: async (userId: string) => {
    if (!supabaseReady || !supabase) return
    try {
      const { data, error } = await (supabase.from("profiles") as any)
        .select("pkd_balance")
        .eq("id", userId)
        .single()

      if (!error && data) {
        const safe = Math.min(Math.max(0, data.pkd_balance ?? 0), MAX_PKD)
        set({ pkdBalance: safe, isReady: true })
        console.info(`[EconomyStore] Balance cargado: ${safe.toLocaleString()} PKD`)
      }
    } catch (e) {
      console.warn("[EconomyStore] Error cargando balance:", e)
    }
  },

  // ── Suscripción Realtime ───────────────────────────────────────
  subscribe: (userId: string) => {
    if (!supabaseReady || !supabase) return () => {}

    // Evitar doble suscripción al mismo usuario
    if (get()._subscribedUserId === userId) return () => {}

    // Cargar balance inmediatamente
    get().loadBalance(userId)

    const channel = supabase
      .channel(`economy-profile-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${userId}`,
        },
        (payload: any) => {
          const newBalance = payload.new?.pkd_balance
          if (typeof newBalance === "number") {
            const safe = Math.min(Math.max(0, newBalance), MAX_PKD)
            set({ pkdBalance: safe, isReady: true })
            console.info(`[EconomyStore] Realtime: PKD actualizado → ${safe.toLocaleString()}`)
          }
        }
      )
      .subscribe((status: string) => {
        console.info(`[EconomyStore] Realtime status: ${status}`)
      })

    set({ _subscribedUserId: userId })

    return () => {
      supabase?.removeChannel(channel)
      set({ _subscribedUserId: null })
    }
  },

  // ── Modificar saldo (vía RPC atómica) ─────────────────────────
  modifySaldo: async (delta: number, origen: string): Promise<number | null> => {
    if (!supabaseReady || !supabase) {
      // Fallback offline: actualizar solo en local
      const current = get().pkdBalance
      const next = Math.min(Math.max(0, current + delta), MAX_PKD)
      set({ pkdBalance: next })
      console.warn("[EconomyStore] Sin conexión — saldo actualizado solo en local")
      return next
    }

    try {
      const { data, error } = await (supabase.rpc as any)("fn_modificar_saldo", {
        p_user_id: get()._subscribedUserId,
        p_delta: delta,
        p_origen: origen,
      })

      if (error) {
        console.error("[EconomyStore] Error en fn_modificar_saldo:", error.message)
        return null
      }

      // El Realtime actualizará el store automáticamente.
      // Pero hacemos un set optimista inmediato para UX instantánea.
      const safe = Math.min(Math.max(0, data as number), MAX_PKD)
      set({ pkdBalance: safe })
      return safe
    } catch (e) {
      console.error("[EconomyStore] modifySaldo excepción:", e)
      return null
    }
  },

  // ── Setter interno (Realtime / seed inicial) ───────────────────
  _setBalance: (amount: number) => {
    const safe = Math.min(Math.max(0, amount), MAX_PKD)
    set({ pkdBalance: safe, isReady: true })
  },
}))
