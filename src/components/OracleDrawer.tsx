"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Send, Sparkles, Zap, Brain, Target, MessageSquare, ChevronRight, Bot, User as UserIcon } from "lucide-react"

interface Action {
  label: string
  payload: string
  style?: "primary" | "secondary" | "danger" | "outline"
}

interface Message {
  role: "oracle" | "user"
  content: string
  actions?: Action[]
  type?: "standard" | "protocol" | "achievement"
  timestamp?: Date
}

interface Props {
  tipo: "magnate" | "ingeniero" | "mentor"
  abierto: boolean
  onToggle: () => void
  theme?: "dark" | "light"
  userId?: string | null
}

const PERFILES = {
  magnate: {
    nombre: "El Magnate",
    titulo: "Consejero Financiero",
    sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/376.gif",
    saludo: "Bienvenido al centro de mando, inversionista. El mercado de PKD está listo para tu siguiente movimiento.",
    acento: "from-amber-400 to-orange-500",
    glow: "shadow-amber-500/40",
    bg: "bg-amber-500/10",
  },
  ingeniero: {
    nombre: "Oráculo Ingeniero",
    titulo: "Arquitecto de Sistemas",
    sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/474.gif",
    saludo: "Sistemas en línea. La optimización de tu flujo de trabajo es mi prioridad actual. ¿Qué compilamos hoy?",
    acento: "from-cyan-400 to-blue-600",
    glow: "shadow-cyan-500/40",
    bg: "bg-cyan-500/10",
  },
  mentor: {
    nombre: "Oráculo de la Disciplina",
    titulo: "Guardián del Éter",
    sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/249.gif",
    saludo: "Tu voluntad es el código que escribe tu destino. He preparado tus protocolos de hoy.",
    acento: "from-purple-600 to-indigo-700",
    glow: "shadow-indigo-500/40",
    bg: "bg-indigo-500/10",
  },
}

