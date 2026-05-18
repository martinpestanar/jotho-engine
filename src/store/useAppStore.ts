"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

interface Empresa {
  ticker: string
  nombre: string
  region: string
  sector: string
  precioActual: number
  precioAnterior: number
  variacion24h: number
  ceoNombre: string
  spriteId: number
}

interface Mision {
  id: string
  titulo: string
  tipo: "TEORICA" | "PRACTICA"
  descripcion: string
  recompensa: string
}

const EMPRESAS_MOCK: Empresa[] = [
  { ticker: "SLPH", nombre: "Silph Co.", region: "Kanto", sector: "Tecnología", precioActual: 312.40, precioAnterior: 298.00, variacion24h: 4.83, ceoNombre: "Presidente Silph", spriteId: 474 },
  { ticker: "DVN", nombre: "Devon Corp.", region: "Hoenn", sector: "Tecnología", precioActual: 142.80, precioAnterior: 145.20, variacion24h: -1.65, ceoNombre: "Sr. Peñas", spriteId: 376 },
  { ticker: "MOOM", nombre: "Mu-Mu Farm", region: "Johto", sector: "Agricultura", precioActual: 67.30, precioAnterior: 63.10, variacion24h: 6.66, ceoNombre: "Granjero Baoba", spriteId: 241 },
  { ticker: "RCKT", nombre: "Rocket Game Corner", region: "Kanto", sector: "Entretenimiento", precioActual: 53.20, precioAnterior: 55.00, variacion24h: -3.27, ceoNombre: "Giovanni", spriteId: 150 },
  { ticker: "CINN", nombre: "Cinnabar Lab", region: "Kanto", sector: "Biotecnología", precioActual: 198.60, precioAnterior: 194.30, variacion24h: 2.21, ceoNombre: "Dr. Blaine", spriteId: 534 },
  { ticker: "KPOW", nombre: "Kanto Power", region: "Kanto", sector: "Energía", precioActual: 167.80, precioAnterior: 171.20, variacion24h: -1.99, ceoNombre: "Lt. Surge", spriteId: 386 },
  { ticker: "RADI", nombre: "Radio Goldenrod", region: "Johto", sector: "Medios", precioActual: 91.30, precioAnterior: 85.00, variacion24h: 7.41, ceoNombre: "DJ Mary", spriteId: 380 },
  { ticker: "KURT", nombre: "Artesanías Kurt", region: "Johto", sector: "Lujo", precioActual: 432.00, precioAnterior: 425.00, variacion24h: 1.65, ceoNombre: "Kurt", spriteId: 435 },
  { ticker: "MAUV", nombre: "Mauville Energy", region: "Hoenn", sector: "Energía", precioActual: 293.50, precioAnterior: 291.00, variacion24h: 0.86, ceoNombre: "Wattson", spriteId: 311 },
  { ticker: "WTHR", nombre: "Instituto Clima", region: "Hoenn", sector: "Tecnología", precioActual: 187.90, precioAnterior: 183.50, variacion24h: 2.40, ceoNombre: "Dr. Storm", spriteId: 351 },
]

interface AppState {
  hasCompletedDailyCheckIn: boolean
  hasCompletedOnboarding: boolean
  dailyPlayTimeRemaining: number
  lastResetDate: string | null

  empresas: Empresa[]
  tickActivo: boolean

  // Laboratorio
  laboratorio: { misiones: Mision[] }

  completeCheckIn: () => void
  completeOnboarding: () => void
  decrementPlayTime: (minutes: number) => void
  resetDailyIfNeeded: () => void
  autoTick: () => void
  detenerTick: () => void
  DEBUG_resetTime: () => void
}

function getToday() { return new Date().toDateString() }

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      hasCompletedDailyCheckIn: false,
      hasCompletedOnboarding: false,
      dailyPlayTimeRemaining: 600,
      lastResetDate: null,
      empresas: EMPRESAS_MOCK,
      tickActivo: false,

      laboratorio: {
        misiones: [
          {
            id: "lab1",
            titulo: "Pipeline de IA Generativa en n8n",
            tipo: "PRACTICA",
            descripcion: "Construye un flujo donde la salida del nodo de IA generativa sea formato binario. REQUISITO CRÍTICO: Debes etiquetar la salida obligatoriamente con el nombre 'data' y NUNCA como 'edited', para no romper la compatibilidad downstream de la plataforma. Sube tu canvas y graba tu explicación.",
            recompensa: "5,000,000 PKD",
          },
          {
            id: "lab2",
            titulo: "Fundamentos de Automatización",
            tipo: "TEORICA",
            descripcion: "Demuestra tus conocimientos sobre automatización de procesos con n8n. Aprueba el quiz técnico para desbloquear la siguiente misión.",
            recompensa: "50,000 PKD",
          },
        ],
      },

      completeCheckIn: () => set({ hasCompletedDailyCheckIn: true, lastResetDate: getToday() }),

      completeOnboarding: () => set({ hasCompletedOnboarding: true }),

      decrementPlayTime: (minutes) => set((s) => ({ dailyPlayTimeRemaining: Math.max(0, s.dailyPlayTimeRemaining - minutes) })),

      resetDailyIfNeeded: () => {
        if (get().lastResetDate !== getToday()) set({ hasCompletedDailyCheckIn: false, dailyPlayTimeRemaining: 600, lastResetDate: getToday() })
      },

      DEBUG_resetTime: () => set({ dailyPlayTimeRemaining: 600, hasCompletedDailyCheckIn: true }),


      autoTick: () => {
        if (get().tickActivo) return
        set({ tickActivo: true })
        setInterval(() => {
          set((s) => ({
            empresas: s.empresas.map((e) => {
              const delta = (Math.random() - 0.5) * e.precioActual * 0.012
              const nuevo = Math.round((e.precioActual + delta) * 100) / 100
              return { ...e, precioAnterior: e.precioActual, precioActual: nuevo, variacion24h: Math.round(((nuevo - e.precioActual) / e.precioActual) * 10000) / 100 }
            }),
          }))
        }, 4000)
      },

      detenerTick: () => set({ tickActivo: false }),
    }),
    { name: "johto-app-state" }
  )
)
