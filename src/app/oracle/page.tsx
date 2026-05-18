"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useAppStore } from "@/store/useAppStore"
import { useOracleStore } from "@/store/useOracleStore"
import { useEconomyStore } from "@/store/useEconomyStore"
import { 
  Sparkles, Brain, Music, Trash2, 
  Sun, Moon, Coffee, Briefcase, ChevronRight, 
  MessageSquare, User, Shield, Activity,
  Clock, Power, Edit3, Save, X, ListTodo, CheckCircle2, Circle, Plus, History, Play,
  Zap, Globe, Heart, Trophy, Flame, Gamepad2, Swords, Lock, Unlock, Calendar, AlertTriangle, FileText,
  Video, Share2, ExternalLink
} from "lucide-react"
import { supabase } from "@/shared/lib/supabase/client"
import OracleDrawer from "@/components/OracleDrawer"

// ================= CONSTANTS & THEMES =================

// Eliminamos SCHEDULE_BLOCKS estático para usar datos de Supabase

const N8N_CHALLENGES_POOL = [
  {
    title: "AI Voice Newsletter",
    description: "Transcribe podcasts en caliente y genera resúmenes leídos por voz artificial (ElevenLabs) enviados a WhatsApp."
  },
  {
    title: "Autopilot Content Syndicator",
    description: "Al subir un archivo a Google Drive, lo procesa con OpenAI, genera 3 copies diferentes y los programa en Buffer."
  },
  {
    title: "Lead Scraping & Enrichment Flow",
    description: "Captura menciones de X/Twitter, analiza sentimiento, extrae el perfil y lo añade enriquecido a Notion CRM."
  },
  {
    title: "GitHub Commit News",
    description: "Escucha cambios en un repositorio y escribe un changelog interactivo con memes de IA posteado en Discord."
  },
  {
    title: "Multi-Language Subtitler",
    description: "Toma un video de YouTube, genera subtítulos en 3 idiomas con Whisper y los empaqueta en carpetas separadas."
  },
  {
    title: "Personal Finance Bot",
    description: "Procesa tickets de compra escaneados de Telegram, extrae importes y categorías con GPT-4 Vision, y actualiza Supabase."
  },
  {
    title: "Auto-Edición de Clips",
    description: "Lee timestamps de video, invoca APIs de recorte y extrae los mejores clips de forma semi-automatizada."
  },
  {
    title: "Academia Quest Engine",
    description: "Genera exámenes automáticos de programación usando PDFs cargados en Notion y califica respuestas enviadas por correo."
  },
  {
    title: "Social Listening Alerts",
    description: "Monitorea subreddits de nicho y te avisa por Telegram con un análisis del pain-point principal del usuario."
  },
  {
    title: "LinkedIn Auto-Hook Generator",
    description: "Toma tus notas de voz en Telegram y las convierte en hilos atractivos de LinkedIn con alta tasa de gancho."
  },
  {
    title: "Smart Cloud Backup",
    description: "Sincroniza todas tus capturas y proyectos locales, les pone tags automáticos y los sube organizados a Google Drive."
  },
  {
    title: "AI Avatar Generator Pipeline",
    description: "Envía un selfi, ejecuta un pipeline de Stable Diffusion y actualiza tu avatar en tu portafolio personal."
  }
]

// ================= DECORATIVE COMPONENTS =================

