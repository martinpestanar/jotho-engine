"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface Mision {
  id: string
  titulo: string
  tipo: "TEORICA" | "PRACTICA"
  descripcion: string
  rama: string
  recompensa_pkd: number
  recompensa_item: string | null
  pregunta_actual: number
  respuestas: number[]
  estado: "PENDIENTE" | "EN_REVISION" | "COMPLETADA"
}

const RANGOS = [
  { min: 0, titulo: "Novato de Silph" },
  { min: 1000, titulo: "Analista de Datos" },
  { min: 3000, titulo: "Desarrollador Nodo" },
  { min: 6000, titulo: "Ingeniero de Prompts" },
  { min: 10000, titulo: "Arquitecto Ether" },
]

export function obtenerRango(xp: number): string {
  let rango = RANGOS[0].titulo
  for (const r of RANGOS) { if (xp >= r.min) rango = r.titulo }
  return rango
}

export const PREGUNTAS_EJEMPLO = [
  { pregunta: "¿Qué formato de salida debe tener el nodo de IA generativa en n8n para compatibilidad downstream?", opciones: ["edited", "data", "output", "response"], correcta: 1 },
  { pregunta: "¿Cuál es el principal beneficio de usar webhooks en n8n?", opciones: ["Ejecución sincrónica", "Eventos en tiempo real", "Mayor seguridad", "Menos consumo de RAM"], correcta: 1 },
  { pregunta: "En un pipeline de IA, ¿qué hace un nodo 'Switch'?", opciones: ["Cambia el modelo de IA", "Enruta datos según condiciones", "Convierte JSON a XML", "Activa un webhook"], correcta: 1 },
  { pregunta: "¿Qué es un 'sticky' en n8n Canvas?", opciones: ["Un nodo que no se mueve", "Una nota visual fija", "Un conector permanente", "Un template bloqueado"], correcta: 1 },
  { pregunta: "¿Cuál es el límite de ejecución máximo por workflow en n8n Cloud?", opciones: ["100", "500", "2500", "Ilimitado"], correcta: 2 },
]

export const useLabStore = create<{
  rango_tecnico: string
  puntos_experiencia_lab: number
  misiones: Mision[]
  iniciarMision: (id: string) => void
  responderQuiz: (id: string, respuesta: number) => void
  enviarPractica: (id: string) => void
  reiniciarMision: (id: string) => void
}>()(
  persist(
    (set, get) => ({
      rango_tecnico: "Novato de Silph",
      puntos_experiencia_lab: 0,
      misiones: [
        {
          id: "m1",
          titulo: "El Pipeline de IA Generativa",
          tipo: "PRACTICA",
          descripcion: "El Oráculo Ingeniero necesita que construyas un flujo en n8n. El requerimiento estricto es que la salida binaria del nodo de IA generativa esté etiquetada obligatoriamente con el nombre 'data' y no como 'edited', para garantizar la compatibilidad downstream en el pipeline. Sube la captura de tu canvas y graba un audio explicando tu lógica de configuración.",
          rama: "Integración IA",
          recompensa_pkd: 5000000,
          recompensa_item: "Masterball",
          pregunta_actual: 0,
          respuestas: [],
          estado: "PENDIENTE",
        },
        {
          id: "m2",
          titulo: "Fundamentos de Automatización",
          tipo: "TEORICA",
          descripcion: "Demuestra tus conocimientos teóricos sobre automatización de procesos con n8n.",
          rama: "Lógica de Nodos",
          recompensa_pkd: 50000,
          recompensa_item: "Poción X2",
          pregunta_actual: 0,
          respuestas: [],
          estado: "PENDIENTE",
        },
      ],

      iniciarMision: (id) => {
        set((s) => ({
          misiones: s.misiones.map((m) => m.id === id && m.estado === "PENDIENTE" ? { ...m, estado: "EN_REVISION" as const, pregunta_actual: 0, respuestas: [] } : m),
        }))
      },

      responderQuiz: (id, respuesta) => {
        set((s) => {
          const m = s.misiones.find((x) => x.id === id)
          if (!m || m.tipo !== "TEORICA") return {}
          const nuevasResp = [...m.respuestas, respuesta]
          const nuevaPreg = m.pregunta_actual + 1
          const completada = nuevaPreg >= PREGUNTAS_EJEMPLO.length
          const correctas = nuevasResp.filter((r, i) => r === PREGUNTAS_EJEMPLO[i]?.correcta).length
          const xpGanada = completada ? Math.round((correctas / PREGUNTAS_EJEMPLO.length) * 5000) : 0
          return {
            puntos_experiencia_lab: s.puntos_experiencia_lab + xpGanada,
            rango_tecnico: obtenerRango(s.puntos_experiencia_lab + xpGanada),
            misiones: s.misiones.map((x) =>
              x.id === id
                ? { ...x, respuestas: nuevasResp, pregunta_actual: nuevaPreg, estado: (completada ? "COMPLETADA" : "EN_REVISION") as "COMPLETADA" | "EN_REVISION" }
                : x
            ),
          }
        })
      },

      enviarPractica: (id) => {
        set((s) => ({
          puntos_experiencia_lab: s.puntos_experiencia_lab + 3000,
          rango_tecnico: obtenerRango(s.puntos_experiencia_lab + 3000),
          misiones: s.misiones.map((m) => (m.id === id ? { ...m, estado: "EN_REVISION" as const } : m)),
        }))
      },

      reiniciarMision: (id) => {
        set((s) => ({
          misiones: s.misiones.map((m) => (m.id === id ? { ...m, estado: "PENDIENTE" as const, pregunta_actual: 0, respuestas: [] } : m)),
        }))
      },
    }),
    { name: "johto-lab-store" }
  )
)
