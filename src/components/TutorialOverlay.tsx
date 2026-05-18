"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, X, ChevronRight, Zap, BarChart3, Wallet } from "lucide-react"

const STEPS = [
  {
    title: "Bienvenido a la Terminal Johto",
    description: "Este es el hub financiero definitivo del mundo Pokémon. Aquí podrás monitorear el pulso de las empresas más grandes de la región.",
    icon: Sparkles,
    color: "text-amber-500"
  },
  {
    title: "Live Pulse Ticker",
    description: "La barra superior muestra precios en tiempo real y noticias de última hora. Si ves un destello, ¡es una oportunidad!",
    icon: Zap,
    color: "text-sky-500"
  },
  {
    title: "Insights del Mercado",
    description: "Monitorea el sentimiento global, el valor total de tus activos y la salud regional en el dashboard superior.",
    icon: BarChart3,
    color: "text-indigo-500"
  },
  {
    title: "Tu Portafolio",
    description: "Haz clic en cualquier activo para ver tu posición detallada, costo promedio y beneficios exclusivos para accionistas.",
    icon: Wallet,
    color: "text-emerald-500"
  }
]

export default function TutorialOverlay() {
  const [show, setShow] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    const hasSeen = localStorage.getItem("johto-tutorial-seen")
    if (!hasSeen) {
      setTimeout(() => setShow(true), 1500)
    }
  }, [])

  const finish = () => {
    localStorage.setItem("johto-tutorial-seen", "true")
    setShow(false)
  }

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1)
    else finish()
  }

  const Icon = STEPS[step].icon

  return (
    <AnimatePresence>
      {show && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-sm"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-white rounded-[3rem] shadow-2xl max-w-md w-full overflow-hidden border border-slate-100"
          >
            <div className="p-8">
              <div className="flex justify-between items-start mb-8">
                <div className={`w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center`}>
                  <Icon className={`w-7 h-7 ${STEPS[step].color}`} />
                </div>
                <button onClick={finish} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">
                {STEPS[step].title}
              </h2>
              <p className="text-slate-500 font-medium leading-relaxed mb-10">
                {STEPS[step].description}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex gap-1.5">
                  {STEPS.map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-1.5 rounded-full transition-all duration-500 ${i === step ? "w-8 bg-sky-500" : "w-1.5 bg-slate-200"}`} 
                    />
                  ))}
                </div>
                <button 
                  onClick={next}
                  className="bg-slate-950 text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg"
                >
                  <span>{step === STEPS.length - 1 ? "¡EMPEZAR!" : "SIGUIENTE"}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