const CardBackgroundEffect = ({ color }: { color: string }) => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03]">
    <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[100px] ${color}`} />
    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  </div>
)

// ================= WIDGET COMPONENTS =================

function ProtocolConsole({ theme: appTheme }: { theme: string }) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [blocks, setBlocks] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newTaskText, setNewTaskText] = useState("")
  const [activeInputBlock, setActiveInputBlock] = useState<string | null>(null)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editingTaskText, setEditingTaskText] = useState<string>("")
  const [expandedNoteTaskId, setExpandedNoteTaskId] = useState<string | null>(null)
  const [editingNotes, setEditingNotes] = useState<{ [key: string]: string }>({})
  const [lastSessionNotes, setLastSessionNotes] = useState<any[]>([])

  // FASE 2 & FASE 3: Estados para Modo Edición de Bloques
  const [isEditingBlocks, setIsEditingBlocks] = useState(false)
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null)
  const [editingBlockName, setEditingBlockName] = useState("")
  const [editingBlockStartTime, setEditingBlockStartTime] = useState("")
  const [editingBlockEndTime, setEditingBlockEndTime] = useState("")
  const [editingBlockCategory, setEditingBlockCategory] = useState("Bloque Trabajo")
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Estado para crear un nuevo bloque
  const [newBlockName, setNewBlockName] = useState("")
  const [newBlockStartTime, setNewBlockStartTime] = useState("08:00")
  const [newBlockEndTime, setNewBlockEndTime] = useState("09:00")
  const [newBlockCategory, setNewBlockCategory] = useState("Bloque Trabajo")
  const [showAddForm, setShowAddForm] = useState(false)

  // Estados para el Desafío Multimedia de 2 Días (Fase de Retos)
  const [activeChallenge, setActiveChallenge] = useState<any>(null)
  const [countdownText, setCountdownText] = useState<string>("")
  const [challengeGithubUrl, setChallengeGithubUrl] = useState("")
  const [challengeVideoUrl, setChallengeVideoUrl] = useState("")
  const [challengeNotes, setChallengeNotes] = useState("")

  // Estados para el Ciclo de 12 Desafíos Personalizados
  const [profileGameVars, setProfileGameVars] = useState<any>(null)
  const [isCycleModalOpen, setIsCycleModalOpen] = useState(false)
  const [cycleInputs, setCycleInputs] = useState<Array<{ title: string; description: string }>>(
    Array.from({ length: 12 }, () => ({ title: "", description: "" }))
  )

  // Estados para el Sistema Autónomo de Tiers (sin Oráculo)
  const [rewardModal, setRewardModal] = useState<{
    open: boolean;
    tier: number;
    pkd: number;
    rewardType: string | null;
    pct: number;
    isWeekend: boolean;
    alreadySealed: boolean;
    pendingRewardId?: string;
  } | null>(null)
  const [sealingDay, setSealingDay] = useState(false)
  const [emotionalNote, setEmotionalNote] = useState("")
  const [showEmotionalInput, setShowEmotionalInput] = useState(false)

  const fetchActiveChallenge = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('oracle_challenges')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_completed', false)
        .order('created_at', { ascending: false })
        .limit(1)

      if (data && data.length > 0) {
        setActiveChallenge(data[0])
        setChallengeGithubUrl(data[0].github_url || "")
        setChallengeVideoUrl(data[0].video_url || "")
        setChallengeNotes(data[0].notes || "")
      } else {
        setActiveChallenge(null)
      }
    } catch (err) {
      console.error("Error fetching active challenge:", err)
    }
  }

  const handlePreloadTemplates = () => {
    const preloaded = N8N_CHALLENGES_POOL.map(c => ({
      title: c.title,
      description: c.description
    }))
    // Rellenamos las 12 slots, si son menos rellenamos el resto con slots vacías
    const finalInputs = Array.from({ length: 12 }, (_, i) => {
      if (preloaded[i]) return preloaded[i]
      return { title: "", description: "" }
    })
    setCycleInputs(finalInputs)
  }

  const handleSaveCustomCycle = async () => {
    setActionLoading("save-custom-cycle")
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Validar que al menos ingresó títulos para todos
      const incomplete = cycleInputs.some((c, i) => !c.title.trim())
      if (incomplete) {
        alert("Por favor, completa el título de los 12 desafíos para sellar tu pacto.")
        return
      }

      const formattedChallenges = cycleInputs.map((c, i) => ({
        id: i + 1,
        title: c.title.trim(),
        description: c.description.trim() || "Sin descripción adicional.",
        used: false,
        completed: false
      }))

      const updatedCycle = {
        challenges: formattedChallenges,
        completed_count: 0,
        active: true
      }

      const currentVars = profileGameVars && typeof profileGameVars === 'object' ? { ...profileGameVars } : {}
      const updatedVars = {
        ...currentVars,
        oracle_custom_cycle: updatedCycle
      }

      const { error } = await supabase
        .from('profiles')
        .update({ game_vars: updatedVars })
        .eq('id', user.id)

      if (error) throw error

      setProfileGameVars(updatedVars)
      setIsCycleModalOpen(false)
      alert("¡CICLO DE 12 RETOS SELLADO EN SUPABASE! Que el honor y el código guíen tu espada, guerrero.")
    } catch (err) {
      console.error("Error saving custom cycle:", err)
      alert("Error al sellar el ciclo de retos.")
    } finally {
      setActionLoading(null)
    }
  }

  const handleResetCycle = async () => {
    if (!confirm("¿Deseas reiniciar y forjar un nuevo ciclo de 12 desafíos? El ciclo actual está completo y desbloqueado.")) return
    setActionLoading("reset-custom-cycle")
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const currentVars = profileGameVars && typeof profileGameVars === 'object' ? { ...profileGameVars } : {}
      
      const updatedVars = {
        ...currentVars,
        oracle_custom_cycle: null
      }

      const { error } = await supabase
        .from('profiles')
        .update({ game_vars: updatedVars })
        .eq('id', user.id)

      if (error) throw error

      setProfileGameVars(updatedVars)
      setCycleInputs(Array.from({ length: 12 }, () => ({ title: "", description: "" })))
      setActiveChallenge(null)
      alert("¡Protocolo de ciclo reseteado con éxito! Listo para forjar una nueva rutina.")
    } catch (err) {
      console.error("Error resetting custom cycle:", err)
      alert("Error al resetear el ciclo.")
    } finally {
      setActionLoading(null)
    }
  }

  const handleInvokeChallenge = async () => {
    setActionLoading("invoke-challenge")
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const cycle = profileGameVars?.oracle_custom_cycle
      if (!cycle || !cycle.active || !cycle.challenges) {
        alert("Primero debes configurar y activar tu ciclo de 12 desafíos.")
        return
      }

      const available = cycle.challenges.filter((c: any) => !c.used)
      if (available.length === 0) {
        alert("¡Has utilizado todos los desafíos de este ciclo! Completa las entregas pendientes o finaliza el ciclo.")
        return
      }

      // Sortear una de las ideas disponibles
      const randomIndex = Math.floor(Math.random() * available.length)
      const selectedIdea = available[randomIndex]

      const now = new Date()
      // Fecha límite: 48 horas (2 días exactos)
      const due = new Date(now.getTime() + 48 * 60 * 60 * 1000)

      const { data, error } = await supabase
        .from('oracle_challenges')
        .insert({
          user_id: user.id,
          title: selectedIdea.title,
          description: selectedIdea.description,
          idea_index: selectedIdea.id,
          due_at: due.toISOString()
        })
        .select()
        .single()

      if (error) throw error

      // Marcar como used en el perfil local y de Supabase
      const updatedChallenges = cycle.challenges.map((c: any) => 
        c.id === selectedIdea.id ? { ...c, used: true } : c
      )

      const updatedCycle = {
        ...cycle,
        challenges: updatedChallenges
      }

      const updatedVars = {
        ...profileGameVars,
        oracle_custom_cycle: updatedCycle
      }

      const { error: profError } = await supabase
        .from('profiles')
        .update({ game_vars: updatedVars })
        .eq('id', user.id)

      if (profError) throw profError

      setProfileGameVars(updatedVars)
      if (data) {
        setActiveChallenge(data)
        setChallengeGithubUrl("")
        setChallengeVideoUrl("")
        setChallengeNotes("")
      }
    } catch (err) {
      console.error("Error invoking challenge:", err)
      alert("Error al invocar un nuevo reto.")
    } finally {
      setActionLoading(null)
    }
  }

  const handleToggleChallengeStep = async (field: string, currentValue: boolean) => {
    if (!activeChallenge) return
    try {
      const { data, error } = await supabase
        .from('oracle_challenges')
        .update({ [field]: !currentValue })
        .eq('id', activeChallenge.id)
        .select()
        .single()

      if (error) throw error
      if (data) {
        setActiveChallenge(data)
      }
    } catch (err) {
      console.error("Error updating challenge step:", err)
    }
  }

  const handleSaveChallengeMeta = async () => {
    if (!activeChallenge) return
    setActionLoading("save-challenge-meta")
    try {
      const { data, error } = await supabase
        .from('oracle_challenges')
        .update({
          github_url: challengeGithubUrl,
          video_url: challengeVideoUrl,
          notes: challengeNotes
        })
        .eq('id', activeChallenge.id)
        .select()
        .single()

      if (error) throw error
      if (data) {
        setActiveChallenge(data)
        alert("¡Enlaces y notas del reto guardados exitosamente!")
      }
    } catch (err) {
      console.error("Error saving challenge metadata:", err)
      alert("Error al guardar enlaces del reto.")
    } finally {
      setActionLoading(null)
    }
  }

  const handleCompleteChallenge = async () => {
    if (!activeChallenge) return
    setActionLoading("complete-challenge")
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const cycle = profileGameVars?.oracle_custom_cycle
      if (!cycle || !cycle.active) {
        alert("No hay un ciclo activo en tu perfil.")
        return
      }

      // 1. Completar la entidad física oracle_challenges
      const { data: completedChallenge, error: compErr } = await supabase
        .from('oracle_challenges')
        .update({ is_completed: true })
        .eq('id', activeChallenge.id)
        .select()
        .single()

      if (compErr) throw compErr

      // 2. Marcar en la lista de retos del ciclo personalizado
      const targetChallengeId = activeChallenge.idea_index
      const updatedChallenges = cycle.challenges.map((c: any) => 
        c.id === targetChallengeId ? { ...c, completed: true } : c
      )

      const nextCompletedCount = (cycle.completed_count || 0) + 1

      const updatedCycle = {
        ...cycle,
        challenges: updatedChallenges,
        completed_count: nextCompletedCount
      }

      const updatedVars = {
        ...profileGameVars,
        oracle_custom_cycle: updatedCycle
      }

      const { error: profError } = await supabase
        .from('profiles')
        .update({ game_vars: updatedVars })
        .eq('id', user.id)

      if (profError) throw profError

      setProfileGameVars(updatedVars)
      setActiveChallenge(null)

      // 3. Evaluar hitos ceremoniales y economía
      if (nextCompletedCount === 6) {
        alert("🏆 ¡CAMINO DE MITAD DEL GUERRERO CUMPLIDO! Has completado 6 retos de 12. La gloria y la consistencia te esperan a la vuelta. ¡Sigue vibecodeando con valentía!")
      } else if (nextCompletedCount === 12) {
        // Otorgar bonificación de economía
        alert("👑 ¡HAZ TRASCENDIDO EL ORÁCULO! 12 desafíos completados al 100%. Has forjado tu código y tu audiencia a lo largo de 24 días. Se te otorgan 500 PKD como tributo imperial de honor.")
        
        // Registrar en useEconomyStore para asegurar la Centralized Economy Rule
        const newBalance = await useEconomyStore.getState().modifySaldo(500, "oracle_cycle")
        if (newBalance) {
          console.info(`[Oracle] Balance actualizado en useEconomyStore: ${newBalance} PKD`)
        }
      } else {
        alert(`¡ENHORABUENA GUERRERO! Desafío multimedia completado al 100%. Reto #${nextCompletedCount} sellado de por vida. ¡Has forjado tu código y tu audiencia!`)
      }
    } catch (err) {
      console.error("Error completing challenge:", err)
      alert("Error al completar el reto.")
    } finally {
      setActionLoading(null)
    }
  }

  const handleCreateBlock = async () => {
    if (!newBlockName.trim() || !newBlockStartTime || !newBlockEndTime) return
    setActionLoading("create-block")
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const today = new Date()
      const dayIndex = today.getDay()

      // Convertir hora del formato HH:MM a HH:MM:SS para Supabase
      const formattedStart = newBlockStartTime.length === 5 ? `${newBlockStartTime}:00` : newBlockStartTime
      const formattedEnd = newBlockEndTime.length === 5 ? `${newBlockEndTime}:00` : newBlockEndTime

      const { data, error } = await supabase
        .from('schedule_blocks')
        .insert({
          user_id: user.id,
          activity_name: newBlockName,
          start_time: formattedStart,
          end_time: formattedEnd,
          category: newBlockCategory,
          day_of_week: dayIndex
        })
        .select()
        .single()

      if (error) throw error

      if (data) {
        setBlocks(prev => [...prev, data].sort((a, b) => a.start_time.localeCompare(b.start_time)))
        setNewBlockName("")
        setShowAddForm(false)
      }
    } catch (err) {
      console.error("Error creating block:", err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleSaveBlockEdit = async (blockId: string) => {
    if (!editingBlockName.trim() || !editingBlockStartTime || !editingBlockEndTime) return
    setActionLoading(`save-${blockId}`)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const originalBlock = blocks.find(b => b.id === blockId)
      if (!originalBlock) return

      const formattedStart = editingBlockStartTime.length === 5 ? `${editingBlockStartTime}:00` : editingBlockStartTime
      const formattedEnd = editingBlockEndTime.length === 5 ? `${editingBlockEndTime}:00` : editingBlockEndTime

      // 1. Actualizar bloque en schedule_blocks
      const { error: blockErr } = await supabase
        .from('schedule_blocks')
        .update({
          activity_name: editingBlockName,
          start_time: formattedStart,
          end_time: formattedEnd,
          category: editingBlockCategory
        })
        .eq('id', blockId)

      if (blockErr) throw blockErr

      // 2. Si el nombre de la actividad cambió, actualizar todas las tareas en schedule_tasks en cascada
      if (originalBlock.activity_name !== editingBlockName) {
        await supabase
          .from('schedule_tasks')
          .update({ activity_name: editingBlockName })
          .eq('user_id', user.id)
          .eq('activity_name', originalBlock.activity_name)

        // Actualizar estado local de tareas
        setTasks(prev => prev.map(t => t.activity_name === originalBlock.activity_name ? { ...t, activity_name: editingBlockName } : t))
      }

      // Actualizar estado local de bloques
      setBlocks(prev => prev.map(b => b.id === blockId ? {
        ...b,
        activity_name: editingBlockName,
        start_time: formattedStart,
        end_time: formattedEnd,
        category: editingBlockCategory
      } : b).sort((a, b) => a.start_time.localeCompare(b.start_time)))

      setEditingBlockId(null)
    } catch (err) {
      console.error("Error updating block:", err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteBlock = async (blockId: string, activityName: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar permanentemente el bloque "${activityName}"?`)) return
    setActionLoading(`delete-${blockId}`)
    try {
      const { error } = await supabase
        .from('schedule_blocks')
        .delete()
        .eq('id', blockId)

      if (error) throw error

      setBlocks(prev => prev.filter(b => b.id !== blockId))
      
      const dateStr = new Date().toISOString().split('T')[0]
      await supabase.from('schedule_checkins')
        .delete()
        .eq('date', dateStr)
        .eq('block_id', blockId)

    } catch (err) {
      console.error("Error deleting block:", err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleMoveBlock = async (blockId: string, direction: 'up' | 'down') => {
    setActionLoading(`move-${blockId}`)
    try {
      const sorted = [...blocks].sort((a, b) => a.start_time.localeCompare(b.start_time))
      const index = sorted.findIndex(b => b.id === blockId)
      if (index === -1) return

      let targetIndex = -1
      if (direction === 'up' && index > 0) targetIndex = index - 1
      if (direction === 'down' && index < sorted.length - 1) targetIndex = index + 1

      if (targetIndex !== -1) {
        const currentBlock = sorted[index]
        const targetBlock = sorted[targetIndex]

        // Intercambiar start_time y end_time
        const tempStart = currentBlock.start_time
        const tempEnd = currentBlock.end_time

        const { error: err1 } = await supabase
          .from('schedule_blocks')
          .update({
            start_time: targetBlock.start_time,
            end_time: targetBlock.end_time
          })
          .eq('id', currentBlock.id)

        const { error: err2 } = await supabase
          .from('schedule_blocks')
          .update({
            start_time: tempStart,
            end_time: tempEnd
          })
          .eq('id', targetBlock.id)

        if (err1 || err2) throw new Error(err1?.message || err2?.message)

        // Actualizar localmente el estado de bloques
        setBlocks(prev => prev.map(b => {
          if (b.id === currentBlock.id) {
            return { ...b, start_time: targetBlock.start_time, end_time: targetBlock.end_time }
          }
          if (b.id === targetBlock.id) {
            return { ...b, start_time: tempStart, end_time: tempEnd }
          }
          return b
        }).sort((a, b) => a.start_time.localeCompare(b.start_time)))
      }
    } catch (err) {
      console.error("Error moving block:", err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleMakeBlockUniversal = async (block: any) => {
    setActionLoading(`universal-${block.id}`)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const targetDays = [1, 2, 3, 4, 5] // Lunes a Viernes
      const inserts = []

      for (const day of targetDays) {
        if (day === block.day_of_week) continue

        // 1. Eliminar bloque con el mismo nombre en el día destino para evitar duplicaciones
        await supabase
          .from('schedule_blocks')
          .delete()
          .eq('user_id', user.id)
          .eq('day_of_week', day)
          .eq('activity_name', block.activity_name)

        // 2. Preparar el insert
        inserts.push({
          user_id: user.id,
          activity_name: block.activity_name,
          start_time: block.start_time,
          end_time: block.end_time,
          category: block.category,
          day_of_week: day
        })
      }

      if (inserts.length > 0) {
        const { error } = await supabase
          .from('schedule_blocks')
          .insert(inserts)

        if (error) throw error
        alert(`¡El bloque "${block.activity_name}" ahora se ejecutará de Lunes a Viernes de forma recurrente!`)
      }
    } catch (err) {
      console.error("Error making block universal:", err)
      alert("Error al propagar el bloque de forma universal.")
    } finally {
      setActionLoading(null)
    }
  }

  const handleCloneDayToWeek = async () => {
    const today = new Date()
    const originDay = today.getDay()
    const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
    
    if (blocks.length === 0) {
      alert("No hay bloques en el día seleccionado para clonar.")
      return
    }

    if (!confirm(`¿Estás seguro de que deseas clonar la rutina completa de ${dayNames[originDay]} a todos los días laborables (Lunes a Viernes)? Se sobrescribirán las rutinas existentes de esos días.`)) {
      return
    }

    setActionLoading("clone-week")
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const targetDays = [1, 2, 3, 4, 5] // Lunes a Viernes
      const inserts: any[] = []

      // 1. Eliminar bloques en los días destino
      for (const day of targetDays) {
        if (day === originDay) continue
        
        await supabase
          .from('schedule_blocks')
          .delete()
          .eq('user_id', user.id)
          .eq('day_of_week', day)
      }

      // 2. Preparar inserts para los días destino
      for (const day of targetDays) {
        if (day === originDay) continue

        blocks.forEach(b => {
          inserts.push({
            user_id: user.id,
            activity_name: b.activity_name,
            start_time: b.start_time,
            end_time: b.end_time,
            category: b.category,
            day_of_week: day
          })
        })
      }

      if (inserts.length > 0) {
        const { error } = await supabase
          .from('schedule_blocks')
          .insert(inserts)

        if (error) throw error
        alert("¡Rutina clonada de Lunes a Viernes exitosamente!")
      }
    } catch (err) {
      console.error("Error cloning day to week:", err)
      alert("Error al clonar la rutina a la semana.")
    } finally {
      setActionLoading(null)
    }
  }

  // ====== SELLAR DÍA: llama fn_registrar_dia y muestra RewardModal ======
  const handleSealDay = async () => {
    setSealingDay(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const today = new Date().toISOString().split('T')[0]
      const result = await supabase.rpc('fn_registrar_dia', {
        p_user_id: user.id,
        p_date: today,
        p_horarios_pct: performancePactData.completionRate,
        p_contenido_count: 0,
        p_demon_roto: false,
        p_emotional_note: emotionalNote
      })

      if (result.error) throw result.error

      const res = result.data as any

      // Si fue Tier 2, otorgar Pokémon aleatorio desde master_pokemon
      let pendingRewardId: string | undefined
      if (res.reward_type === 'pokemon' && !res.already_sealed) {
        const { data: pkPool } = await supabase
          .from('master_pokemon')
          .select('id')
          .order('id_interno_gba', { ascending: true })
          .limit(200)
        if (pkPool && pkPool.length > 0) {
          const pick = pkPool[Math.floor(Math.random() * pkPool.length)]
          const { data: qRow } = await supabase
            .from('reward_queue')
            .select('id')
            .eq('user_id', user.id)
            .eq('is_claimed', false)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
          if (qRow) {
            await supabase.from('reward_queue')
              .update({ payload: { ...qRow, pokemon_id: pick.id } })
              .eq('id', qRow.id)
            pendingRewardId = qRow.id
          }
        }
      }

      setRewardModal({
        open: true,
        tier: res.tier,
        pkd: res.pkd,
        rewardType: res.reward_type,
        pct: res.score,
        isWeekend: res.is_weekend,
        alreadySealed: res.already_sealed,
        pendingRewardId
      })
      setEmotionalNote("")
      setShowEmotionalInput(false)
    } catch (err) {
      console.error('Error al sellar el día:', err)
    } finally {
      setSealingDay(false)
    }
  }

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const today = new Date()
      // Usamos el día actual del sistema
      const dayIndex = today.getDay()
      const dateStr = today.toISOString().split('T')[0]

      // Cargar perfil para game_vars
      const { data: profileData } = await supabase
        .from('profiles')
        .select('game_vars')
        .eq('id', user.id)
        .single()
      
      if (profileData && profileData.game_vars) {
        setProfileGameVars(profileData.game_vars)
      }

      // 1. Cargar bloques reales del día activo
      const { data: blocksData } = await supabase
        .from('schedule_blocks')
        .select('*')
        .eq('user_id', user.id)
        .eq('day_of_week', dayIndex)
        .order('start_time', { ascending: true })

      // 2. Cargar tareas (incluyendo pendientes del pasado)
      const { data: tasksData } = await supabase
        .from('schedule_tasks')
        .select('*')
        .eq('user_id', user.id)
        .or(`is_completed.eq.false,date.eq.${dateStr}`)
        .order('created_at', { ascending: true })

      // Rollover táctico: arrastra sub-misiones pendientes al día actual en la BD
      if (tasksData && tasksData.length > 0) {
        const incompletePastTasks = tasksData.filter(t => !t.is_completed && t.date !== dateStr)
        if (incompletePastTasks.length > 0) {
          const idsToUpdate = incompletePastTasks.map(t => t.id)
          await supabase
            .from('schedule_tasks')
            .update({ date: dateStr })
            .in('id', idsToUpdate)
          
          tasksData.forEach(t => {
            if (!t.is_completed && t.date !== dateStr) {
              t.date = dateStr
            }
          })
        }
      }

      // 3. Cargar Eco de Sesiones Anteriores (tareas completadas del pasado con notas)
      const { data: pastCompletedData } = await supabase
        .from('schedule_tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_completed', true)
        .neq('note', '')
        .order('completed_at', { ascending: false })
        .limit(20)

      if (pastCompletedData) setLastSessionNotes(pastCompletedData)

      if (blocksData) setBlocks(blocksData)
      if (tasksData) setTasks(tasksData)

      // Cargar reto multimedia activo
      await fetchActiveChallenge()
    } catch (err) {
      console.error("Error loading Oracle data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  // Control dinámico de fondo para evitar problemas de styled-jsx
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.style.backgroundColor = 
        appTheme === 'dark' ? '#0B0F1A' : appTheme === 'solarized' ? '#FFF7ED' : '#F8FAFC';
    }
  }, [appTheme])

  // Temporizador en vivo para el Desafío de 2 Días
  useEffect(() => {
    if (!activeChallenge) {
      setCountdownText("")
      return
    }

    const updateCountdown = () => {
      const now = new Date().getTime()
      const due = new Date(activeChallenge.due_at).getTime()
      const diff = due - now

      if (diff <= 0) {
        setCountdownText("⚠️ ¡TIEMPO EXPIRADO! Entrega el reto para forjar el siguiente.")
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      
      setCountdownText(`⏱️ Quedan ${hours}h ${minutes}m para entregar`)
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 60000)
    return () => clearInterval(interval)
  }, [activeChallenge])

  const currentHour = currentTime.getHours()
  const activeBlockId = useMemo(() => {
    if (blocks.length === 0) return null
    const active = [...blocks].reverse().find(b => {
      const blockHour = parseInt(b.start_time.split(':')[0])
      return currentHour >= blockHour
    })
    return active?.id || blocks[0].id
  }, [currentHour, blocks])

  const syncBlockCompletion = async (activityName: string, currentTasks: any[], blocksList: any[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const block = blocksList.find(b => b.activity_name === activityName)
      if (!block) return

      const dateStr = new Date().toISOString().split('T')[0]
      const blockTasks = currentTasks.filter(t => t.activity_name === activityName)
      
      const isCompleted = blockTasks.length > 0 && blockTasks.every(t => t.is_completed)

      if (isCompleted) {
        await supabase.from('schedule_checkins').upsert({
          user_id: user.id,
          date: dateStr,
          block_id: block.id,
          is_completed: true,
          completed_at: new Date().toISOString()
        }, { onConflict: 'user_id,date,block_id' })
      } else {
        await supabase.from('schedule_checkins')
          .delete()
          .eq('user_id', user.id)
          .eq('date', dateStr)
          .eq('block_id', block.id)
      }
    } catch (err) {
      console.error("Error syncing block completion:", err)
    }
  }

  const handleAddTask = async (activityName: string) => {
    if (!newTaskText.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('schedule_tasks')
      .insert({
        user_id: user.id,
        activity_name: activityName,
        task_text: newTaskText,
        date: new Date().toISOString().split('T')[0],
        original_date: new Date().toISOString().split('T')[0]
      })
      .select()
      .single()

    if (data) {
      const updatedTasks = [...tasks, data]
      setTasks(updatedTasks)
      setNewTaskText("")
      setActiveInputBlock(null)
      await syncBlockCompletion(activityName, updatedTasks, blocks)
    }
  }

  const toggleTask = async (taskId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus
    const { error } = await supabase
      .from('schedule_tasks')
      .update({ 
        is_completed: newStatus,
        completed_at: newStatus ? new Date().toISOString() : null
      })
      .eq('id', taskId)

    if (!error) {
      const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, is_completed: newStatus } : t)
      setTasks(updatedTasks)
      
      const task = tasks.find(t => t.id === taskId)
      if (task) {
        await syncBlockCompletion(task.activity_name, updatedTasks, blocks)
      }
    }
  }

  const deleteTask = async (taskId: string) => {
    const { error } = await supabase.from('schedule_tasks').delete().eq('id', taskId)
    if (!error) {
      const taskToDelete = tasks.find(t => t.id === taskId)
      const updatedTasks = tasks.filter(t => t.id !== taskId)
      setTasks(updatedTasks)
      
      if (taskToDelete) {
        await syncBlockCompletion(taskToDelete.activity_name, updatedTasks, blocks)
      }
    }
  }

  const handleSaveEdit = async (taskId: string) => {
    if (!editingTaskText.trim()) return
    const { error } = await supabase
      .from('schedule_tasks')
      .update({ task_text: editingTaskText })
      .eq('id', taskId)

    if (!error) {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, task_text: editingTaskText } : t))
      setEditingTaskId(null)
    }
  }

  const handleSaveNote = async (taskId: string, noteText: string) => {
    const { error } = await supabase
      .from('schedule_tasks')
      .update({ note: noteText })
      .eq('id', taskId)

    if (!error) {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, note: noteText } : t))
      setLastSessionNotes(prev => prev.map(t => t.id === taskId ? { ...t, note: noteText } : t))
      setExpandedNoteTaskId(null)
    }
  }

  // Fase 1: Cálculos dinámicos del Pacto de Rendimiento
  const performancePactData = useMemo(() => {
    const today = new Date()
    const activeDay = today.getDay()
    const isWeekend = activeDay === 0 || activeDay === 6
    const targetPercentage = isWeekend ? 20 : 80

    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.is_completed).length
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    const isGoalAchieved = completionRate >= targetPercentage

    return {
      isWeekend,
      targetPercentage,
      totalTasks,
      completedTasks,
      completionRate,
      isGoalAchieved
    }
  }, [tasks])

  const challengeProgress = useMemo(() => {
    if (!activeChallenge) return 0
    let score = 0
    if (activeChallenge.n8n_completed) score += 1
    if (activeChallenge.recording_completed) score += 1
    if (activeChallenge.youtube_completed) score += 1
    if (activeChallenge.tiktok_completed) score += 1
    if (activeChallenge.linkedin_completed) score += 1
    if (activeChallenge.github_completed) score += 1
    if (activeChallenge.social_completed) score += 1
    return Math.round((score / 7) * 100)
  }, [activeChallenge])

  if (loading) return (
    <div className="h-96 flex flex-col items-center justify-center gap-4 opacity-50">
      <Zap className="w-10 h-10 animate-pulse text-cyan-500" />
      <span className="text-xs font-black uppercase tracking-[0.5em]">Synchronizing Protocol...</span>
    </div>
  )

  return (
    <div className="w-full flex flex-col gap-10">
      {/* Header Console */}
      <div className="flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="w-5 h-5 text-cyan-500">
            <Zap className="w-full h-full fill-current" />
          </motion.div>
          <h3 className="text-sm font-black uppercase tracking-[0.4em] text-cyan-500">System Execution Interface</h3>
        </div>
        <div className={`px-6 py-2 rounded-full text-sm font-black uppercase tracking-[0.2em] ${appTheme === "dark" ? "bg-white/5 text-slate-400 border border-white/5" : "bg-white text-slate-500 shadow-lg border border-slate-100"}`}>
          {currentTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* ================= FASE 1: WIDGET PACTO DE RENDIMIENTO DINÁMICO ================= */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`mx-6 p-8 md:p-10 rounded-[3rem] border-2 shadow-2xl relative overflow-hidden transition-all duration-500 ${
          performancePactData.isWeekend
            ? performancePactData.isGoalAchieved
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 shadow-emerald-500/[0.03]"
              : "bg-amber-500/5 border-amber-500/20 text-amber-300 shadow-amber-500/[0.02]"
            : performancePactData.isGoalAchieved
              ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-300 shadow-cyan-500/[0.03]"
              : "bg-rose-500/5 border-rose-500/20 text-rose-300 shadow-rose-500/[0.02]"
        }`}
      >
        {/* Glow Effects */}
        <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-20 pointer-events-none ${
          performancePactData.isWeekend
            ? performancePactData.isGoalAchieved ? "bg-emerald-400" : "bg-amber-400"
            : performancePactData.isGoalAchieved ? "bg-cyan-400" : "bg-rose-400"
        }`} />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className={`w-16 h-16 rounded-[2rem] border-2 flex items-center justify-center animate-pulse flex-shrink-0 ${
              performancePactData.isWeekend
                ? performancePactData.isGoalAchieved ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" : "bg-amber-500/20 border-amber-500/40 text-amber-400"
                : performancePactData.isGoalAchieved ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-400" : "bg-rose-500/20 border-rose-500/40 text-rose-400"
            }`}>
              <Trophy className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">
                  Pacto del Guerrero
                </span>
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                  performancePactData.isWeekend
                    ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
                    : "text-cyan-400 border-cyan-500/30 bg-cyan-500/10"
                }`}>
                  {performancePactData.isWeekend ? "Modo Regeneración" : "Enfoque Absoluto"}
                </span>
              </div>
              <h3 className="text-2xl md:text-3xl font-[1000] uppercase italic tracking-tighter leading-tight mb-2">
                {performancePactData.isWeekend
                  ? performancePactData.isGoalAchieved ? "Santuario de Gracia Asegurado" : "Descanso Consciente de Marty"
                  : performancePactData.isGoalAchieved ? "Pacto del Templo de Acero Sellado" : "Forjando el Templo de Acero"
                }
              </h3>
              <p className="text-xs font-bold opacity-80 uppercase tracking-wide leading-relaxed">
                {performancePactData.isWeekend
                  ? performancePactData.isGoalAchieved
                    ? "Has alcanzado la meta de autocuidado sugerida para hoy. Tu espíritu está listo para la semana."
                    : `Completa al menos el ${performancePactData.targetPercentage}% de actividades para sellar tu racha dominical de honor.`
                  : performancePactData.isGoalAchieved
                    ? `¡Sublime! Nivel de disciplina excepcional alcanzado (${performancePactData.completionRate}% completado).`
                    : `Estás batallando por tu disciplina diaria. Meta mínima requerida: ${performancePactData.targetPercentage}%. ¡No cedas ante la mente!`
                }
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center md:items-end gap-3 flex-shrink-0 w-full md:w-auto">
            <div className="flex items-baseline gap-1">
              <span className="text-6xl font-[1000] italic leading-none tracking-tighter">
                {performancePactData.completionRate}%
              </span>
              <span className="text-xs font-black opacity-50 uppercase tracking-wider">
                / {performancePactData.targetPercentage}% Meta
              </span>
            </div>
            
            {/* Cápsula de progreso premium */}
            <div className="w-full md:w-48 h-3.5 bg-slate-500/10 rounded-full overflow-hidden border border-white/5 relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(performancePactData.completionRate, 100)}%` }}
                className={`h-full shadow-[0_0_15px_rgba(255,255,255,0.1)] rounded-full ${
                  performancePactData.isWeekend
                    ? performancePactData.isGoalAchieved ? "bg-emerald-500" : "bg-amber-500"
                    : performancePactData.isGoalAchieved ? "bg-cyan-500" : "bg-rose-500"
                }`}
              />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
              {performancePactData.completedTasks} de {performancePactData.totalTasks} tareas completadas
            </span>

            {/* ⚔️ BOTÓN SELLAR DÍA */}
            <div className="w-full flex flex-col gap-2">
              <AnimatePresence>
                {showEmotionalInput && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <input
                      type="text"
                      placeholder="Nota emocional del día (opcional)..."
                      value={emotionalNote}
                      onChange={(e) => setEmotionalNote(e.target.value)}
                      className="w-full bg-black/40 text-[11px] font-semibold text-slate-300 px-4 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-cyan-500 placeholder:text-slate-600"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowEmotionalInput(!showEmotionalInput)}
                  className="px-3 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all text-[10px] cursor-pointer"
                  title="Añadir nota emocional"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
                <button
                  onClick={handleSealDay}
                  disabled={sealingDay}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all cursor-pointer shadow-lg ${
                    performancePactData.isGoalAchieved
                      ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-cyan-500/30 hover:scale-[1.02] active:scale-[0.98]'
                      : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  {sealingDay
                    ? <><Zap className="w-4 h-4 animate-spin" /><span>Calculando...</span></>
                    : <><Shield className="w-4 h-4" /><span>⚔️ Sellar Día</span></>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ====== REWARD MODAL ====== */}
      <AnimatePresence>
        {rewardModal?.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 40 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className={`relative w-full max-w-sm rounded-[2.5rem] p-8 md:p-10 shadow-2xl border-2 text-center ${
                rewardModal.tier === 2
                  ? 'bg-[#070b15] border-cyan-500/40 shadow-cyan-500/20'
                  : rewardModal.tier === 1
                  ? 'bg-[#0d0a00] border-amber-500/40 shadow-amber-500/20'
                  : 'bg-[#0a0a0a] border-slate-600/30'
              }`}
            >
              {/* Glow */}
              <div className={`absolute inset-0 rounded-[2.5rem] blur-[60px] opacity-10 pointer-events-none ${
                rewardModal.tier === 2 ? 'bg-cyan-400' : rewardModal.tier === 1 ? 'bg-amber-400' : 'bg-slate-400'
              }`} />

              {/* Icon */}
              <div className={`relative mx-auto w-20 h-20 rounded-[2rem] flex items-center justify-center text-5xl mb-6 border-2 ${
                rewardModal.tier === 2
                  ? 'bg-cyan-500/10 border-cyan-500/30'
                  : rewardModal.tier === 1
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : 'bg-slate-500/10 border-slate-500/20'
              }`}>
                {rewardModal.tier === 2 ? '🏆' : rewardModal.tier === 1 ? '⚡' : '⚔️'}
              </div>

              {/* Title */}
              <div className={`text-[10px] font-black uppercase tracking-[0.3em] mb-2 ${
                rewardModal.tier === 2 ? 'text-cyan-400' : rewardModal.tier === 1 ? 'text-amber-400' : 'text-slate-500'
              }`}>
                {rewardModal.alreadySealed ? 'Día Ya Sellado' : rewardModal.isWeekend ? 'Modo Regeneración' : 'Evaluación del Guerrero'}
              </div>

              <h2 className="text-2xl font-[1000] italic uppercase tracking-tighter leading-tight text-white mb-1">
                {rewardModal.alreadySealed
                  ? 'Ya sellaste hoy'
                  : rewardModal.tier === 2
                  ? '🌟 TIER 2 — ÉLITE'
                  : rewardModal.tier === 1
                  ? '⚡ TIER 1 — GUERRERO'
                  : '😤 SIN TIER — FORJA MÁS'}
              </h2>

              <p className="text-xs text-slate-400 font-bold uppercase tracking-wide mb-6">
                {rewardModal.alreadySealed
                  ? 'El día ya fue registrado anteriormente. Los PKD y recompensas no se duplican.'
                  : rewardModal.tier === 0
                  ? 'No alcanzaste el mínimo de hoy. Mañana es una nueva batalla.'
                  : `Completaste el ${performancePactData.completionRate}% de tu protocolo diario.`}
              </p>

              {/* Rewards */}
              {!rewardModal.alreadySealed && rewardModal.tier > 0 && (
                <div className="space-y-3 mb-6">
                  <div className={`flex items-center justify-between px-4 py-3 rounded-2xl border ${
                    rewardModal.tier === 2 ? 'bg-cyan-500/5 border-cyan-500/20' : 'bg-amber-500/5 border-amber-500/20'
                  }`}>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">PKD Ganados</span>
                    <span className={`text-xl font-[1000] ${
                      rewardModal.tier === 2 ? 'text-cyan-400' : 'text-amber-400'
                    }`}>+{rewardModal.pkd} PKD</span>
                  </div>
                  <div className={`flex items-center justify-between px-4 py-3 rounded-2xl border ${
                    rewardModal.tier === 2 ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-amber-500/5 border-amber-500/20'
                  }`}>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recompensa</span>
                    <span className="text-sm font-black text-slate-200">
                      {rewardModal.rewardType === 'pokemon' ? '🎯 Pokémon Aleatorio' : '📦 Ítem de Tienda'}
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={() => setRewardModal(null)}
                className={`w-full py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                  rewardModal.tier === 2
                    ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-xl shadow-cyan-500/30'
                    : rewardModal.tier === 1
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-xl shadow-amber-500/30'
                    : 'bg-white/10 border border-white/10 text-slate-300'
                }`}
              >
                {rewardModal.tier === 0 ? 'Entendido — Mañana Más' : '¡Reclamar Recompensa!'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= DESAFÍO MULTIMEDIA DEL ORÁCULO (2 DÍAS) ================= */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className={`mx-6 p-8 md:p-10 rounded-[3rem] border relative overflow-hidden transition-all shadow-2xl ${
          appTheme === 'dark' ? 'bg-slate-900/40 border-white/5' : appTheme === 'solarized' ? 'bg-orange-50/80 border-orange-200' : 'bg-white border-slate-100'
        }`}
      >
        <CardBackgroundEffect color="bg-indigo-500" />
        
        {/* LÓGICA DE RENDERIZACIÓN SEGÚN EL CICLO PERSONALIZADO */}
        {!profileGameVars?.oracle_custom_cycle?.active ? (
          // 1. ESTADO DE CICLO INACTIVO - Mística de la Espada Sellada
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-[2rem] bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 flex-shrink-0">
                <Brain className="w-8 h-8 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Canal de Contenidos del Guerrero</span>
                <h3 className={`text-xl font-[1000] uppercase tracking-tighter mt-1 ${appTheme === 'dark' ? 'text-slate-100' : appTheme === 'solarized' ? 'text-orange-950' : 'text-slate-800'}`}>Desafío Multimedia de 2 Días</h3>
                <p className={`text-xs font-bold max-w-xl uppercase tracking-wide leading-relaxed mt-2 text-justify ${appTheme === 'dark' ? 'text-slate-400' : appTheme === 'solarized' ? 'text-orange-800/80' : 'text-slate-500'}`}>
                  Cada 2 días puedes invocar un reto de automatización n8n. Deberás construirlo, grabarte vibecodeando, editar versiones cortas y largas, y publicar tu victoria en GitHub y redes sociales.
                </p>
                <div className={`mt-3 p-4 rounded-2xl border flex items-center gap-3 ${appTheme === 'dark' ? 'bg-black/40 border-white/5' : appTheme === 'solarized' ? 'bg-orange-100/50 border-orange-200' : 'bg-slate-50 border-slate-200'}`}>
                  <AlertTriangle className="w-4 h-4 text-amber-500 animate-bounce flex-shrink-0" />
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${appTheme === 'dark' ? 'text-slate-400' : appTheme === 'solarized' ? 'text-orange-700' : 'text-slate-500'}`}>
                    Para iniciar, debes forjar tu ciclo y configurar tus 12 retos personalizados de 24 días.
                  </span>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => {
                setCycleInputs(Array.from({ length: 12 }, () => ({ title: "", description: "" })))
                setIsCycleModalOpen(true)
              }}
              className="px-6 py-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-cyan-600/30 hover:scale-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              ⚔️ Forjar Ciclo de 24 Días
            </button>
          </div>
        ) : (
          // 2. ESTADO DE CICLO ACTIVO
          <div className="flex flex-col gap-6 relative z-10">
            {/* Header del Ciclo */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-4 border-b border-white/5">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Camino del Guerrero en Curso</span>
                <h3 className={`text-xl font-[1000] uppercase tracking-tighter mt-1 ${appTheme === 'dark' ? 'text-slate-100' : appTheme === 'solarized' ? 'text-orange-950' : 'text-slate-800'}`}>Ciclo de 12 Desafíos Activo</h3>
              </div>
              
              {/* Tracker de Gemas del Ciclo */}
              <div className="flex flex-col gap-2">
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500">Pacto de Honor: {profileGameVars.oracle_custom_cycle.completed_count || 0} de 12 Superados</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {profileGameVars.oracle_custom_cycle.challenges.map((c: any) => {
                    const isCurrent = activeChallenge && activeChallenge.idea_index === c.id
                    return (
                      <div
                        key={c.id}
                        className={`w-7 h-7 rounded-xl border flex items-center justify-center text-[9px] font-black tracking-tighter transition-all duration-300 relative group cursor-help ${
                          c.completed
                            ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.15)]"
                            : isCurrent
                              ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-400 animate-pulse border-2"
                              : "bg-black/40 border-white/5 text-slate-600"
                        }`}
                      >
                        {c.completed ? "✓" : c.id}
                        
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 rounded-xl bg-black/95 border border-white/10 text-left pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50 shadow-2xl backdrop-blur-md">
                          <span className="text-[8px] font-black uppercase tracking-widest text-indigo-400 block mb-1">Desafío #{c.id}</span>
                          <h5 className="text-[10px] font-black text-slate-200 uppercase tracking-wide truncate">{c.title}</h5>
                          <p className="text-[9px] font-medium text-slate-400 mt-1 leading-normal line-clamp-2">{c.description}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Sub-lógicas según si hay reto activo o ceremonia de culminación */}
            {!activeChallenge ? (
              profileGameVars.oracle_custom_cycle.completed_count === 12 ? (
                // 2.A CEREMONIA DE VICTORIA DEL CICLO COMPLETADO
                <div className="flex flex-col items-center text-center p-8 rounded-3xl bg-emerald-500/5 border border-emerald-500/20 gap-4">
                  <div className="w-20 h-20 rounded-[2.5rem] bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 animate-bounce">
                    <Trophy className="w-10 h-10" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">Victoria Imperial</span>
                    <h4 className="text-2xl font-[1000] uppercase tracking-tighter text-slate-100 mt-1">¡HAS CONQUISTADO EL CICLO DE 24 DÍAS!</h4>
                    <p className="text-xs font-bold text-slate-400 max-w-xl uppercase tracking-wide leading-relaxed mt-2 mx-auto">
                      Has completado exitosamente cada uno de tus 12 desafíos de automatización, videos de vibecoding, posts en redes y publicaciones en GitHub. Tu disciplina ha trascendido el Oráculo. Se te han acreditado 500 PKD a tu balance.
                    </p>
                  </div>
                  
                  <button
                    onClick={handleResetCycle}
                    disabled={actionLoading !== null}
                    className="mt-2 px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-600/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    ⚔️ Forjar un Nuevo Ciclo
                  </button>
                </div>
              ) : (
                // 2.B LISTO PARA INVOCAR EL SIGUIENTE RETO
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 rounded-3xl bg-black/30 border border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 flex-shrink-0 animate-pulse">
                      <Brain className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-wider text-slate-200">Próxima Misión del Guerrero</h4>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-1 text-justify">
                        Invoca de forma aleatoria uno de tus retos sellados restantes para iniciar un ciclo de 48 horas de trabajo enfocado.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        const inputs = profileGameVars.oracle_custom_cycle.challenges.map((c: any) => ({
                          title: c.title,
                          description: c.description
                        }))
                        setCycleInputs(inputs)
                        setIsCycleModalOpen(true)
                      }}
                      className="px-5 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-slate-300 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Ver Retos Sellados</span>
                    </button>
                    
                    <button
                      onClick={handleInvokeChallenge}
                      disabled={actionLoading !== null}
                      className="px-6 py-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-cyan-600/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    >
                      ⚡ Invocar Reto #{profileGameVars.oracle_custom_cycle.completed_count + 1}
                    </button>
                  </div>
                </div>
              )
            ) : (
              // 2.C RETO MULTIMEDIA ACTIVO
              <div className="flex flex-col gap-6">
                {/* Header del Reto Activo */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-4 border-b border-white/5">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                      <Video className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-400">Reto Activo (Ciclo 48 Horas)</span>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border bg-black/40 ${
                          countdownText.includes("EXPIRADO") ? "text-rose-400 border-rose-500/30 animate-bounce" : "text-amber-400 border-amber-500/30"
                        }`}>
                          {countdownText}
                        </span>
                      </div>
                      <h3 className="text-2xl font-[1000] uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 mt-1">
                        {activeChallenge.title}
                      </h3>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-[1000] italic text-slate-100">{challengeProgress}%</span>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Listo</span>
                    </div>
                    <div className="w-40 h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${challengeProgress}%` }}
                        className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Ficha Descriptiva */}
                <div className="p-6 rounded-2xl bg-black/40 border border-white/5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">Misión de Automatización</span>
                  <p className="text-xs font-black uppercase tracking-wider text-slate-300 leading-relaxed">
                    {activeChallenge.description}
                  </p>
                </div>

                {/* Checklist Multimedia */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { field: "n8n_completed", label: "Construir Flujo en n8n", desc: "Forjar el proyecto automatizado real", color: "border-cyan-500/20 text-cyan-400" },
                    { field: "recording_completed", label: "Grabar Vibecoding", desc: "Capturar video de la sesión de código", color: "border-purple-500/20 text-purple-400" },
                    { field: "youtube_completed", label: "Edición YouTube / Post Largo", desc: "Video rápido largo o formato extendido", color: "border-indigo-500/20 text-indigo-400" },
                    { field: "tiktok_completed", label: "Edición Vertical TikTok / Reels", desc: "Clip de alto enganche de 60s", color: "border-pink-500/20 text-pink-400" },
                    { field: "linkedin_completed", label: "Redactar Post LinkedIn", desc: "Texto persuasivo y conceptual", color: "border-blue-500/20 text-blue-400" },
                    { field: "github_completed", label: "Publicar en GitHub", desc: "Subir código abierto del workflow", color: "border-emerald-500/20 text-emerald-400" },
                    { field: "social_completed", label: "Publicar en Redes", desc: "Desplegar el video editado", color: "border-amber-500/20 text-amber-400" },
                  ].map((step) => {
                    const isChecked = activeChallenge[step.field]
                    return (
                      <button
                        key={step.field}
                        onClick={() => handleToggleChallengeStep(step.field, isChecked)}
                        className={`p-4 rounded-2xl border text-left flex items-start gap-4 transition-all duration-300 cursor-pointer ${
                          isChecked 
                            ? "bg-slate-100/5 border-emerald-500/30 hover:bg-slate-100/10" 
                            : "bg-black/30 border-white/5 hover:border-white/10 hover:bg-black/50"
                        }`}
                      >
                        <div className={`mt-0.5 flex-shrink-0 ${isChecked ? "text-emerald-400" : "text-slate-600"}`}>
                          {isChecked ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                        </div>
                        <div>
                          <h4 className={`text-xs font-black uppercase tracking-wider ${isChecked ? "text-slate-100 line-through opacity-50" : "text-slate-200"}`}>
                            {step.label}
                          </h4>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-1">
                            {step.desc}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Enlaces y Documentación */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                  <div className="flex flex-col gap-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Documentación de Victoria</h4>
                    
                    <div className="flex flex-col gap-3">
                      <div>
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Repositorio de GitHub</label>
                        <div className="relative">
                          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 fill-current" viewBox="0 0 24 24">
                            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.11.82-.26.82-.577v-2.234c-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.43.372.82 1.102.82 2.222v3.293c0 .319.22.694.825.576C20.565 21.795 24 17.3 24 12c0-6.63-5.37-12-12-12z" />
                          </svg>
                          <input
                            type="url"
                            placeholder="https://github.com/..."
                            value={challengeGithubUrl}
                            onChange={(e) => setChallengeGithubUrl(e.target.value)}
                            className="bg-black/60 text-xs text-slate-200 font-bold pl-11 pr-4 py-3 rounded-xl border border-white/10 w-full focus:outline-none focus:border-cyan-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Video de Grabación / Publicación URL</label>
                        <div className="relative">
                          <Video className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                          <input
                            type="url"
                            placeholder="https://youtube.com/watch?v=... o Drive"
                            value={challengeVideoUrl}
                            onChange={(e) => setChallengeVideoUrl(e.target.value)}
                            className="bg-black/60 text-xs text-slate-200 font-bold pl-11 pr-4 py-3 rounded-xl border border-white/10 w-full focus:outline-none focus:border-cyan-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Notas de Vibecoding y Aprendizaje</h4>
                    <textarea
                      placeholder="Escribe aquí las lecciones clave aprendidas forjando este flujo..."
                      value={challengeNotes}
                      onChange={(e) => setChallengeNotes(e.target.value)}
                      rows={4}
                      className="bg-black/60 text-xs text-slate-200 font-medium p-4 rounded-xl border border-white/10 w-full focus:outline-none focus:border-cyan-500 resize-none h-full"
                    />
                  </div>
                </div>

                {/* Controles de Entrega */}
                <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/5">
                  <button
                    onClick={() => {
                      if (confirm("¿Estás seguro de que deseas abandonar este reto? Se perderá el avance actual.")) {
                        setActiveChallenge(null)
                      }
                    }}
                    className="px-5 py-3 rounded-xl border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer"
                  >
                    Rendirse y Cancelar
                  </button>

                  <div className="flex gap-3">
                    <button
                      onClick={handleSaveChallengeMeta}
                      disabled={actionLoading !== null}
                      className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Guardar Progreso</span>
                    </button>

                    <button
                      onClick={handleCompleteChallenge}
                      disabled={challengeProgress < 100 || actionLoading !== null}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[9px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
                    >
                      <Trophy className="w-3.5 h-3.5" />
                      <span>Concluir y Entregar Desafío</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>



      {/* ================= FASE 2 & 3: BARRA DE CONTROL DEL MODO EDICIÓN ================= */}
      <div className="mx-6 flex flex-wrap items-center justify-between gap-6 p-6 rounded-[2.5rem] bg-white/[0.01] border border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 leading-none block">Configuración de Rutina</span>
            <h4 className="text-sm font-black uppercase tracking-wider text-slate-200 mt-1">Control Maestro de Horarios</h4>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleCloneDayToWeek}
            disabled={actionLoading !== null}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-black uppercase text-[9px] md:text-[10px] tracking-widest hover:bg-indigo-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title="Clona la rutina completa de hoy a Lunes-Viernes"
          >
            <History className="w-4 h-4" />
            <span>Clonar L-V</span>
          </button>
          
          <button
            onClick={() => setIsEditingBlocks(!isEditingBlocks)}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl font-black uppercase text-[9px] md:text-[10px] tracking-widest hover:scale-105 active:scale-95 transition-all border-2 cursor-pointer ${
              isEditingBlocks
                ? "bg-rose-500/20 border-rose-500/50 text-rose-400 shadow-lg shadow-rose-500/10 animate-pulse"
                : "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
            }`}
          >
            {isEditingBlocks ? <Lock className="w-4 h-4 animate-bounce" /> : <Unlock className="w-4 h-4" />}
            <span>{isEditingBlocks ? "Sellar" : "Gestionar"}</span>
          </button>
        </div>
      </div>

      {/* FORMULARIO PREMIUM PARA AÑADIR NUEVO BLOQUE */}
      <AnimatePresence>
        {isEditingBlocks && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            className="mx-6 overflow-hidden"
          >
            <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 shadow-xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <Plus className="w-5 h-5 text-cyan-500" />
                  <span className="text-xs font-black uppercase tracking-widest text-cyan-400">Inyectar Bloque Horario</span>
                </div>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Modo Edición Activo</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Nombre */}
                <div className="md:col-span-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Actividad / Título del Bloque</label>
                  <input
                    type="text"
                    value={newBlockName}
                    onChange={(e) => setNewBlockName(e.target.value)}
                    placeholder="Ej. Deep Learning & Programación..."
                    className="bg-[#030712]/80 text-sm text-slate-100 font-semibold py-3 px-4 rounded-2xl border border-white/10 w-full focus:outline-none focus:border-cyan-500 placeholder:text-slate-600 uppercase tracking-wide"
                  />
                </div>

                {/* Categoría */}
                <div>
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Fase del Día</label>
                  <select
                    value={newBlockCategory}
                    onChange={(e) => setNewBlockCategory(e.target.value)}
                    className="bg-[#030712]/80 text-xs text-slate-200 font-black py-3.5 px-4 rounded-2xl border border-white/10 w-full focus:outline-none focus:border-cyan-500 uppercase tracking-widest"
                  >
                    <option value="Mañana">Mañana</option>
                    <option value="Bloque Trabajo">Bloque Trabajo</option>
                    <option value="Tarde">Tarde</option>
                    <option value="Noche">Noche</option>
                  </select>
                </div>

                {/* Tiempos */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Inicio</label>
                    <input
                      type="time"
                      value={newBlockStartTime}
                      onChange={(e) => setNewBlockStartTime(e.target.value)}
                      className="bg-[#030712]/80 text-xs text-slate-200 font-bold py-3.5 px-4 rounded-2xl border border-white/10 w-full focus:outline-none focus:border-cyan-500 tracking-wider"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Fin</label>
                    <input
                      type="time"
                      value={newBlockEndTime}
                      onChange={(e) => setNewBlockEndTime(e.target.value)}
                      className="bg-[#030712]/80 text-xs text-slate-200 font-bold py-3.5 px-4 rounded-2xl border border-white/10 w-full focus:outline-none focus:border-cyan-500 tracking-wider"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    setNewBlockName("")
                  }}
                  className="px-5 py-3 border border-slate-500/30 text-slate-400 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
                >
                  Limpiar
                </button>
                <button
                  onClick={handleCreateBlock}
                  disabled={actionLoading !== null}
                  className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-cyan-600/30 flex items-center gap-2"
                >
                  {actionLoading === "create-block" ? (
                    <Zap className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span>Añadir Bloque</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-24">
        {Object.entries(
          blocks.reduce((acc, block) => {
            if (!acc[block.category]) acc[block.category] = []
            acc[block.category].push(block)
            return acc
          }, {} as Record<string, any[]>)
        ).map(([category, catBlocks]) => {
          const catTheme = getThemeByCategory(category, appTheme)
          const CatIcon = getIconByCategory(category)

          return (
            <div key={category} className="space-y-16 pt-16 md:pt-24 first:pt-0">
              {/* Category Header */}
              <div className="flex items-center gap-6 px-6">
                <div className={`flex items-center gap-3 px-8 py-3 rounded-full border-2 ${catTheme.bg}`}>
                  <CatIcon className="w-5 h-5" />
                  <h3 className="text-xl font-[1000] uppercase italic tracking-widest leading-none mt-1">
                    {category}
                  </h3>
                </div>
                <div className="flex-1 h-[2px] bg-current opacity-10 rounded-full" />
              </div>

              <div className="space-y-16">
                {(catBlocks as any[]).map((block, index) => {
                  const blockTasks = tasks.filter(t => t.activity_name === block.activity_name)
                  const lastNoteForBlock = lastSessionNotes.find(t => t.activity_name === block.activity_name)
                  const isCompleted = blockTasks.length > 0 && blockTasks.every(t => t.is_completed)
                  const isActive = activeBlockId === block.id
                  const progress = blockTasks.length > 0 ? (blockTasks.filter(t => t.is_completed).length / blockTasks.length) * 100 : 0
                  
                  // Formatear hora: 14:00:00 -> 02:00 pm o 2:00 pm
                  const formatTimeEs = (timeStr: string) => {
                    const [h, m] = timeStr.split(':')
                    const hour = parseInt(h)
                    const ampm = hour >= 12 ? 'pm' : 'am'
                    const h12 = hour % 12 || 12
                    return `${h12}:${m} ${ampm}`
                  }

                  const displayTime = `${formatTimeEs(block.start_time)} - ${formatTimeEs(block.end_time)}`
                  const title = block.activity_name

                  const bTheme = getThemeByCategory(block.category, appTheme)
                  const Icon = getIconByActivity(title, block.category)

                  const getBadgeClasses = (cat: string) => {
                    if (cat.includes('Mañana')) return "text-amber-500 dark:text-amber-400 bg-amber-500/10 border-amber-500/20"
                    if (cat.includes('Bloque') || cat.includes('Trabajo')) return "text-cyan-500 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/20"
                    if (cat.includes('Tarde')) return "text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                    return "text-indigo-500 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
                  }

                  const getSadhguruPhrase = (activity: string, category: string, active: boolean) => {
                    const act = activity.toLowerCase();
                    const cat = category.toLowerCase();

                    if (act.includes("despertar") || act.includes("meditac") || act.includes("estira")) {
                      return active 
                        ? "«La vida no está en otra parte, está aquí y ahora. Despierta tu conciencia, haz que tu cuerpo y tu mente sean plataformas para la alegría máxima. ¡Respira y sé absoluto!»"
                        : "«Alinearse con la creación al despertar es el primer paso. No dejes que este día sea solo una rutina; conviértelo en una posibilidad espiritual superior.»";
                    }
                    if (act.includes("camin") || act.includes("ejercic") || act.includes("gimnas") || act.includes("deport")) {
                      return active
                        ? "«Tu cuerpo es el instrumento más sofisticado del planeta. Muévelo con reverencia, conéctate con la tierra y permite que la energía vital fluya sin restricciones.»"
                        : "«Tu forma física determina la claridad de tu mente. Camina y ejercítate no por deber, sino para celebrar el increíble milagro de estar vivo.»";
                    }
                    if (act.includes("trabaj") || act.includes("ventas") || act.includes("desarroll") || act.includes("softw") || act.includes("deep") || act.includes("saas") || act.includes("program") || cat.includes("bloque") || cat.includes("trabajo")) {
                      return active
                        ? "«El trabajo no es para ganarse la vida; es la expresión del ingenio humano. Pon el 100% de tu atención en lo que haces ahora. La genialidad florece en el enfoque absoluto.»"
                        : "«Prepárate para canalizar tu intelecto. El trabajo enfocado es una forma de meditación dinámica. Crea con una excelencia cósmica.»";
                    }
                    if (act.includes("aliment") || act.includes("comid") || act.includes("desayun") || act.includes("almuerz") || act.includes("cenar")) {
                      return active
                        ? "«El alimento que consumes se convierte en tu propio cuerpo. Recíbelo con profunda gratitud y atención plena. Eres lo que absorbes, haz que sea puro.»"
                        : "«Nutrirse es un acto de comunión con la naturaleza. Prepárate para recargar tu templo con total conciencia.»";
                    }
                    if (act.includes("leer") || act.includes("estudi") || act.includes("aprend") || act.includes("lectur")) {
                      return active
                        ? "«Aprender es expandir los límites de tu ignorancia consciente. Absorbe el conocimiento no para acumular datos, sino para disolver las barreras de tu mente.»"
                        : "«Prepara tu intelecto para la expansión. Cada idea asimilada con conciencia es un escalón más hacia la maestría y la libertad interior.»";
                    }
                    if (act.includes("dormir") || act.includes("noche") || act.includes("descans") || cat.includes("noche")) {
                      return active
                        ? "«El descanso es el arte de disolver las tensiones del día y rendirse ante la inmensidad del vacío. Suelta todo control, eres uno con la existencia.»"
                        : "«Prepara tu sistema para la regeneración sagrada. El sueño consciente es el umbral hacia el renacer diario.»";
                    }
                    
                    return active
                      ? "«La única forma de experimentar la vida es estar totalmente involucrado en lo que estás haciendo en este instante. No te guardes nada de ti mismo.»"
                      : "«Prepárate para involucrarte al 100%. La disciplina no es una limitación, es la llave dorada hacia tu libertad última.»";
                  }

                  return (
                    <motion.div 
                      key={block.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`relative flex gap-3 md:gap-10 group ${isActive ? "z-10" : "z-0"}`}
                    >
                      {/* Timeline Connector */}
                      <div className="flex flex-col items-center flex-shrink-0 pt-10 w-8 md:w-16">
                        <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full border-[3px] md:border-4 transition-all duration-700 z-10 flex items-center justify-center ${
                          isCompleted ? "bg-emerald-500 border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.8)]" : 
                          (isActive ? `${bTheme.accent} border-white shadow-[0_0_40px_rgba(34,211,238,0.8)]` : "bg-transparent border-slate-700")
                        }`}>
                          {isCompleted && <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-white" />}
                        </div>
                        {index < (catBlocks as any[]).length - 1 && (
                          <div className={`w-[2px] md:w-[3px] flex-1 mt-4 rounded-full ${isCompleted ? "bg-emerald-500/30" : "bg-slate-800"}`} />
                        )}
                      </div>

                      {/* Main Block Card */}
                      <div className={`flex-1 p-6 md:p-8 xl:p-10 rounded-[2.5rem] md:rounded-[3rem] border-2 transition-all duration-700 relative overflow-hidden group/card ${
                        isActive ? "shadow-2xl shadow-cyan-500/10 scale-[1.02]" : "hover:scale-[1.01]"
                      } ${isCompleted ? "bg-emerald-500/5 border-emerald-500/20" : bTheme.bg}`}>
                        
                        <CardBackgroundEffect color={bTheme.accent} />

                        {/* Progress Bar */}
                        <div className="absolute top-0 left-0 w-full h-2 bg-black/5 dark:bg-white/5">
                          <motion.div 
                            initial={{ width: 0 }} 
                            animate={{ width: `${progress}%` }} 
                            className={`h-full shadow-[0_0_15px_rgba(0,0,0,0.2)] ${isCompleted ? "bg-emerald-500" : bTheme.accent}`} 
                          />
                        </div>

                        <div className="relative z-10 flex flex-col gap-8 md:gap-10">
                          
                          {/* ================= GESTIÓN DEL BLOQUE EN CALIENTE ================= */}
                          {isEditingBlocks && editingBlockId !== block.id && (
                            <motion.div 
                              initial={{ opacity: 0, y: -8 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-black/40 border border-white/5 backdrop-blur-md"
                            >
                              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 pl-2">Controles de Bloque</span>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleMoveBlock(block.id, 'up')}
                                  disabled={actionLoading !== null}
                                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 hover:text-cyan-400 disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
                                  title="Subir Bloque (Intercambiar Horas)"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                                  </svg>
                                </button>

                                <button
                                  onClick={() => handleMoveBlock(block.id, 'down')}
                                  disabled={actionLoading !== null}
                                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 hover:text-cyan-400 disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
                                  title="Bajar Bloque (Intercambiar Horas)"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>

                                <div className="h-4 w-px bg-white/10 mx-1" />

                                <button
                                  onClick={() => handleMakeBlockUniversal(block)}
                                  disabled={actionLoading !== null}
                                  className="p-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer flex items-center gap-1.5 px-3"
                                  title="Hacer Universal (Copiar a L-V)"
                                >
                                  <Globe className="w-3.5 h-3.5" />
                                  <span className="text-[8px] font-black uppercase tracking-widest hidden sm:inline">Hacer Universal</span>
                                </button>

                                <div className="h-4 w-px bg-white/10 mx-1" />

                                <button
                                  onClick={() => {
                                    setEditingBlockId(block.id)
                                    setEditingBlockName(block.activity_name)
                                    setEditingBlockStartTime(block.start_time.substring(0, 5))
                                    setEditingBlockEndTime(block.end_time.substring(0, 5))
                                    setEditingBlockCategory(block.category)
                                  }}
                                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 hover:text-cyan-400 transition-all cursor-pointer"
                                  title="Editar Bloque inline"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => handleDeleteBlock(block.id, block.activity_name)}
                                  disabled={actionLoading !== null}
                                  className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
                                  title="Eliminar Bloque permanentemente"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </motion.div>
                          )}

                          {editingBlockId === block.id ? (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.98 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="flex flex-col gap-6 p-6 rounded-3xl bg-black/40 border border-white/10 backdrop-blur-md w-full"
                            >
                              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                                <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Modificar Protocolo</span>
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">ID: {block.id.substring(0,8)}</span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className="md:col-span-2">
                                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Nombre de la Actividad</label>
                                  <input
                                    type="text"
                                    value={editingBlockName}
                                    onChange={(e) => setEditingBlockName(e.target.value)}
                                    className="bg-black/60 text-sm text-slate-100 font-semibold py-2.5 px-4 rounded-xl border border-white/10 w-full focus:outline-none focus:border-cyan-500 uppercase tracking-wide"
                                  />
                                </div>

                                <div>
                                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Fase del Día</label>
                                  <select
                                    value={editingBlockCategory}
                                    onChange={(e) => setEditingBlockCategory(e.target.value)}
                                    className="bg-black/60 text-xs text-slate-200 font-black py-3 px-4 rounded-xl border border-white/10 w-full focus:outline-none focus:border-cyan-500 uppercase tracking-widest"
                                  >
                                    <option value="Mañana">Mañana</option>
                                    <option value="Bloque Trabajo">Bloque Trabajo</option>
                                    <option value="Tarde">Tarde</option>
                                    <option value="Noche">Noche</option>
                                  </select>
                                </div>

                                <div className="grid grid-cols-2 gap-3 md:col-span-3">
                                  <div>
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Hora de Inicio</label>
                                    <input
                                      type="time"
                                      value={editingBlockStartTime}
                                      onChange={(e) => setEditingBlockStartTime(e.target.value)}
                                      className="bg-black/60 text-xs text-slate-200 font-bold py-2.5 px-4 rounded-xl border border-white/10 w-full focus:outline-none focus:border-cyan-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Hora de Fin</label>
                                    <input
                                      type="time"
                                      value={editingBlockEndTime}
                                      onChange={(e) => setEditingBlockEndTime(e.target.value)}
                                      className="bg-black/60 text-xs text-slate-200 font-bold py-2.5 px-4 rounded-xl border border-white/10 w-full focus:outline-none focus:border-cyan-500"
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="flex justify-end gap-3 pt-2">
                                <button
                                  onClick={() => setEditingBlockId(null)}
                                  className="px-5 py-2.5 border border-slate-500/30 text-slate-400 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer"
                                >
                                  Cancelar
                                </button>
                                <button
                                  onClick={() => handleSaveBlockEdit(block.id)}
                                  disabled={actionLoading !== null}
                                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-emerald-600/30"
                                >
                                  {actionLoading === `save-${block.id}` ? "Guardando..." : "Aplicar"}
                                </button>
                              </div>
                            </motion.div>
                          ) : (
                            <div className="flex flex-col gap-6">
                            {/* Meta Row: Time & Status */}
                            <div className="flex flex-wrap items-center justify-between gap-4">
                              <div className={`flex items-center gap-2.5 px-5 py-2 rounded-full border whitespace-nowrap ${getBadgeClasses(block.category)}`}>
                                <Clock className="w-4 h-4" />
                                <span className="text-sm font-black uppercase tracking-wider tabular-nums">
                                  {displayTime}
                                </span>
                              </div>

                              {isActive && (
                                <span className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] font-black uppercase tracking-widest animate-pulse border border-cyan-500/20">
                                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                                  Protocolo Activo
                                </span>
                              )}
                            </div>

                            {/* Title Row */}
                            <div className="flex items-center gap-4">
                              <div className={`p-4 rounded-2xl flex-shrink-0 ${
                                block.category.includes('Mañana') ? 'bg-amber-500/10 text-amber-500 dark:text-amber-400' :
                                (block.category.includes('Bloque') || block.category.includes('Trabajo')) ? 'bg-cyan-500/10 text-cyan-500 dark:text-cyan-400' :
                                block.category.includes('Tarde') ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400' :
                                'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400'
                              }`}>
                                <Icon className={`w-8 h-8 md:w-10 md:h-10 ${isActive ? "animate-pulse" : ""}`} />
                              </div>
                              <h4 className="text-xl md:text-3xl lg:text-4xl font-[1000] uppercase italic tracking-tighter leading-tight break-words">
                                {title}
                              </h4>
                            </div>

                            {/* Context/Sadhguru Quote Banner */}
                            <div className={`p-6 md:p-8 rounded-3xl flex items-center gap-5 border shadow-md relative overflow-hidden ${
                              appTheme === "dark" ? "bg-black/40 border-white/5" : "bg-white/60 border-black/5 backdrop-blur-sm"
                            }`}>
                              <div className={`absolute top-0 right-0 w-40 h-40 rounded-full blur-[80px] opacity-10 pointer-events-none ${
                                block.category.includes('Mañana') ? 'bg-amber-500' :
                                (block.category.includes('Bloque') || block.category.includes('Trabajo')) ? 'bg-cyan-500' :
                                block.category.includes('Tarde') ? 'bg-emerald-500' :
                                'bg-indigo-500'
                              }`} />
                              
                              {/* Icono de destello temático y dinámico */}
                              <div className={`flex-shrink-0 relative z-10 ${
                                block.category.includes('Mañana') ? 'text-amber-500 dark:text-amber-400' :
                                (block.category.includes('Bloque') || block.category.includes('Trabajo')) ? 'text-cyan-500 dark:text-cyan-400' :
                                block.category.includes('Tarde') ? 'text-emerald-500 dark:text-emerald-400' :
                                'text-indigo-500 dark:text-indigo-400'
                              }`}>
                                <Sparkles className="w-6 h-6 md:w-8 md:h-8 opacity-60 animate-pulse" />
                              </div>

                              <p className={`flex-1 text-xs md:text-lg lg:text-xl font-[900] italic uppercase leading-relaxed tracking-tight relative z-10 ${
                                appTheme === 'dark' ? 'text-slate-200' : 'text-slate-800'
                              }`}>
                                "{getSadhguruPhrase(title, block.category, isActive)}"
                              </p>
                            </div>
                          </div>
                        )}

                          {/* --- DIVIDER --- */}
                          <div className="h-px w-full bg-gradient-to-r from-transparent via-current/10 to-transparent" />

                          {/* --- EXECUTION SECTION --- */}
                          <div className="flex flex-col gap-6">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Protocol Execution List</span>
                              {isCompleted && (
                                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest">
                                  <Trophy className="w-4 h-4 animate-bounce" /> Bloque Asegurado
                                </span>
                              )}
                            </div>

                            {lastNoteForBlock && (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`p-4 rounded-2xl border flex gap-3 items-start relative overflow-hidden ${
                                  appTheme === "dark" 
                                    ? "bg-amber-500/5 border-amber-500/15 text-amber-400/90 shadow-[0_0_20px_rgba(245,158,11,0.02)]" 
                                    : "bg-amber-50/70 border-amber-200/60 text-amber-800"
                                }`}
                              >
                                <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-[40px] opacity-[0.03] bg-amber-500 pointer-events-none" />
                                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5 animate-pulse" />
                                <div className="flex-1">
                                  <span className="text-[9px] font-black uppercase tracking-[0.25em] text-amber-500 block mb-1">
                                    Eco del Combate Anterior ({new Date(lastNoteForBlock.completed_at || lastNoteForBlock.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}):
                                  </span>
                                  <p className="text-xs font-semibold italic leading-relaxed opacity-95">
                                    "{lastNoteForBlock.note}"
                                  </p>
                                </div>
                              </motion.div>
                            )}

                            {/* Dynamic Tasks Section */}
                            <div className="space-y-4">
                              <AnimatePresence>
                                {blockTasks.map(task => {
                                  const daysPending = Math.floor((new Date().getTime() - new Date(task.original_date).getTime()) / (1000 * 3600 * 24))
                                  return (
                                    <motion.div 
                                      key={task.id} 
                                      layout
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, scale: 0.95 }}
                                      className={`flex flex-col p-5 px-6 rounded-2xl border-2 transition-all group/task items-stretch ${
                                        task.is_completed ? "bg-emerald-500/10 border-emerald-500/30 opacity-60" : 
                                        "bg-white/5 border-transparent hover:border-current shadow-lg"
                                      }`}
                                    >
                                      {editingTaskId === task.id ? (
                                        <div className="flex items-center gap-3 w-full">
                                          <input
                                            type="text"
                                            value={editingTaskText}
                                            onChange={(e) => setEditingTaskText(e.target.value)}
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter") handleSaveEdit(task.id)
                                              if (e.key === "Escape") setEditingTaskId(null)
                                            }}
                                            className="flex-1 bg-white/10 border-2 border-current/20 px-4 py-2 rounded-xl text-sm font-black uppercase tracking-widest focus:outline-none focus:border-current"
                                            autoFocus
                                          />
                                          <div className="flex items-center gap-1">
                                            <button 
                                              onClick={() => handleSaveEdit(task.id)}
                                              className="p-2 text-emerald-400 hover:text-emerald-300 transition-all cursor-pointer"
                                              title="Guardar Cambios"
                                            >
                                              <Save className="w-5 h-5" />
                                            </button>
                                            <button 
                                              onClick={() => setEditingTaskId(null)}
                                              className="p-2 text-rose-400 hover:text-rose-300 transition-all cursor-pointer"
                                              title="Cancelar Edición"
                                            >
                                              <X className="w-5 h-5" />
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <>
                                          <div className="flex items-center justify-between w-full gap-5">
                                            <div className="flex items-center gap-5 flex-1 cursor-pointer" onClick={() => toggleTask(task.id, task.is_completed)}>
                                              <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                                                task.is_completed ? "bg-emerald-500 border-emerald-400 text-white" : "border-current opacity-30"
                                              }`}>
                                                {task.is_completed && <CheckCircle2 className="w-4 h-4" />}
                                              </div>
                                              <div className="flex flex-col">
                                                <span className={`text-sm md:text-base font-black uppercase tracking-[0.1em] ${
                                                  task.is_completed ? "line-through opacity-50 italic" : ""
                                                }`}>
                                                  {task.task_text}
                                                </span>
                                                {daysPending > 0 && !task.is_completed && (
                                                  <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-1.5 mt-1.5">
                                                    <History className="w-3.5 h-3.5" /> Carga de Honor: {daysPending}d
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                            
                                            {/* Acciones de la tarea */}
                                            <div className="flex items-center gap-1 md:opacity-0 group-hover/task:opacity-100 transition-all duration-300 flex-shrink-0">
                                              <button 
                                                onClick={() => {
                                                  setExpandedNoteTaskId(expandedNoteTaskId === task.id ? null : task.id)
                                                  if (!editingNotes[task.id]) {
                                                    setEditingNotes(prev => ({ ...prev, [task.id]: task.note || "" }))
                                                  }
                                                }}
                                                className={`p-2 hover:text-amber-400 text-current transition-all cursor-pointer ${
                                                  task.note ? "opacity-100 text-amber-400" : "opacity-60 hover:opacity-100"
                                                }`}
                                                title="Bitácora de la Tarea"
                                              >
                                                <FileText className="w-4 h-4" />
                                              </button>
                                              <button 
                                                onClick={() => {
                                                  setEditingTaskId(task.id)
                                                  setEditingTaskText(task.task_text)
                                                }}
                                                className="p-2 hover:text-cyan-400 text-current opacity-60 hover:opacity-100 transition-all cursor-pointer"
                                                title="Editar Tarea"
                                              >
                                                <Edit3 className="w-4 h-4" />
                                              </button>
                                              <button 
                                                onClick={() => deleteTask(task.id)}
                                                className="p-2 hover:text-rose-500 text-current opacity-60 hover:opacity-100 transition-all cursor-pointer"
                                                title="Eliminar Tarea"
                                              >
                                                <Trash2 className="w-4 h-4" />
                                              </button>
                                            </div>
                                          </div>

                                          {/* Nota estática visible */}
                                          {task.note && expandedNoteTaskId !== task.id && (
                                            <div className="mt-2.5 p-3 rounded-xl bg-black/20 border border-white/5 flex gap-2 items-start text-xs font-bold text-slate-400">
                                              <span className="text-[10px] font-black uppercase text-amber-500/80 tracking-wider flex-shrink-0 mt-0.5">NOTA:</span>
                                              <span className="italic">"{task.note}"</span>
                                            </div>
                                          )}

                                          {/* Editor de bitácora expandido */}
                                          {expandedNoteTaskId === task.id && (
                                            <div className="mt-3.5 p-4 rounded-2xl bg-black/40 border border-amber-500/20 flex flex-col gap-3 w-full relative overflow-hidden">
                                              <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-[40px] opacity-[0.03] bg-amber-500 pointer-events-none" />
                                              <div className="flex items-center justify-between z-10">
                                                <span className="text-[9px] font-black text-amber-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
                                                  <FileText className="w-3.5 h-3.5" /> Bitácora de Combate
                                                </span>
                                                <button 
                                                  onClick={() => setExpandedNoteTaskId(null)}
                                                  className="text-slate-400 hover:text-slate-200 text-xs font-black uppercase tracking-widest text-[9px]"
                                                >
                                                  Cerrar
                                                </button>
                                              </div>
                                              <textarea
                                                value={editingNotes[task.id] ?? ""}
                                                onChange={(e) => setEditingNotes(prev => ({ ...prev, [task.id]: e.target.value }))}
                                                placeholder="Anota observaciones (ej. dolencia, lo que faltó, recordatorio de mañana)..."
                                                className="bg-[#030712]/80 text-sm text-slate-100 font-semibold py-3 px-4 rounded-xl border border-white/10 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 focus:outline-none resize-none h-24 w-full z-10 leading-relaxed placeholder:text-slate-500"
                                                autoFocus
                                              />
                                              <div className="flex justify-end gap-2 z-10">
                                                <button
                                                  onClick={() => handleSaveNote(task.id, editingNotes[task.id] || "")}
                                                  className="px-4 py-1.5 bg-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer border border-amber-500/30"
                                                >
                                                  Anclar Nota
                                                </button>
                                              </div>
                                            </div>
                                          )}
                                        </>
                                      )}
                                    </motion.div>
                                  )
                                })}
                              </AnimatePresence>
                              
                              {/* Input para nuevas misiones */}
                              <div className={`flex items-center gap-4 p-3 px-6 rounded-2xl border-2 border-dashed transition-all ${
                                activeInputBlock === block.id ? "border-current opacity-100" : "border-current/20 opacity-30 hover:opacity-100"
                              }`}>
                                <input 
                                  type="text" 
                                  value={activeInputBlock === block.id ? newTaskText : ""} 
                                  onChange={(e) => {
                                    setActiveInputBlock(block.id)
                                    setNewTaskText(e.target.value)
                                  }}
                                  onKeyDown={(e) => e.key === "Enter" && handleAddTask(block.activity_name)}
                                  placeholder="REFORZAR PROTOCOLO..." 
                                  className="flex-1 bg-transparent px-2 py-2 text-sm font-black uppercase tracking-widest focus:outline-none placeholder:text-current opacity-70"
                                />
                                <button 
                                  onClick={() => handleAddTask(block.activity_name)} 
                                  className={`p-3 rounded-xl transition-all flex-shrink-0 ${
                                    block.category.includes('Mañana') ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-white border border-amber-500/30' :
                                    (block.category.includes('Bloque') || block.category.includes('Trabajo')) ? 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500 hover:text-white border border-cyan-500/30' :
                                    block.category.includes('Tarde') ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/30' :
                                    'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500 hover:text-white border border-indigo-500/30'
                                  } flex items-center justify-center`}
                                >
                                  <Plus className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <AnimatePresence>
        {isCycleModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
              appTheme === 'dark' 
                ? 'bg-[#05070f]' 
                : appTheme === 'solarized' 
                ? 'bg-[#FDF6E3]' 
                : 'bg-[#F1F5F9]'
            }`}
            style={{ 
              backgroundColor: appTheme === 'dark' 
                ? '#05070f' 
                : appTheme === 'solarized' 
                ? '#FDF6E3' 
                : '#F1F5F9'
            }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className={`relative w-full max-w-5xl border rounded-[2.5rem] p-8 md:p-10 shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-hidden transition-all duration-300 ${
                appTheme === 'dark'
                  ? 'bg-[#0a0f1d] border-indigo-500/20 text-slate-100 shadow-[0_0_50px_rgba(0,0,0,0.8)]'
                  : appTheme === 'solarized'
                  ? 'bg-[#FFFDF9] border-orange-200/80 text-orange-950 shadow-[0_15px_50px_rgba(124,45,18,0.1)]'
                  : 'bg-white border-slate-200 text-slate-800 shadow-[0_15px_50px_rgba(0,0,0,0.08)]'
              }`}
              style={{ 
                backgroundColor: appTheme === 'dark' 
                  ? '#0a0f1d' 
                  : appTheme === 'solarized' 
                  ? '#FFFDF9' 
                  : '#FFFFFF'
              }}
            >
              {/* Glow FX */}
              <div className={`absolute -top-24 -left-24 w-48 h-48 rounded-full pointer-events-none blur-[80px] ${
                appTheme === 'dark' ? 'bg-indigo-500/10' : appTheme === 'solarized' ? 'bg-orange-500/10' : 'bg-indigo-500/5'
              }`} />
              <div className={`absolute -bottom-24 -right-24 w-48 h-48 rounded-full pointer-events-none blur-[80px] ${
                appTheme === 'dark' ? 'bg-cyan-500/10' : appTheme === 'solarized' ? 'bg-amber-500/10' : 'bg-cyan-500/5'
              }`} />

              {/* Botón Cerrar */}
              <button
                onClick={() => setIsCycleModalOpen(false)}
                className={`absolute top-6 right-6 p-3 rounded-xl border transition-all cursor-pointer z-10 hover:scale-105 active:scale-95 ${
                  appTheme === 'dark'
                    ? 'bg-[#1e293b] border-white/10 hover:bg-[#334155] text-slate-400 hover:text-white'
                    : appTheme === 'solarized'
                    ? 'bg-orange-100 border-orange-200 hover:bg-orange-200 text-orange-700 hover:text-orange-900'
                    : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-500 hover:text-slate-800'
                }`}
              >
                <X className="w-5 h-5" />
              </button>

              <div>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${
                    appTheme === 'dark' ? 'text-indigo-400' : appTheme === 'solarized' ? 'text-orange-600' : 'text-indigo-600'
                  }`}>
                    Canal de Contenidos del Guerrero
                  </span>
                  {profileGameVars?.oracle_custom_cycle?.active && (
                    <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-500 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Sellado en Supabase
                    </span>
                  )}
                </div>
                <h3 className={`text-2xl font-[1000] italic uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r mt-1 ${
                  appTheme === 'dark'
                    ? 'from-cyan-400 to-indigo-400'
                    : appTheme === 'solarized'
                    ? 'from-orange-600 to-amber-700'
                    : 'from-indigo-600 to-cyan-600'
                }`}>
                  ⚔️ Forja de 12 Desafíos del Ciclo
                </h3>
                <p className={`text-[10px] font-bold uppercase tracking-widest leading-relaxed mt-2 ${
                  appTheme === 'dark' ? 'text-slate-500' : appTheme === 'solarized' ? 'text-orange-800/60' : 'text-slate-400'
                }`}>
                  {profileGameVars?.oracle_custom_cycle?.active
                    ? "Tus 12 desafíos están sellados bajo el juramento del guerrero. Serán invocados aleatoriamente cada 2 días."
                    : "Define las 12 ideas de automatización con n8n que forjarás en tu ciclo de 24 días. Puedes precargar plantillas sugeridas."
                  }
                </p>
              </div>

              {/* Controles de Preload (sólo si no está activo) */}
              {!profileGameVars?.oracle_custom_cycle?.active && (
                <div className={`flex justify-between items-center p-4 rounded-2xl border transition-all ${
                  appTheme === 'dark'
                    ? 'bg-[#111827] border-white/5'
                    : appTheme === 'solarized'
                    ? 'bg-[#FFF3E3] border-orange-200/50'
                    : 'bg-[#F1F5F9] border-slate-200'
                }`}>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${
                    appTheme === 'dark' ? 'text-slate-400' : appTheme === 'solarized' ? 'text-orange-800/80' : 'text-slate-500'
                  }`}>
                    ¿Quieres un inicio rápido con plantillas predefinidas?
                  </span>
                  <button
                    onClick={handlePreloadTemplates}
                    className={`px-4 py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5 ${
                      appTheme === 'dark'
                        ? 'bg-indigo-500/10 border-indigo-500/30 hover:bg-indigo-500/20 text-indigo-400'
                        : appTheme === 'solarized'
                        ? 'bg-orange-200 border-orange-300 text-orange-700 hover:bg-orange-200/60 hover:text-orange-900'
                        : 'bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Precargar Retos con n8n</span>
                  </button>
                </div>
              )}

              {/* Grid de Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto no-scrollbar pr-1 py-1 flex-grow">
                {cycleInputs.map((input, idx) => (
                  <div
                    key={idx}
                    className={`p-5 rounded-2xl border transition-all ${
                      profileGameVars?.oracle_custom_cycle?.active
                        ? appTheme === 'dark'
                          ? 'bg-[#0c101b] border-white/5'
                          : appTheme === 'solarized'
                          ? 'bg-[#FFF3E3] border-orange-200/40'
                          : 'bg-[#F1F5F9] border-slate-200/40'
                        : appTheme === 'dark'
                        ? 'bg-[#111827] border-white/5 hover:border-indigo-500/30 focus-within:border-indigo-500/30'
                        : appTheme === 'solarized'
                        ? 'bg-[#FFF8EE] border-orange-200/80 hover:border-orange-300 focus-within:border-orange-300'
                        : 'bg-[#F8FAFC] border-slate-200 hover:border-slate-300 focus-within:border-indigo-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-[9px] font-black uppercase tracking-widest ${
                        appTheme === 'dark' ? 'text-slate-500' : appTheme === 'solarized' ? 'text-orange-700/60' : 'text-slate-400'
                      }`}>
                        Reto #{idx + 1}
                      </span>
                      {profileGameVars?.oracle_custom_cycle?.challenges?.[idx]?.completed ? (
                        <span className="text-[9px] font-black uppercase text-cyan-500 flex items-center gap-1">
                          ✓ Completado
                        </span>
                      ) : profileGameVars?.oracle_custom_cycle?.active ? (
                        <Lock className={`w-3 h-3 ${appTheme === 'solarized' ? 'text-orange-300' : 'text-slate-600'}`} />
                      ) : null}
                    </div>

                    <input
                      type="text"
                      placeholder="Título de la automatización..."
                      value={input.title}
                      onChange={(e) => {
                        const next = [...cycleInputs]
                        next[idx].title = e.target.value
                        setCycleInputs(next)
                      }}
                      disabled={profileGameVars?.oracle_custom_cycle?.active}
                      className={`text-sm font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl border w-full focus:outline-none focus:ring-2 disabled:opacity-60 transition-all ${
                        appTheme === 'dark'
                          ? 'bg-[#030712] text-slate-100 border-white/10 focus:border-indigo-500/50 focus:ring-indigo-500/10 placeholder:text-slate-600'
                          : appTheme === 'solarized'
                          ? 'bg-white text-orange-950 border-orange-200/80 focus:border-orange-500 focus:ring-orange-500/10 placeholder:text-orange-800/30'
                          : 'bg-white text-slate-800 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10 placeholder:text-slate-400'
                      }`}
                    />

                    <textarea
                      placeholder="Breve descripción del flujo y su valor comercial..."
                      value={input.description}
                      onChange={(e) => {
                        const next = [...cycleInputs]
                        next[idx].description = e.target.value
                        setCycleInputs(next)
                      }}
                      disabled={profileGameVars?.oracle_custom_cycle?.active}
                      rows={3}
                      className={`text-xs font-semibold p-4 rounded-xl border w-full focus:outline-none focus:ring-2 mt-3 resize-none h-20 disabled:opacity-60 transition-all ${
                        appTheme === 'dark'
                          ? 'bg-[#030712] text-slate-300 border-white/10 focus:border-indigo-500/50 focus:ring-indigo-500/10 placeholder:text-slate-600'
                          : appTheme === 'solarized'
                          ? 'bg-white text-orange-900 border-orange-200/80 focus:border-orange-500 focus:ring-orange-500/10 placeholder:text-orange-800/30'
                          : 'bg-white text-slate-600 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10 placeholder:text-slate-400'
                      }`}
                    />
                  </div>
                ))}
              </div>

              {/* Botón de Guardado e Inicio (sólo si no está activo) */}
              {!profileGameVars?.oracle_custom_cycle?.active && (
                <div className={`flex justify-end pt-4 border-t ${
                  appTheme === 'dark' ? 'border-white/5' : appTheme === 'solarized' ? 'border-orange-200/40' : 'border-slate-200/60'
                }`}>
                  <button
                    onClick={handleSaveCustomCycle}
                    disabled={actionLoading !== null}
                    className={`px-6 py-4 rounded-2xl bg-gradient-to-r text-white text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2 ${
                      appTheme === 'dark'
                        ? 'from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 shadow-cyan-600/30'
                        : appTheme === 'solarized'
                        ? 'from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 shadow-orange-600/20'
                        : 'from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 shadow-indigo-600/20'
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    <span>{actionLoading === "save-cycle" ? "Sellando Pacto..." : "⚔️ Sellar 12 Desafíos y Activar Ciclo"}</span>
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Helpers para categorías
function getIconByCategory(category: string) {
  if (category.includes('Mañana')) return Sun;
  if (category.includes('Bloque') || category.includes('Trabajo')) return Briefcase;
  if (category.includes('Tarde')) return Coffee;
  if (category.includes('Noche')) return Moon;
  return Sparkles;
}

function getIconByActivity(title: string, category: string) {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes("despertar") || lowerTitle.includes("levantar") || lowerTitle.includes("wake")) return Sparkles;
  if (lowerTitle.includes("medita") || lowerTitle.includes("respir") || lowerTitle.includes("yoga") || lowerTitle.includes("sadhguru") || lowerTitle.includes("oráculo")) return Brain;
  if (lowerTitle.includes("ejercicio") || lowerTitle.includes("entrenar") || lowerTitle.includes("gym") || lowerTitle.includes("deporte") || lowerTitle.includes("cardio") || lowerTitle.includes("caminar")) return Activity;
  if (lowerTitle.includes("estudio") || lowerTitle.includes("programar") || lowerTitle.includes("code") || lowerTitle.includes("deep learning") || lowerTitle.includes("saas") || lowerTitle.includes("trabaj") || lowerTitle.includes("laptop") || lowerTitle.includes("escribir")) return Briefcase;
  if (lowerTitle.includes("musica") || lowerTitle.includes("guitar") || lowerTitle.includes("ukelele") || lowerTitle.includes("piano") || lowerTitle.includes("cantar")) return Music;
  if (lowerTitle.includes("desayuno") || lowerTitle.includes("almuerzo") || lowerTitle.includes("cena") || lowerTitle.includes("comida") || lowerTitle.includes("comer") || lowerTitle.includes("snack") || lowerTitle.includes("nutri")) return Coffee;
  if (lowerTitle.includes("dormir") || lowerTitle.includes("sleep") || lowerTitle.includes("descans") || lowerTitle.includes("relajar")) return Moon;
  if (lowerTitle.includes("lectura") || lowerTitle.includes("leer") || lowerTitle.includes("libro")) return Globe;
  if (lowerTitle.includes("social") || lowerTitle.includes("amigo") || lowerTitle.includes("familia") || lowerTitle.includes("pareja") || lowerTitle.includes("amor")) return Heart;

  // Si no coincide con palabras clave, usar la categoría original
  if (category.includes('Mañana')) return Sun;
  if (category.includes('Bloque') || category.includes('Trabajo')) return Briefcase;
  if (category.includes('Tarde')) return Coffee;
  if (category.includes('Noche')) return Moon;
  return Sparkles;
}

function getThemeByCategory(category: string, appTheme: string) {
  const isDark = appTheme === "dark";
  if (category.includes('Mañana')) return { 
    bg: isDark ? "bg-amber-500/10 border-amber-500/20 text-amber-100" : "bg-amber-50 border-amber-200 text-amber-900",
    accent: "bg-amber-500" 
  };
  if (category.includes('Bloque') || category.includes('Trabajo')) return { 
    bg: isDark ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-100" : "bg-cyan-50 border-cyan-200 text-cyan-900",
    accent: "bg-cyan-500" 
  };
  if (category.includes('Tarde')) return { 
    bg: isDark ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-100" : "bg-emerald-50 border-emerald-200 text-emerald-900",
    accent: "bg-emerald-500" 
  };
  return { 
    bg: isDark ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-100" : "bg-indigo-50 border-indigo-200 text-indigo-900",
    accent: "bg-indigo-500" 
  };
}

const Laptop = ({ className }: { className?: string }) => <Briefcase className={className} />;

function SkillTree({ theme }: { theme: string }) {
  const { lifePlan } = useOracleStore()

  // Mapeo de iconos dinámicos
  const getSkillIcon = (name: string) => {
    const lowercase = name.toLowerCase()
    if (lowercase.includes("ingles") || lowercase.includes("english")) return User
    if (lowercase.includes("n8n")) return Zap
    if (lowercase.includes("python")) return Coffee
    if (lowercase.includes("supabase") || lowercase.includes("postgres")) return Shield
    return Brain
  }

  // Mapeo de colores dinámicos
  const getSkillColor = (index: number) => {
    const colors = ["text-cyan-500", "text-rose-500", "text-emerald-500", "text-amber-500"]
    return colors[index % colors.length]
  }

  // Progreso estimado según nivel de maestría
  const getSkillProgress = (levelStr: string) => {
    const lvl = levelStr.toLowerCase()
    if (lvl.includes("avanzado") || lvl.includes("experto")) return 90
    if (lvl.includes("intermedio")) return 65
    return 35 // Básico / Novato
  }

  // Formatear habilidades dinámicas o recurrir a fallback
  const skills = useMemo(() => {
    if (lifePlan && Array.isArray((lifePlan as any).skills_mastery) && (lifePlan as any).skills_mastery.length > 0) {
      return (lifePlan as any).skills_mastery.map((s: any, idx: number) => ({
        name: s.name,
        level: s.level || "Básico",
        progress: getSkillProgress(s.level || ""),
        color: getSkillColor(idx),
        icon: getSkillIcon(s.name)
      }))
    }
    return [
      { name: "Deep Learning", level: "Intermedio", progress: 65, color: "text-cyan-500", icon: Brain },
      { name: "Ukelele Mastery", level: "Básico", progress: 30, color: "text-rose-500", icon: Music },
      { name: "SaaS Survival", level: "Avanzado", progress: 85, color: "text-emerald-500", icon: Briefcase },
    ]
  }, [lifePlan])

  return (
    <div className={`p-10 rounded-[3rem] border-2 shadow-xl ${theme === "dark" ? "bg-white/[0.02] border-white/5" : "bg-white border-slate-100 shadow-sm"}`}>
      <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-500 mb-10">Evolution Matrix</h3>
      <div className="space-y-10">
        {skills.map((skill: any) => (
          <div key={skill.name}>
            <div className="flex justify-between items-center mb-4 text-xs font-[1000] uppercase tracking-tighter">
              <div className="flex items-center gap-3">
                <skill.icon className={`w-5 h-5 ${skill.color}`} />
                <span>{skill.name}</span>
              </div>
              <span className="opacity-40">{skill.level}</span>
            </div>
            <div className="h-2 w-full bg-slate-500/10 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${skill.progress}%` }} className={`h-full bg-current ${skill.color}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DemonAltar({ theme }: { theme: string }) {
  const [streaks, setStreaks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [mockStreakVal, setMockStreakVal] = useState(0)
  const [resetTargetDemon, setResetTargetDemon] = useState<string | null>(null)

  const fetchStreaks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('demon_streaks')
        .select('*')
        .eq('user_id', user.id)

      if (data) {
        const pmoExist = data.find(d => d.demon_type === 'pmo')
        const lolExist = data.find(d => d.demon_type === 'lol')
        
        const inserts = []
        if (!pmoExist) inserts.push({ user_id: user.id, demon_type: 'pmo', streak_days: 0 })
        if (!lolExist) inserts.push({ user_id: user.id, demon_type: 'lol', streak_days: 0 })

        if (inserts.length > 0) {
          await supabase.from('demon_streaks').insert(inserts)
          const { data: refreshed } = await supabase
            .from('demon_streaks')
            .select('*')
            .eq('user_id', user.id)
          if (refreshed) setStreaks(refreshed)
        } else {
          setStreaks(data)
        }
      }
    } catch (err) {
      console.error("Error loading streaks:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStreaks()
  }, [])

  // Sincronizar el slider con el valor máximo real al cargar la DB
  useEffect(() => {
    if (streaks.length > 0) {
      const maxS = Math.max(...streaks.map(s => s.streak_days || 0), 0)
      setMockStreakVal(maxS)
    }
  }, [streaks])

  const isToday = (dateString: string) => {
    if (!dateString) return false
    const today = new Date().toLocaleDateString('es-ES')
    const date = new Date(dateString).toLocaleDateString('es-ES')
    return today === date
  }

  const handleVictory = async (demonType: string) => {
    setActionLoading(demonType + '-win')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const current = streaks.find(s => s.demon_type === demonType)
      const newStreak = (current?.streak_days || 0) + 1

      const { error } = await supabase
        .from('demon_streaks')
        .update({ 
          streak_days: newStreak, 
          updated_at: new Date().toISOString() 
        })
        .eq('user_id', user.id)
        .eq('demon_type', demonType)

      if (!error) {
        await fetchStreaks()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleReset = (demonType: string) => {
    setResetTargetDemon(demonType)
  }

  const executeReset = async (demonType: string) => {
    setActionLoading(demonType + '-lose')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('demon_streaks')
        .update({ 
          streak_days: 0, 
          last_broken_at: new Date().toISOString(),
          updated_at: new Date().toISOString() 
        })
        .eq('user_id', user.id)
        .eq('demon_type', demonType)

      if (!error) {
        await fetchStreaks()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancelFall = async (demonType: string) => {
    setActionLoading(demonType + '-cancel')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('demon_streaks')
        .update({ 
          streak_days: 1, // Le devolvemos su racha inicial segura
          last_broken_at: null,
          updated_at: new Date(Date.now() - 86400000).toISOString() // Deshacer actualización de hoy
        })
        .eq('user_id', user.id)
        .eq('demon_type', demonType)

      if (!error) {
        await fetchStreaks()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(null)
    }
  }

  const getDemonData = (type: string) => {
    const s = streaks.find(d => d.demon_type === type)
    const days = s?.streak_days || 0
    const checked = s ? (isToday(s.updated_at) && days > 0) : false
    const brokenToday = s ? (isToday(s.last_broken_at)) : false

    if (type === 'pmo') {
      return {
        title: "Retención Seminal & Pureza",
        subtitle: "Pornografía & Masturbación",
        icon: Flame,
        color: "from-rose-500 to-amber-600",
        gradientStyle: "linear-gradient(90deg, #f43f5e 0%, #ea580c 100%)",
        shadow: "shadow-rose-500/10",
        glow: "bg-rose-500",
        textGlow: "text-rose-400",
        border: "border-rose-500/20",
        bg: "bg-rose-500/5",
        days,
        checked,
        brokenToday
      }
    } else {
      return {
        title: "El Nexo Corrupto",
        subtitle: "League of Legends / SoloQ",
        icon: Gamepad2,
        color: "from-cyan-500 to-indigo-600",
        gradientStyle: "linear-gradient(90deg, #06b6d4 0%, #4f46e5 100%)",
        shadow: "shadow-cyan-500/10",
        glow: "bg-cyan-500",
        textGlow: "text-cyan-400",
        border: "border-cyan-500/20",
        bg: "bg-cyan-500/5",
        days,
        checked,
        brokenToday
      }
    }
  }

  const getWarriorRank = (days: number) => {
    if (days >= 76) return { name: "Iluminado Cósmico", color: "text-purple-400 border-purple-500/30" }
    if (days >= 46) return { name: "Soberano de la Mente", color: "text-cyan-400 border-cyan-500/30" }
    if (days >= 22) return { name: "Conquistador de Impulsos", color: "text-emerald-400 border-emerald-500/30" }
    if (days >= 8) return { name: "Forjador de Voluntad", color: "text-amber-400 border-amber-500/30" }
    return { name: "Neófito del Despertar", color: "text-slate-400 border-slate-500/20" }
  }

  if (loading) return (
    <div className={`p-8 rounded-[3rem] border-2 flex items-center justify-center h-48 ${theme === "dark" ? "bg-white/[0.02] border-white/5" : "bg-white border-slate-100 shadow-sm"}`}>
      <Flame className="w-6 h-6 animate-bounce text-rose-500" />
    </div>
  )

  const maxStreak = Math.max(...streaks.map(s => s.streak_days || 0), 0)
  const rank = getWarriorRank(maxStreak)

  return (
    <div className={`p-8 md:p-10 rounded-[3.5rem] border-2 shadow-2xl relative overflow-hidden transition-all duration-300 ${
      theme === "dark" ? "bg-black/40 border-red-500/10 shadow-red-500/[0.02]" : "bg-white border-red-100 shadow-xl"
    }`}>
      {/* MODAL DE CONFIRMACIÓN DE CAÍDA */}
      <AnimatePresence>
        {resetTargetDemon && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop extra oscuro y denso */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setResetTargetDemon(null)}
              className="absolute inset-0 bg-black/95 backdrop-blur-xl"
            />
            
            {/* Card Modal completamente sólido */}
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className={`relative max-w-md w-full p-8 md:p-10 rounded-[2.5rem] border-2 shadow-2xl z-[110] ${
                theme === "dark" 
                  ? "bg-[#070b15] border-rose-500/40 text-white shadow-rose-500/20" 
                  : "bg-white border-rose-200 text-slate-900 shadow-xl"
              }`}
            >
              <div className="flex flex-col items-center text-center">
                {/* Glowing Warning Icon */}
                <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border-2 border-rose-500/30 flex items-center justify-center text-rose-500 mb-6 animate-pulse">
                  <Flame className="w-8 h-8 fill-current" />
                </div>
                
                <h3 className="text-xl md:text-2xl font-[1000] uppercase italic tracking-wider leading-none mb-3 text-rose-500">
                  Honestidad Radical
                </h3>
                
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mb-6">
                  {resetTargetDemon === 'pmo' ? 'Retención Seminal & Pureza' : 'El Nexo Corrupto (League of Legends)'}
                </p>
                
                <p className="text-sm font-bold opacity-80 leading-relaxed uppercase tracking-wide mb-8">
                  "El guerrero no oculta sus tropiezos, los reconoce para forjar un carácter inquebrantable. ¿Declaras una caída y reinicias tu racha a cero?"
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <button
                    onClick={() => {
                      if (resetTargetDemon) {
                        executeReset(resetTargetDemon);
                        setResetTargetDemon(null);
                      }
                    }}
                    className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black uppercase text-[10px] tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-rose-500/20"
                  >
                    Sí, Caí
                  </button>
                  <button
                    onClick={() => setResetTargetDemon(null)}
                    className={`flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all border cursor-pointer ${
                      theme === "dark" 
                        ? "bg-white/5 border-white/10 text-white hover:bg-white/10" 
                        : "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100"
                    }`}
                  >
                    Seguir Batallando
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="absolute -top-12 -right-12 w-32 h-32 bg-red-500/10 rounded-full blur-[50px] pointer-events-none" />

      <div className="flex items-center justify-between mb-8 pb-4 border-b border-current/5">
        <div className="flex items-center gap-3">
          <Swords className="w-5 h-5 text-red-500 animate-pulse" />
          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.3em] text-red-500 leading-none">Altar de Destierro</h3>
            <span className="text-[9px] font-bold text-slate-500 tracking-widest uppercase">2ª Prioridad Absoluta</span>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${rank.color}`}>
          {rank.name}
        </div>
      </div>

      <div className="space-y-6">
        {['pmo', 'lol'].map(type => {
          const d = getDemonData(type)
          const pct = Math.min((d.days / 90) * 100, 100)

          return (
            <div key={type} className={`p-5 rounded-3xl border transition-all ${d.border} ${theme === 'dark' ? 'bg-[#0E1322]' : 'bg-slate-50'}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-2xl bg-gradient-to-br ${d.color} flex items-center justify-center text-white shadow-lg`}>
                    <d.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-tight leading-none mb-1">{d.title}</h4>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none block">{d.subtitle}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-2xl font-[1000] italic leading-none tracking-tighter ${d.textGlow}`}>
                    {d.days}
                  </span>
                  <span className="text-[10px] font-black text-slate-500 uppercase block tracking-wider leading-none">/ 90 Días</span>
                </div>
              </div>

              <div className="h-2 w-full bg-slate-500/10 rounded-full overflow-hidden mb-5">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${pct}%` }} 
                  style={{ background: d.gradientStyle }}
                  className="h-full rounded-full" 
                />
              </div>

              <div className="flex items-center gap-2">
                {d.brokenToday ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full flex items-center justify-between gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400"
                  >
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-rose-500 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-wider">Sello Roto Hoy</span>
                    </div>
                    <button 
                      onClick={() => handleCancelFall(type)}
                      disabled={actionLoading !== null}
                      className="px-4 py-2 rounded-xl bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 text-[9px] font-black uppercase tracking-widest transition-all"
                    >
                      Cancelar Caída
                    </button>
                  </motion.div>
                ) : d.checked ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 to-teal-500/15 border-2 border-emerald-500/30 text-emerald-300 shadow-xl shadow-emerald-500/10"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    >
                      <Lock className="w-5 h-5 text-emerald-400" />
                    </motion.div>
                    <span className="text-xs font-black uppercase tracking-[0.25em] animate-pulse">Sello Asegurado Hoy</span>
                  </motion.div>
                ) : (
                  <>
                    <motion.button
                      whileHover={{ 
                        scale: 1.05, 
                        boxShadow: "0 0 25px rgba(16,185,129,0.5)",
                        borderColor: "rgba(16,185,129,0.8)"
                      }}
                      whileTap={{ scale: 0.95 }}
                      animate={{
                        boxShadow: [
                          "0 0 0px rgba(16,185,129,0)",
                          "0 0 15px rgba(16,185,129,0.3)",
                          "0 0 0px rgba(16,185,129,0)"
                        ]
                      }}
                      transition={{
                        boxShadow: {
                          repeat: Infinity,
                          duration: 2,
                          ease: "easeInOut"
                        }
                      }}
                      onClick={() => handleVictory(type)}
                      disabled={actionLoading !== null}
                      className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-2 border-emerald-500/40 text-emerald-300 font-black uppercase text-xs tracking-[0.15em] hover:from-emerald-500/30 hover:to-teal-500/30 transition-all flex items-center justify-center gap-3 relative overflow-hidden group shadow-lg shadow-emerald-500/10 cursor-pointer"
                    >
                      {/* Efecto Shimmer al Hover */}
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                      <Unlock className="w-4 h-4 text-emerald-400 animate-pulse" />
                      <span>Sellar Victoria</span>
                    </motion.button>
                    <button
                      onClick={() => handleReset(type)}
                      disabled={actionLoading !== null}
                      className="py-4 px-5 rounded-2xl bg-rose-500/5 border border-rose-500/20 hover:bg-rose-500/10 text-rose-400 font-black uppercase text-xs tracking-widest hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center justify-center cursor-pointer"
                      title="Caí en tentación / Reiniciar racha"
                    >
                      Caí
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* SIMULADOR DE COMBATE EN EL ALTAR (Solo en fines de semana) */}
      {(new Date().getDay() === 6 || new Date().getDay() === 0) && (
        <div className={`mt-8 p-6 rounded-2xl border-2 flex flex-col gap-4 ${
          theme === "dark" 
            ? "bg-amber-500/5 border-amber-500/10 text-amber-300" 
            : "bg-amber-50 border-amber-200 text-amber-800"
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-wider">Forja de Rachas (Entrenamiento)</span>
            </div>
            <span className="text-[10px] font-black tracking-widest bg-amber-500/20 px-2 py-0.5 rounded text-amber-400">
              {mockStreakVal} DÍAS
            </span>
          </div>
          
          <input
            type="range"
            min="0"
            max="90"
            value={mockStreakVal}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setMockStreakVal(val);
              // Modificamos el estado temporal de streaks para que el usuario experimente la subida de rangos
              setStreaks(prev => prev.map(s => ({ ...s, streak_days: val })));
            }}
            className="w-full h-1.5 bg-amber-500/10 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          
          <p className="text-[9px] font-bold opacity-75 uppercase tracking-wide leading-relaxed text-center">
            Prueba cómo se transforman tus rangos y la barra de progreso. El lunes esta simulación desaparecerá y comenzará tu racha real.
          </p>
        </div>
      )}
    </div>
  )
}

function FinancialShield({ theme }: { theme: string }) {
  const [savings, setSavings] = useState<number>(375)
  const [burnRate, setBurnRate] = useState<number>(2500)
  const [isEditing, setIsEditing] = useState(false)
  const [savingsInput, setSavingsInput] = useState("375")
  const [burnInput, setBurnInput] = useState("2500")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFinance = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        
        const { data } = await supabase
          .from('profiles')
          .select('game_vars')
          .eq('id', user.id)
          .single()
          
        if (data && data.game_vars && typeof data.game_vars === 'object') {
          const vars = data.game_vars as Record<string, any>;
          const loadedSavings = vars.survival_savings !== undefined ? Number(vars.survival_savings) : 375
          const loadedBurn = vars.survival_burn_rate !== undefined ? Number(vars.survival_burn_rate) : 2500
          
          setSavings(loadedSavings)
          setBurnRate(loadedBurn)
          setSavingsInput(loadedSavings.toString())
          setBurnInput(loadedBurn.toString())
        }
      } catch (err) {
        console.error("Error loading financial shield:", err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchFinance()
  }, [])

  const handleSave = async () => {
    try {
      const sVal = Math.max(0, Number(savingsInput) || 0)
      const bVal = Math.max(1, Number(burnInput) || 2500)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('game_vars')
        .eq('id', user.id)
        .single()
        
      const currentVars = (profile && profile.game_vars && typeof profile.game_vars === 'object') 
        ? { ...profile.game_vars } 
        : {}
        
      const updatedVars = {
        ...currentVars,
        survival_savings: sVal,
        survival_burn_rate: bVal
      }
      
      const { error } = await supabase
        .from('profiles')
        .update({ game_vars: updatedVars })
        .eq('id', user.id)
        
      if (error) throw error
      
      setSavings(sVal)
      setBurnRate(bVal)
      setIsEditing(false)
    } catch (err) {
      console.error("Error saving financial shield:", err)
    }
  }

  // Cómputos
  const days = burnRate > 0 ? Math.round((savings / burnRate) * 30) : 0
  const percent = burnRate > 0 ? Math.min((savings / burnRate) * 100, 100) : 0

  if (loading) {
    return (
      <div className={`p-10 rounded-[3rem] border-2 h-44 flex items-center justify-center ${theme === "dark" ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-50 border-emerald-100"}`}>
        <Shield className="w-5 h-5 animate-pulse text-emerald-500" />
      </div>
    )
  }

  return (
    isEditing ? (
      <div className={`p-10 rounded-[3rem] border-2 relative overflow-hidden shadow-2xl ${theme === "dark" ? "bg-[#0A1A12] border-emerald-500/30" : "bg-emerald-50 border-emerald-200"}`}>
        <div className="flex items-center justify-between mb-6 text-emerald-500">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-[0.3em]">CONFIGURAR</span>
          </div>
          <span className="text-[9px] font-black uppercase text-amber-500 animate-pulse">Ajustes</span>
        </div>
        
        <div className="space-y-4 mb-6">
          <div>
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Ahorro de Emergencia ($)</label>
            <input
              type="number"
              value={savingsInput}
              onChange={(e) => setSavingsInput(e.target.value)}
              className="bg-[#030712]/80 text-sm text-slate-100 font-semibold py-2.5 px-4 rounded-xl border border-white/10 w-full focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Presupuesto Fijo Mensual ($)</label>
            <input
              type="number"
              value={burnInput}
              onChange={(e) => setBurnInput(e.target.value)}
              className="bg-[#030712]/80 text-sm text-slate-100 font-semibold py-2.5 px-4 rounded-xl border border-white/10 w-full focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button 
            onClick={() => {
              setIsEditing(false)
              setSavingsInput(savings.toString())
              setBurnInput(burnRate.toString())
            }}
            className="px-4 py-2 border border-slate-500/30 text-slate-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-emerald-600/30"
          >
            Aplicar
          </button>
        </div>
      </div>
    ) : (
      <motion.div 
        whileHover={{ y: -5 }} 
        onClick={() => setIsEditing(true)}
        className={`p-10 rounded-[3rem] border-2 relative overflow-hidden shadow-2xl cursor-pointer group ${theme === "dark" ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-50 border-emerald-100"}`}
        title="Haz clic para actualizar tus fondos de supervivencia"
      >
        <div className="absolute top-6 right-6 text-emerald-400 opacity-0 group-hover:opacity-100 transition-all">
          <Edit3 className="w-4 h-4 animate-pulse" />
        </div>
        <div className="relative z-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-4 text-emerald-500">
            <Shield className="w-5 h-5 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-[0.3em]">Survival Shield</span>
          </div>
          <h2 className="text-7xl font-[1000] italic uppercase tracking-tighter text-emerald-500 mb-6">{days}D</h2>
          <div className="h-3 w-full bg-emerald-500/10 rounded-full overflow-hidden border border-emerald-500/10 mb-6">
            <motion.div initial={{ width: 0 }} animate={{ width: `${percent}%` }} className="h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)]" />
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic opacity-60">${savings.toLocaleString()} / ${burnRate.toLocaleString()} Mensual</p>
        </div>
      </motion.div>
    )
  )
}

// ================= MAIN PAGE =================

export default function OracleWarRoomPage() {
  const router = useRouter()
  const { fetchLifePlan } = useOracleStore()
  const { completeCheckIn } = useAppStore()
  const [theme, setTheme] = useState<"dark" | "light" | "solarized">("dark")
  const [isChatOpen, setIsChatOpen] = useState(false)

  const [devBypassActive, setDevBypassActive] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    if (typeof window !== 'undefined') {
      setDevBypassActive(localStorage.getItem('dev_bypass_checkin') !== 'false')
    }
  }, [])

  const handleEnterEther = () => {
    completeCheckIn()
    router.push("/play")
  }

  const handleGoToDashboard = () => {
    completeCheckIn()
    router.push(devBypassActive ? '/dashboard?bypass=true' : '/dashboard')
  }

  // Estados para ORACLE OVERRIDE (Frase motivacional personalizada)
  const [customQuote, setCustomQuote] = useState<string>("")
  const [isEditingQuote, setIsEditingQuote] = useState(false)
  const [quoteInput, setQuoteInput] = useState("")

  // Cargar frase personalizada desde profiles.game_vars
  useEffect(() => {
    const fetchCustomQuote = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        
        const { data, error } = await supabase
          .from('profiles')
          .select('game_vars')
          .eq('id', user.id)
          .single()
          
        if (data && data.game_vars && typeof data.game_vars === 'object') {
          const vars = data.game_vars as Record<string, any>;
          if (vars.oracle_override_quote) {
            setCustomQuote(vars.oracle_override_quote)
            setQuoteInput(vars.oracle_override_quote)
          }
        }
      } catch (err) {
        console.error("Error loading custom quote:", err)
      }
    }
    
    fetchCustomQuote()
  }, [])

  const handleSaveQuote = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('game_vars')
        .eq('id', user.id)
        .single()
        
      const currentVars = (profile && profile.game_vars && typeof profile.game_vars === 'object') 
        ? { ...profile.game_vars } 
        : {}
        
      const updatedVars = {
        ...currentVars,
        oracle_override_quote: quoteInput
      }
      
      const { error } = await supabase
        .from('profiles')
        .update({ game_vars: updatedVars })
        .eq('id', user.id)
        
      if (error) throw error
      
      setCustomQuote(quoteInput)
      setIsEditingQuote(false)
    } catch (err) {
      console.error("Error saving custom quote:", err)
    }
  }

  // Persistencia del estado del chat
  useEffect(() => {
    const savedChatState = localStorage.getItem("oracle_chat_open")
    if (savedChatState === "true") setIsChatOpen(true)
  }, [])

  useEffect(() => {
    localStorage.setItem("oracle_chat_open", isChatOpen.toString())
  }, [isChatOpen])

  useEffect(() => { fetchLifePlan() }, [fetchLifePlan])

  return (
    <div className={`min-h-screen transition-colors duration-700 overflow-x-hidden ${
      theme === "dark"
        ? "bg-[#0B0F1A] text-slate-200"
        : theme === "solarized"
        ? "bg-[#FFF7ED] text-[#7C2D12]"
        : "bg-[#F8FAFC] text-slate-800"
    }`}>
      
      {/* Background FX */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-60">
        <div className={`absolute top-[-10%] left-[-10%] w-[60%] h-[60%] blur-[180px] rounded-full ${
          theme === 'solarized' ? 'bg-amber-500/10' : 'bg-cyan-500/10'
        }`} />
        <div className={`absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] blur-[180px] rounded-full ${
          theme === 'solarized' ? 'bg-rose-500/10' : 'bg-indigo-500/10'
        }`} />
        {theme === "dark" && <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />}
      </div>

      <nav className={`fixed top-0 left-0 w-full z-40 px-4 md:px-12 py-3 md:py-8 flex justify-between items-center backdrop-blur-2xl border-b transition-all ${
        theme === "dark"
          ? "border-white/5 bg-[#0B0F1A]/80"
          : theme === "solarized"
          ? "border-orange-200/50 bg-[#FFF7ED]/90"
          : "border-slate-200 bg-white/80 shadow-md"
      }`}>
        <div className="flex items-center gap-3 md:gap-6">
          <div className="w-10 h-10 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-indigo-600 flex items-center justify-center shadow-xl shadow-cyan-500/20 flex-shrink-0">
            <Sparkles className="w-5 h-5 md:w-7 md:h-7 text-white" />
          </div>
          <div>
            <span className={`text-sm md:text-lg font-[1000] uppercase tracking-[0.3em] md:tracking-[0.4em] block leading-tight ${
              theme === 'solarized' ? 'text-amber-400' : 'text-cyan-500'
            }`}>ORACLE COMMAND</span>
            <span className="text-[9px] md:text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] opacity-60 italic underline decoration-cyan-500/50 hidden sm:block">PROTOCOL v4.0 ZEN-TECH</span>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-5">
          {isMounted && typeof window !== 'undefined' && 
           (window.location.hostname === 'localhost' || 
            window.location.hostname === '127.0.0.1' || 
            process.env.NODE_ENV === 'development') && (
            <button 
              onClick={() => {
                if (!devBypassActive) {
                  localStorage.setItem('dev_bypass_checkin', 'true')
                  setDevBypassActive(true)
                }
                router.push('/dashboard?bypass=true')
              }}
              title="Ir directo al Dashboard (Modo Dev)"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl border-2 font-black uppercase text-[8px] md:text-[10px] tracking-wider transition-all hover:scale-105 active:scale-95 shadow-lg cursor-pointer ${
                devBypassActive
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-amber-500/10 animate-pulse"
                  : "bg-white/5 border-white/10 text-slate-500 hover:text-slate-400"
              }`}
            >
              <Shield className={`w-3.5 h-3.5 ${devBypassActive ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">Dev Bypass: {devBypassActive ? 'ACTIVO' : 'INACTIVO'}</span>
              <span className="sm:hidden">Dev</span>
            </button>
          )}


          <div className="flex items-center gap-1.5 md:gap-2">
            {/* Dark toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title={theme === 'dark' ? 'Cambiar a Light' : 'Cambiar a Dark'}
              className={`p-2.5 md:p-5 rounded-2xl border transition-all hover:scale-110 ${
                theme === 'dark'
                  ? 'bg-white/5 border-white/10 text-cyan-400'
                  : theme === 'solarized'
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                  : 'bg-white border-slate-200 text-indigo-600 shadow-xl'
              }`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 md:w-7 md:h-7" /> : <Moon className="w-4 h-4 md:w-7 md:h-7" />}
            </button>
            {/* Solarized toggle */}
            <button
              onClick={() => setTheme(theme === 'solarized' ? 'dark' : 'solarized')}
              title={theme === 'solarized' ? 'Volver a Dark' : 'Tema Solarized Sunset'}
              className={`p-2.5 md:p-5 rounded-2xl border transition-all hover:scale-110 text-xs md:text-sm ${
                theme === 'solarized'
                  ? 'bg-orange-200/40 border-orange-300 text-orange-600 shadow-xl shadow-orange-500/20'
                  : 'bg-white/5 border-white/10 text-amber-500/60 hover:text-amber-400'
              }`}
            >
              🌅
            </button>
          </div>
          <button onClick={() => setIsChatOpen(true)} className="p-2.5 md:p-5 rounded-2xl bg-cyan-500 text-white border-cyan-400/20 shadow-2xl shadow-cyan-500/40 hover:scale-110 transition-all flex-shrink-0">
            <MessageSquare className="w-4 h-4 md:w-7 md:h-7" />
          </button>
        </div>
      </nav>


      <main className="pb-20 md:pb-32 px-4 md:px-16 max-w-[1900px] mx-auto">
        {/* Spacer para empujar el contenido por debajo de la navbar fija */}
        <div className="h-36 md:h-52" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-20">
          
          {/* THE CONSOLE (9 cols) */}
          <div className="lg:col-span-9">
            <ProtocolConsole theme={theme} />
          </div>

          {/* SIDEBAR (3 cols) */}
          <div className="lg:col-span-3 flex flex-col gap-12">
            <DemonAltar theme={theme} />
            {isEditingQuote ? (
              <div 
                className={`p-10 rounded-[3.5rem] border-2 relative overflow-hidden shadow-2xl ${theme === "dark" ? "bg-indigo-500/10 border-indigo-500/20" : "bg-indigo-50 border-indigo-200"}`}
              >
                <div className="flex items-center justify-between mb-6 text-indigo-500">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-indigo-500">ORACLE OVERRIDE</span>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-amber-500 animate-pulse">Editando Frase</span>
                </div>
                
                <textarea
                  value={quoteInput}
                  onChange={(e) => setQuoteInput(e.target.value)}
                  placeholder="Escribe tu frase motivacional del día..."
                  className="bg-[#030712]/80 text-sm text-slate-100 font-semibold py-3 px-4 rounded-xl border border-white/10 focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none resize-none h-28 w-full mb-4 leading-relaxed placeholder:text-slate-500"
                  autoFocus
                />
                
                <div className="flex justify-end gap-3">
                  <button 
                    onClick={() => {
                      setIsEditingQuote(false)
                      setQuoteInput(customQuote)
                    }}
                    className="px-4 py-2 border border-slate-500/30 text-slate-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleSaveQuote}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-indigo-600/30"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            ) : (
              <motion.div 
                whileHover={{ y: -5 }} 
                onClick={() => setIsEditingQuote(true)}
                className={`p-10 rounded-[3.5rem] border-2 relative overflow-hidden shadow-2xl cursor-pointer group ${theme === "dark" ? "bg-indigo-500/10 border-indigo-500/20" : "bg-indigo-50 border-indigo-200"}`}
                title="Haz clic para personalizar tu frase diaria"
              >
                <div className="flex items-center justify-between mb-6 text-indigo-500">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 animate-pulse" />
                    <span className="text-[11px] font-black uppercase tracking-widest">ORACLE OVERRIDE</span>
                  </div>
                  <Edit3 className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all text-indigo-400" />
                </div>
                <p className={`text-2xl font-[1000] italic uppercase leading-none tracking-tighter ${theme === "dark" ? "text-indigo-200" : "text-indigo-900"}`}>
                  {customQuote ? `"${customQuote}"` : <>"La vida es un código que se escribe segundo a segundo. <span className="text-cyan-500">Depura tu rutina</span> o el sistema colapsará."</>}
                </p>
                <div className="mt-6 text-[9px] font-black text-indigo-400/50 uppercase tracking-widest text-right opacity-0 group-hover:opacity-100 transition-all">
                  Haz clic para reprogramar frase
                </div>
              </motion.div>
            )}

            <FinancialShield theme={theme} />
            <SkillTree theme={theme} />

            <div className="p-10 rounded-[3.5rem] bg-white/5 border border-white/10 text-center backdrop-blur-sm">
              <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-cyan-400 to-indigo-600 mx-auto mb-8 flex items-center justify-center text-white shadow-[0_0_50px_rgba(34,211,238,0.3)]">
                <User className="w-12 h-12" />
              </div>
              <h3 className="text-3xl font-black uppercase italic tracking-tighter mb-2">Marty</h3>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-10 italic opacity-60">Architect of Johto Legacy</p>
              <button onClick={() => router.push("/onboarding?edit=true")} className="w-full py-6 rounded-[3rem] bg-white text-slate-900 font-[1000] uppercase text-xs tracking-widest hover:bg-cyan-400 transition-all shadow-[0_20px_40px_rgba(0,0,0,0.3)]">
                ACCEDER AL NÚCLEO
              </button>
            </div>
            {/* Accesos Secundarios totalmente ocultos y discretos para evitar tentaciones */}
            <div className="text-center mt-6 flex justify-center gap-6">
              <button 
                onClick={handleEnterEther}
                title="Simulador Pokémon (Éter)"
                className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500/25 hover:text-slate-400/50 transition-all cursor-pointer select-none"
              >
                V.0.4.2-ETHER
              </button>
              <button 
                onClick={handleGoToDashboard}
                title="Acceso al Dashboard"
                className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500/25 hover:text-slate-400/50 transition-all cursor-pointer select-none"
              >
                SYS-DASHBOARD
              </button>
            </div>
          </div>
        </div>
      </main>



      <OracleDrawer 
        tipo="mentor" 
        abierto={isChatOpen} 
        onToggle={() => setIsChatOpen(!isChatOpen)} 
        theme={(theme === 'solarized' ? 'dark' : theme) as 'dark' | 'light'} 
        userId="209a47ac-b113-4c1b-8a10-b33a99c55105"
      />

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100;400;900&display=swap');
        body {
          font-family: 'Outfit', sans-serif;
          letter-spacing: -0.04em;
        }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-thumb { background: rgba(156, 163, 175, 0.2); border-radius: 20px; }
        textarea::placeholder { color: currentColor; opacity: 0.2; font-weight: 900; font-size: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @media (max-width: 768px) {
          body { letter-spacing: -0.02em; }
        }
      `}</style>
    </div>
  )
}
