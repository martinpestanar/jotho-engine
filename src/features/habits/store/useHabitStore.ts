"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { supabase, supabaseReady } from "@/shared/lib/supabase/client"

export interface Habit {
  id: string
  name: string
  description: string
  frequency: "daily" | "weekly"
  pkdValue: number
  icon: string
  color: string
  isActive: boolean
}

interface HabitState {
  habits: Habit[]
  pendingRewards: number
  userId: string | null
  cloudSynced: boolean
  loading: boolean

  // ── Acciones ──────────────────────────────────────────────────
  setUserId: (id: string | null) => void
  setHabits: (habits: Habit[]) => void
  addHabit: (habit: Habit) => void
  toggleHabit: (id: string) => void
  removeHabit: (id: string) => void
  clearPendingRewards: () => void
  loadHabitsFromCloud: () => Promise<void>

  // ── Legacy no-ops (compatibilidad con código aún no migrado) ──
  /** @deprecated Usa useEconomyStore.modifySaldo en su lugar */
  setBalance: (amount: number) => void
  /** @deprecated El balance se sincroniza via Realtime en useEconomyStore */
  syncFromCloud: (pkdBalance: number) => void
  /** @deprecated Lee useEconomyStore.pkdBalance en su lugar */
  balance: number
}

export const useHabitStore = create<HabitState>()(
  persist(
    (set, get) => ({
      habits: [],
      pendingRewards: 0,
      userId: null,
      cloudSynced: false,
      loading: false,

      // Campo legacy — siempre 0, el saldo real está en useEconomyStore
      balance: 0,

      setUserId: (id) => set({ userId: id }),

      setHabits: (habits) => set({ habits }),

      addHabit: (habit) => {
        set((s) => ({ habits: [...s.habits, habit] }))

        // Sync to Supabase
        const uid = get().userId
        if (supabaseReady && supabase && uid) {
          ;(async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await (supabase.from("habits") as any)
              .insert({
                id: habit.id,
                user_id: uid,
                name: habit.name,
                description: habit.description,
                frequency: habit.frequency,
                pkd_value: habit.pkdValue,
                icon: habit.icon,
                color: habit.color,
                is_active: habit.isActive,
              })
            if (error) console.warn("Habit insert failed:", error.message)
          })()
        }
      },

      toggleHabit: (id) => {
        const habit = get().habits.find((h) => h.id === id)
        if (!habit) return

        const completing = habit.isActive
        const delta = completing ? habit.pkdValue : -habit.pkdValue

        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === id ? { ...h, isActive: !h.isActive } : h
          ),
          pendingRewards: state.pendingRewards + (completing ? 1 : 0),
          cloudSynced: false,
        }))

        // Delegar el cambio de saldo a useEconomyStore (fuente de verdad)
        if (delta !== 0) {
          import("@/store/useEconomyStore").then(({ useEconomyStore }) => {
            useEconomyStore.getState().modifySaldo(delta, "habit")
          })
        }
      },

      removeHabit: (id) => {
        set((s) => ({ habits: s.habits.filter((h) => h.id !== id) }))

        if (supabaseReady && supabase) {
          ;(async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await (supabase.from("habits") as any).delete().eq("id", id)
            if (error) console.warn("Habit delete failed:", error.message)
          })()
        }
      },

      clearPendingRewards: () => set({ pendingRewards: 0 }),

      // ── Legacy no-ops ──────────────────────────────────────────
      setBalance: (_amount) => {
        // No-op: el balance ahora vive en useEconomyStore
        // Mantenido para compatibilidad — no rompe código existente
      },
      syncFromCloud: (_pkdBalance) => {
        // No-op: useEconomyStore.subscribe() sincroniza via Realtime automáticamente
      },

      loadHabitsFromCloud: async () => {
        const uid = get().userId
        if (!supabaseReady || !supabase || !uid) return

        set({ loading: true })

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase
          .from("habits") as any)
          .select("*")
          .eq("user_id", uid)
          .order("created_at", { ascending: true })

        if (error) {
          console.warn("Load habits failed:", error.message)
          set({ loading: false })
          return
        }

        if (data && data.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const habits: Habit[] = data.map((row: any) => ({
            id: row.id,
            name: row.name,
            description: row.description ?? "",
            frequency: (row.frequency as "daily") ?? "daily",
            pkdValue: row.pkd_value ?? 10,
            icon: row.icon ?? "star",
            color: row.color ?? "amber",
            isActive: row.is_active ?? false,
          }))
          set({ habits, loading: false })
        }
      },
    }),
    { name: "johto-habits" }
  )
)
