"use client"

import { create } from "zustand"
import { supabaseReady, supabase } from "@/shared/lib/supabase/client"

interface GauntletState {
  isActive: boolean
  currentTargetGym: number | null
  defeatedInRun: number[]
  isLoading: boolean

  // Acciones
  loadState: (userId: string) => Promise<void>
  startGauntlet: (userId: string) => Promise<void>
  defeatGym: (userId: string, gymId: number) => Promise<void>
  failGauntlet: (userId: string) => Promise<void>
}

export const useGauntletStore = create<GauntletState>((set, get) => ({
  isActive: false,
  currentTargetGym: null,
  defeatedInRun: [],
  isLoading: false,

  loadState: async (userId: string) => {
    if (!supabaseReady || !supabase || !userId) return
    set({ isLoading: true })
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("gauntlet_active_run, current_target_gym, defeated_in_run")
        .eq("id", userId)
        .single()

      if (error) throw error

      if (data) {
        set({
          isActive: data.gauntlet_active_run || false,
          currentTargetGym: data.current_target_gym,
          defeatedInRun: Array.isArray(data.defeated_in_run) ? data.defeated_in_run as number[] : [],
        })
      }
    } catch (err) {
      console.error("[GauntletStore] Error al cargar estado:", err)
    } finally {
      set({ isLoading: false })
    }
  },

  startGauntlet: async (userId: string) => {
    if (!supabaseReady || !supabase || !userId) return
    set({ isLoading: true })
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          gauntlet_active_run: true,
          current_target_gym: 1,
          defeated_in_run: []
        })
        .eq("id", userId)

      if (error) throw error

      set({
        isActive: true,
        currentTargetGym: 1,
        defeatedInRun: []
      })
    } catch (err) {
      console.error("[GauntletStore] Error al iniciar Gauntlet:", err)
    } finally {
      set({ isLoading: false })
    }
  },

  defeatGym: async (userId: string, gymId: number) => {
    const state = get()
    if (!state.isActive || !supabaseReady || !supabase || !userId) return
    
    set({ isLoading: true })
    try {
      const newDefeated = [...state.defeatedInRun, gymId]
      // Si derrotamos al gimnasio objetivo, el objetivo avanza
      const newTarget = (gymId === state.currentTargetGym) ? gymId + 1 : state.currentTargetGym

      const { error } = await supabase
        .from("profiles")
        .update({
          defeated_in_run: newDefeated,
          current_target_gym: newTarget
        })
        .eq("id", userId)

      if (error) throw error

      set({
        defeatedInRun: newDefeated,
        currentTargetGym: newTarget
      })
    } catch (err) {
      console.error("[GauntletStore] Error al registrar victoria:", err)
    } finally {
      set({ isLoading: false })
    }
  },

  failGauntlet: async (userId: string) => {
    if (!supabaseReady || !supabase || !userId) return
    set({ isLoading: true })
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          gauntlet_active_run: false,
          current_target_gym: null,
          defeated_in_run: []
        })
        .eq("id", userId)

      if (error) throw error

      set({
        isActive: false,
        currentTargetGym: null,
        defeatedInRun: []
      })
    } catch (err) {
      console.error("[GauntletStore] Error al registrar fallo en Gauntlet:", err)
    } finally {
      set({ isLoading: false })
    }
  }
}))
