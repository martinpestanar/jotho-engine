"use client"

import { useState, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/store/useAppStore"
import OracleDrawer from "@/components/OracleDrawer"
import { ArrowLeft, Check, Upload, Mic, Send, BookOpen, Wrench, Award, Sparkles } from "lucide-react"

export default function LaboratorioPage() {
  const router = useRouter()
  const { laboratorio } = useAppStore()
  const [drawerAbierto, setDrawerAbierto] = useState(false)
  const [seleccionada, setSeleccionada] = useState<string | null>(null)
  const [archivoSubido, setArchivoSubido] = useState(false)
  const [grabando, setGrabando] = useState(false)
  const [enviada, setEnviada] = useState(false)
  const [preguntaQuiz, setPreguntaQuiz] = useState(0)
  const [respuestasQuiz, setRespuestasQuiz] = useState<number[]>([])
  const ingFile = useRef<HTMLInputElement>(null)

  const misionActiva = laboratorio.misiones.find((m) => m.id === seleccionada)
  const esPractica = misionActiva?.tipo === "PRACTICA"
  const quizCompletado = preguntaQuiz >= 5 && esPractica === false
  const esTeorica = misionActiva?.tipo === "TEORICA"

  const preguntas = [
    { p: "¿Qué etiqueta debe tener la salida del nodo de IA en n8n?", o: ["data", "edited", "output", "response"], r: 0 },
    { p: "¿Cuál es el límite de ejecución por workflow en n8n Cloud?", o: ["100", "500", "2500", "Ilimitado"], r: 2 },
  ]

  const handleSubir = useCallback(() => {
    setArchivoSubido(true)
    setTimeout(() => setArchivoSubido(false), 3000)
  }, [])

  const handleEnviar = useCallback(() => {
    setEnviada(true)
    setTimeout(() => setEnviada(false), 3000)
  }, [])

  const responderQuiz = (idx: number) => {
    setRespuestasQuiz((prev) => [...prev, idx])
    setTimeout(() => setPreguntaQuiz((p) => p + 1), 600)
  }

  return (
    <div className="min-h-screen bg-page">
      {/* Header cyan */}
      <header className="sticky top-0 z-30 bg-white/70 backdrop-blur border-b border-slate-100 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/dashboard")} className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 shadow-sm"><ArrowLeft className="w-4 h-4 text-slate-500" /></button>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-electric flex items-center justify-center">
              <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/ether.png" alt="" className="w-4 h-4 object-contain brightness-0 invert" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-navy">Laboratorio de Habilidades</h1>
              <p className="text-[9px] text-slate-400">Academia técnica · Misiones disponibles</p>
            </div>
          </div>
          <button onClick={() => setDrawerAbierto(!drawerAbierto)} className="text-[10px] font-bold text-cyan-600 bg-cyan-50 rounded-full px-3 py-1.5 hover:bg-cyan-100">🔧 Ingeniero</button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT: Mission list */}
        <div className="lg:col-span-5 space-y-3">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Misiones Disponibles</p>
          {laboratorio.misiones.map((m, i) => (
            <motion.button key={m.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              onClick={() => setSeleccionada(m.id)}
              className={`w-full text-left p-5 rounded-3xl border-2 transition-all ${
                seleccionada === m.id
                  ? "bg-white border-cyan-400/50 shadow-lg shadow-cyan-500/10"
                  : "bg-white/80 backdrop-blur border-slate-100 shadow-sm hover:border-cyan-200"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${m.tipo === "PRACTICA" ? "bg-cyan-100" : "bg-cyan-50"}`}>
                  {m.tipo === "PRACTICA" ? <Wrench className="w-6 h-6 text-cyan-600" /> : <BookOpen className="w-6 h-6 text-cyan-500" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-navy">{m.titulo}</span>
                    <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${m.tipo === "PRACTICA" ? "bg-cyan-100 text-cyan-700" : "bg-slate-100 text-slate-500"}`}>{m.tipo === "PRACTICA" ? "Práctica" : "Teoría"}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">{m.descripcion}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Award className="w-3.5 h-3.5 text-cyan-500" />
                    <span className="text-[10px] font-semibold text-cyan-600">{m.recompensa}</span>
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* RIGHT: Workspace */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {misionActiva ? (
              <motion.div key={misionActiva.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                {/* Requirement card */}
                <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-3xl border border-cyan-100 shadow-sm p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/474.gif"
                      alt="" className="w-8 h-8 object-contain" onError={(e) => { (e.target as HTMLImageElement).src = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/ether.png" }} />
                    <p className="text-sm font-bold text-cyan-800">Oráculo Ingeniero</p>
                  </div>
                  <p className="text-xs text-cyan-700/80 leading-relaxed">{misionActiva.descripcion}</p>
                  <div className="flex items-center gap-2 mt-3 text-[10px] text-cyan-600">
                    <Award className="w-3.5 h-3.5" /> Recompensa: {misionActiva.recompensa}
                  </div>
                </div>

                {/* Quiz mode */}
                {esTeorica && !quizCompletado && preguntas[preguntaQuiz] && (
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">Pregunta {preguntaQuiz + 1}/{preguntas.length}</span>
                      <div className="flex gap-1">
                        {preguntas.map((_, i) => <div key={i} className={`w-5 h-1 rounded-full ${i < preguntaQuiz ? "bg-cyan-500" : i === preguntaQuiz ? "bg-cyan-300" : "bg-slate-200"}`} />)}
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-navy">{preguntas[preguntaQuiz].p}</p>
                    <div className="space-y-2">
                      {preguntas[preguntaQuiz].o.map((opt, i) => {
                        const p = preguntas[preguntaQuiz]
                        const respondio = respuestasQuiz.length > preguntaQuiz
                        const correcta = respondio && i === p.r
                        const incorrecta = respondio && respuestasQuiz[preguntaQuiz] === i && i !== p.r
                        return (
                          <motion.button key={i} whileHover={!respondio ? { scale: 1.01 } : {}} whileTap={!respondio ? { scale: 0.99 } : {}}
                            disabled={respondio}
                            onClick={() => responderQuiz(i)}
                            className={`w-full text-left p-3 rounded-2xl border text-xs transition-all ${
                              correcta ? "border-plant-green bg-plant-green/5 text-plant-green font-bold" :
                              incorrecta ? "border-coral bg-coral/5 text-coral font-bold" :
                              "border-slate-100 bg-white text-navy hover:border-slate-200"
                            }`}
                          >{opt}</motion.button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {esTeorica && quizCompletado && (
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 text-center">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-14 h-14 mx-auto rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center mb-3">
                      <Check className="w-7 h-7 text-cyan-500" />
                    </motion.div>
                    <p className="text-base font-bold text-navy">¡Quiz completado!</p>
                    <p className="text-xs text-slate-400 mt-1">Correctas: {respuestasQuiz.filter((r, i) => r === preguntas[i]?.r).length}/{preguntas.length}</p>
                  </div>
                )}

                {/* Practical mode */}
                {esPractica && (
                  <>
                    {/* Upload */}
                    <div onClick={() => ingFile.current?.click()}
                      className={`bg-white rounded-3xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${archivoSubido ? "border-plant-green bg-plant-green/5" : "border-slate-200 hover:border-cyan-400/50"}`}>
                      <input ref={ingFile} type="file" accept="image/*" onChange={handleSubir} className="hidden" />
                      {archivoSubido ? (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><Check className="w-10 h-10 text-plant-green mx-auto mb-1" /><p className="text-sm text-plant-green font-semibold">Captura subida correctamente</p></motion.div>
                      ) : (
                        <><Upload className="w-10 h-10 text-slate-300 mx-auto mb-1" /><p className="text-sm text-slate-400">Arrastra tu captura de pantalla</p><p className="text-[10px] text-slate-300 mt-1">o haz clic para seleccionar archivo</p></>
                      )}
                    </div>

                    {/* Audio */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5"><Mic className="w-3.5 h-3.5 text-cyan-500" /> Explicación Técnica</p>
                      <button
                        onMouseDown={() => setGrabando(true)} onMouseUp={() => setGrabando(false)} onMouseLeave={() => setGrabando(false)}
                        className={`w-full py-4 rounded-full flex items-center justify-center gap-2 text-sm font-bold transition-all ${grabando ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/30 scale-105" : "bg-slate-100 text-navy hover:bg-slate-200"}`}
                      >
                        <Mic className="w-5 h-5" /> {grabando ? "Grabando..." : "Presiona para grabar"}
                      </button>
                      {grabando && (
                        <div className="flex items-center gap-0.5 justify-center mt-3 h-8">
                          {Array.from({ length: 24 }).map((_, i) => (
                            <motion.div key={i} animate={{ height: [4, Math.random() * 28 + 4, 4] }} transition={{ duration: 0.5 + Math.random() * 0.5, repeat: Infinity }} className="w-1 bg-cyan-500 rounded-full" />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Submit */}
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={handleEnviar}
                      className="w-full py-3.5 rounded-full bg-gradient-to-r from-cyan-500 to-electric text-white font-bold text-sm shadow-lg shadow-cyan-500/20">
                      <Send className="w-4 h-4 mr-1.5 inline" /> Enviar para Revisión
                    </motion.button>

                    {enviada && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-plant-green/10 border border-plant-green/20 rounded-3xl p-3 text-center">
                        <p className="text-xs text-plant-green font-semibold">✅ Misión enviada. El Oráculo Ingeniero la revisará.</p>
                      </motion.div>
                    )}
                  </>
                )}
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-96 bg-white/80 backdrop-blur rounded-3xl border border-slate-100 shadow-sm p-8 text-center">
                <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/474.gif" alt="" className="w-16 h-16 object-contain opacity-30 mb-4" onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} />
                <p className="text-base font-bold text-navy">Terminal del Ingeniero</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">Selecciona una misión del panel izquierdo para comenzar tu entrenamiento técnico.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <OracleDrawer 
        tipo="ingeniero" 
        abierto={drawerAbierto} 
        onToggle={() => setDrawerAbierto(!drawerAbierto)} 
        userId="209a47ac-b113-4c1b-8a10-b33a99c55105"
      />
    </div>
  )
}