export default function OracleDrawer({ tipo, abierto, onToggle, theme = "dark", userId }: Props) {
  const perfil = PERFILES[tipo]
  const [mensajes, setMensajes] = useState<Message[]>([
    { 
      role: "oracle", 
      content: perfil.saludo,
      type: "standard",
      actions: [
        { label: "Ver Protocolos de Hoy", payload: "view_protocols", style: "primary" },
        { label: "Reportar Avance", payload: "report", style: "outline" }
      ]
    }
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth"
      })
    }
  }, [mensajes, isTyping])

  const enviar = async (textOverride?: string) => {
    const textToSend = textOverride || input
    if (!textToSend.trim()) return

    // Añadir mensaje del usuario localmente
    const userMsg: Message = { 
      role: "user", 
      content: textToSend,
      timestamp: new Date()
    }
    setMensajes((m) => [...m, userMsg])
    setInput("")
    setIsTyping(true)
    
    try {
      const response = await fetch("https://hooks.koratflow.agency/webhook/oracle-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId || "209a47ac-b113-4c1b-8a10-b33a99c55105", 
          user_message: textToSend,
          current_skill: tipo === "ingeniero" ? "Ingeniería" : (tipo === "magnate" ? "Finanzas" : "General"),
          current_hp: 100, 
          tipo_archivo: "text",
          context: {
            trainer_name: "Martin",
            profesion: "Architect",
            aura: tipo === "mentor" ? "gold" : (tipo === "ingeniero" ? "cyan" : "emerald")
          },
          timestamp: new Date().toISOString()
        })
      })

      if (!response.ok) throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`)

      const data = await response.json()
      console.log("🔮 Oráculo Response Raw:", data)
      
      const rawData = Array.isArray(data) ? data[0] : data
      let content = rawData.oracle_response || 
                      rawData.output || 
                      (rawData.json ? (rawData.json.oracle_response || rawData.json.output) : null) || 
                      rawData.text || 
                      rawData.message || ""
      
      let extraActions: any[] = []
      
      // Si el contenido trae un JSON de acciones al final (error común de n8n)
      if (typeof content === "string" && content.includes('{"actions":')) {
        try {
          const parts = content.split('{"actions":')
          const jsonStr = '{"actions":' + parts[1]
          const parsed = JSON.parse(jsonStr)
          extraActions = parsed.actions || []
          content = parts[0].trim() // Limpiamos el texto
        } catch (e) {
          console.error("❌ Error parseando acciones incrustadas", e)
        }
      }

      const oracleMsg: Message = {
        role: "oracle",
        content: content || "⚡ El Oráculo permanece en silencio. No se encontró respuesta válida.",
        actions: [...((rawData.actions || (rawData.json ? rawData.json.actions : null)) || []), ...extraActions],
        type: rawData.type || (rawData.json ? rawData.json.type : "standard"),
        timestamp: new Date()
      }

      setMensajes((m) => [...m, oracleMsg])
    } catch (error: any) {
      console.error("Oracle Error:", error)
      setMensajes((m) => [...m, { 
        role: "oracle", 
        content: `⚠️ El Éter está bloqueado: ${error.message || "Error desconocido"}.`,
        timestamp: new Date()
      }])
    } finally {
      setIsTyping(false)
    }
  }

  const handleAction = (action: Action) => {
    // Cuando se pulsa un botón, enviamos el payload como un comando invisible o el label como texto
    enviar(action.payload || action.label)
  }

  return (
    <AnimatePresence>
      {abierto && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6">
          {/* Overlay con desenfoque masivo */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onToggle}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-xl"
          />

          {/* Modal Central */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`relative w-full max-w-2xl h-[85vh] shadow-2xl flex flex-col overflow-hidden rounded-[2.5rem] border transition-colors duration-500 ${
              theme === "dark" 
                ? "bg-slate-900/90 border-white/10 text-white" 
                : "bg-white/95 border-slate-200 text-slate-900"
            }`}
          >
            {/* Header Flotante */}
            <div className={`p-6 border-b flex items-center justify-between z-10 ${
              theme === "dark" ? "bg-slate-900/50 border-white/5" : "bg-white/50 border-slate-100"
            } backdrop-blur-md`}>
              <div className="flex items-center gap-4">
                <div className={`relative w-12 h-12 rounded-2xl bg-gradient-to-br ${perfil.acento} flex items-center justify-center shadow-lg ${perfil.glow} group`}>
                  <img src={perfil.sprite} alt="" className="w-10 h-10 object-contain drop-shadow-md group-hover:scale-110 transition-transform" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest">{perfil.nombre}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{perfil.titulo}</p>
                </div>
              </div>
              <button 
                onClick={onToggle} 
                className={`p-3 rounded-2xl transition-all ${
                  theme === "dark" ? "hover:bg-white/10 text-slate-400" : "hover:bg-slate-100 text-slate-600"
                }`}
              >
                <X className="w-5 h-5"/>
              </button>
            </div>

            {/* Area de Chat */}
            <div 
              ref={scrollRef} 
              className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 scrollbar-thin scrollbar-thumb-slate-700"
            >
              {mensajes.map((m, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[85%] group`}>
                    <div className={`px-6 py-4 rounded-[1.8rem] text-sm leading-relaxed transition-all shadow-sm ${
                      m.role === "oracle"
                        ? (theme === "dark" 
                            ? "bg-slate-800/80 border border-white/10 text-slate-200" 
                            : "bg-slate-50 border border-slate-200 text-slate-700")
                        : `bg-gradient-to-br ${perfil.acento} text-white shadow-lg ${perfil.glow}`
                    }`}>
                      {m.content}
                    </div>

                    {/* Botones de Acción */}
                    {m.actions && m.actions.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {m.actions.map((action, idx) => (
                          <motion.button
                            key={idx}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleAction(action)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                              action.style === "primary"
                                ? `bg-gradient-to-r ${perfil.acento} text-white border-transparent shadow-md`
                                : theme === "dark"
                                  ? "border-white/10 text-slate-400 hover:text-white hover:border-white/20"
                                  : "border-slate-200 text-slate-500 hover:bg-slate-50"
                            }`}
                          >
                            {action.label}
                          </motion.button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className={`px-6 py-3 rounded-2xl ${theme === "dark" ? "bg-slate-800/50" : "bg-slate-100"} flex gap-1`}>
                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  </div>
                </div>
              )}
            </div>

            {/* Input Bar Estilo Moderno */}
            <div className={`p-6 border-t ${
              theme === "dark" ? "bg-slate-900/50 border-white/5" : "bg-slate-50/50 border-slate-100"
            } backdrop-blur-md`}>
              <div className="flex gap-3 items-center bg-black/5 dark:bg-white/5 rounded-[1.5rem] p-1.5 pl-5 border border-black/10 dark:border-white/10">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && enviar()}
                  placeholder="Escribe tu consulta..."
                  className="flex-1 bg-transparent py-3 text-sm focus:outline-none placeholder:text-slate-500 font-medium"
                />
                <button
                  onClick={() => enviar()}
                  className={`w-12 h-12 rounded-[1.1rem] flex items-center justify-center transition-all bg-gradient-to-br ${perfil.acento} text-white shadow-lg ${perfil.glow} hover:scale-105 active:scale-95 group`}
                >
                  <Send className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

