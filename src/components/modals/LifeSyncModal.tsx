"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useOracleStore } from "@/store/useOracleStore"
import { 
  Dna, 
  Target, 
  TrendingUp, 
  Coins, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles,
  Sun,
  CloudSun,
  Moon
} from "lucide-react"

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function LifeSyncModal({ isOpen, onClose }: Props) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    routine: { mañana: "", tarde: "", noche: "" },
    quarterly: ["", "", ""],
    annual: ["", ""],
    financial: 0
  })

  const { updateLifePlan, completeOnboarding } = useOracleStore()

  const nextStep = () => setStep(s => s + 1)
  const prevStep = () => setStep(s => s - 1)

  const handleSave = async () => {
    await updateLifePlan({
      routine_base: formData.routine,
      quarterly_goals: formData.quarterly.filter(g => g),
      annual_goals: formData.annual.filter(g => g),
      financial_goal: formData.financial
    })
    await completeOnboarding()
    onClose()
  }

  const steps = [
    {
      title: "Sincronización de Rutina",
      subtitle: "Define tu base de operaciones diaria",
      icon: <Dna className="w-6 h-6" />,
      content: (
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2 mb-3 text-amber-600 font-bold text-sm">
              <Sun className="w-4 h-4" /> Mañanas (Ej. Gym, Meditación)
            </div>
            <input 
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-400 outline-none transition-all"
              placeholder="¿Qué haces al despertar?"
              value={formData.routine.mañana}
              onChange={e => setFormData({ ...formData, routine: { ...formData.routine, mañana: e.target.value } })}
            />
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2 mb-3 text-blue-600 font-bold text-sm">
              <CloudSun className="w-4 h-4" /> Tardes (Ej. n8n, Trabajo)
            </div>
            <input 
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-400 outline-none transition-all"
              placeholder="Tu bloque productivo principal"
              value={formData.routine.tarde}
              onChange={e => setFormData({ ...formData, routine: { ...formData.routine, tarde: e.target.value } })}
            />
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2 mb-3 text-indigo-600 font-bold text-sm">
              <Moon className="w-4 h-4" /> Noches (Ej. Inglés, Lectura)
            </div>
            <input 
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-400 outline-none transition-all"
              placeholder="¿Cómo cierras el día?"
              value={formData.routine.noche}
              onChange={e => setFormData({ ...formData, routine: { ...formData.routine, noche: e.target.value } })}
            />
          </div>
        </div>
      )
    },
    {
      title: "Metas Trimestrales",
      subtitle: "Objetivos Nivel 10 (Próximos 90 días)",
      icon: <Target className="w-6 h-6" />,
      content: (
        <div className="space-y-4">
          <p className="text-xs text-slate-500 italic">"Un trimestre es el tiempo perfecto para ver resultados reales."</p>
          {formData.quarterly.map((g, i) => (
            <input 
              key={i}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-400 outline-none transition-all"
              placeholder={`Meta ${i + 1}`}
              value={g}
              onChange={e => {
                const next = [...formData.quarterly]
                next[i] = e.target.value
                setFormData({ ...formData, quarterly: next })
              }}
            />
          ))}
        </div>
      )
    },
    {
      title: "Evolución a Largo Plazo",
      subtitle: "¿Dónde estarás en 3 años?",
      icon: <TrendingUp className="w-6 h-6" />,
      content: (
        <div className="space-y-4">
          {formData.annual.map((g, i) => (
            <textarea 
              key={i}
              rows={3}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-400 outline-none transition-all resize-none"
              placeholder={`Visión ${i + 1}`}
              value={g}
              onChange={e => {
                const next = [...formData.annual]
                next[i] = e.target.value
                setFormData({ ...formData, annual: next })
              }}
            />
          ))}
        </div>
      )
    },
    {
      title: "Libertad Financiera",
      subtitle: "La meta del Magnate",
      icon: <Coins className="w-6 h-6" />,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-slate-600 mb-2">Ingreso Mensual Objetivo (USD)</p>
            <input 
              type="number"
              className="w-full max-w-[200px] bg-amber-50 border-2 border-amber-200 rounded-2xl px-6 py-4 text-2xl font-bold text-amber-700 text-center outline-none focus:ring-4 focus:ring-amber-400/20"
              value={formData.financial}
              onChange={e => setFormData({ ...formData, financial: Number(e.target.value) })}
            />
          </div>
          <div className="bg-slate-900 p-6 rounded-3xl text-white relative overflow-hidden">
            <div className="relative z-10 flex items-start gap-4">
              <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/376.gif" className="w-12 h-12" alt="Metagross" />
              <div>
                <p className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-1">Nota del Magnate</p>
                <p className="text-xs leading-relaxed text-slate-300">
                  "Alinearemos tus inversiones y consejos de trading para alcanzar este número. La disciplina es el interés compuesto del alma."
                </p>
              </div>
            </div>
            <Sparkles className="absolute right-[-10px] bottom-[-10px] w-24 h-24 text-white/5 rotate-12" />
          </div>
        </div>
      )
    }
  ]

  const current = steps[step - 1]

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden"
          >
            {/* Header / Progress */}
            <div className="px-8 pt-8 pb-4 flex items-center justify-between">
              <div className="flex gap-1.5">
                {[1, 2, 3, 4].map(s => (
                  <div 
                    key={s} 
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      s === step ? "w-8 bg-cyan-500" : s < step ? "w-4 bg-cyan-200" : "w-4 bg-slate-100"
                    }`} 
                  />
                ))}
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">✕</button>
            </div>

            {/* Content */}
            <div className="px-8 pb-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-500 flex items-center justify-center">
                  {current.icon}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{current.title}</h2>
                  <p className="text-sm text-slate-500">{current.subtitle}</p>
                </div>
              </div>

              <motion.div
                key={step}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="min-h-[300px]"
              >
                {current.content}
              </motion.div>

              {/* Navigation */}
              <div className="mt-8 flex gap-3">
                {step > 1 && (
                  <button 
                    onClick={prevStep}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-slate-50 text-slate-600 font-bold text-sm hover:bg-slate-100 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" /> Atrás
                  </button>
                )}
                <button 
                  onClick={step === 4 ? handleSave : nextStep}
                  className="flex-[2] flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all active:scale-95"
                >
                  {step === 4 ? "Finalizar Sincronización" : "Continuar"} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Decoration */}
            <div className="absolute top-0 right-0 p-8 pointer-events-none opacity-5">
               <Dna className="w-32 h-32 text-slate-900" />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
