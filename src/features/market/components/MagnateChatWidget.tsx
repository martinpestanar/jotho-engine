"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useTradeStore } from "@/store/useTradeStore"
import { X, MessageSquare } from "lucide-react"

const MENSAJES_BURBUJA = [
  "Silph Co. está acumulando volumen...",
  "¿Ya revisaste tu portafolio hoy?",
  "El Ether se siente volátil esta mañana.",
  "Mu-mu Milk reporta ganancias récord.",
  "Dicen que Devon tiene un nuevo fósil.",
  "El mercado huele a oportunidad.",
  "Rocket Corp no es para débiles.",
]

const CHAT_INICIAL = [
  { emisor: "magnate", texto: "Bienvenido, joven inversor. El mercado está lleno de oportunidades para quien sabe verlas." },
  { emisor: "magnate", texto: "Recuerda: disciplina en la vida real = dividendos en el EGP." },
]

export default function MagnateChatWidget() {
  const [abierto, setAbierto] = useState(false)
  const [mensajes, setMensajes] = useState(CHAT_INICIAL)
  const [input, setInput] = useState("")
  const [burbuja, setBurbuja] = useState<string | null>(null)
  const fondoRef = useRef<HTMLDivElement>(null)

  // Burbuja ocasional
  useEffect(() => {
    const t = setInterval(() => {
      setBurbuja(MENSAJES_BURBUJA[Math.floor(Math.random() * MENSAJES_BURBUJA.length)])
      setTimeout(() => setBurbuja(null), 5000)
    }, 25000)
    return () => clearInterval(t)
  }, [])

  const enviar = () => {
    if (!input.trim()) return
    setMensajes((m) => [...m, { emisor: "yo", texto: input.trim() }])
    setInput("")
    setTimeout(() => {
      setMensajes((m) => [...m, { emisor: "magnate", texto: ["Interesante perspectiva...", "Buena observación.", "El tiempo lo dirá.", "Los grandes inversores piensan así."][Math.floor(Math.random() * 4)] }])
      if (fondoRef.current) fondoRef.current.scrollTop = fondoRef.current.scrollHeight
    }, 1200)
  }

  return (
    <>
      {/* Tooltip burbuja */}
      <AnimatePresence>
        {burbuja && !abierto && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="fixed bottom-24 right-6 z-50 max-w-[200px] bg-white rounded-2xl border border-amber-200 shadow-lg p-3"
          >
            <p className="text-[10px] text-amber-700 leading-relaxed">{burbuja}</p>
            <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-white border-r border-b border-amber-200 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botón flotante */}
      <motion.button
        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
        onClick={() => setAbierto(!abierto)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg flex items-center justify-center"
      >
        {abierto ? <X className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
      </motion.button>

      {/* Ventana de chat */}
      <AnimatePresence>
        {abierto && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 w-80 bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-400 to-orange-500 p-4 text-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-lg">🎩</div>
                <div>
                  <p className="text-sm font-bold">El Magnate</p>
                  <p className="text-[9px] text-white/70">Consejero Financiero</p>
                </div>
              </div>
            </div>
            {/* Mensajes */}
            <div ref={fondoRef} className="h-64 overflow-y-auto p-3 space-y-2 bg-slate-50/50">
              {mensajes.map((m, i) => (
                <div key={i} className={`flex ${m.emisor === "yo" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] p-2.5 rounded-2xl text-xs leading-relaxed ${m.emisor === "yo" ? "bg-joycon-cyan text-white rounded-br-sm" : "bg-white border border-slate-100 text-navy rounded-bl-sm"}`}>
                    {m.texto}
                  </div>
                </div>
              ))}
            </div>
            {/* Input */}
            <div className="p-3 border-t border-slate-100 flex gap-2">
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && enviar()} placeholder="Pregunta al Magnate..." className="flex-1 text-xs rounded-full bg-slate-50 border border-slate-200 px-3 py-1.5 outline-none focus:ring-2 focus:ring-joycon-cyan/30" />
              <button onClick={enviar} className="text-xs font-bold text-white bg-joycon-cyan rounded-full px-3 py-1.5 hover:bg-joycon-cyan/80">Enviar</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
