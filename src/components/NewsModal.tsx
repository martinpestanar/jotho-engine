"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Noticia } from "@/store/useTradeStore"
import { X, Newspaper, AlertCircle, TrendingUp, TrendingDown, Clock, User, Globe } from "lucide-react"

interface NewsModalProps {
  noticia: Noticia | null
  onClose: () => void
}

export default function NewsModal({ noticia, onClose }: NewsModalProps) {
  if (!noticia) return null

  const getSentimentIcon = (tipo?: string) => {
    switch (tipo) {
      case 'CRISIS': return <AlertCircle className="w-5 h-5 text-rose-500" />
      case 'BULLISH': return <TrendingUp className="w-5 h-5 text-emerald-500" />
      case 'NEGATIVA': return <TrendingDown className="w-5 h-5 text-rose-500" />
      case 'POSITIVA': return <TrendingUp className="w-5 h-5 text-sky-500" />
      default: return <Newspaper className="w-5 h-5 text-slate-400" />
    }
  }

  const getHeaderColor = (tipo?: string) => {
    switch (tipo) {
      case 'CRISIS': return 'bg-rose-500/10 border-rose-500/20 text-rose-600'
      case 'BULLISH': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
      case 'NEGATIVA': return 'bg-rose-500/5 border-rose-500/10 text-rose-500'
      case 'POSITIVA': return 'bg-sky-500/10 border-sky-500/20 text-sky-600'
      default: return 'bg-slate-100 border-slate-200 text-slate-600'
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header Bar */}
          <div className={`px-6 py-4 border-b flex items-center justify-between ${getHeaderColor(noticia.noticia_tipo)}`}>
            <div className="flex items-center gap-2">
              {getSentimentIcon(noticia.noticia_tipo)}
              <span className="font-black uppercase tracking-widest text-sm">
                {noticia.noticia_tipo || 'REPORTE DE MERCADO'}
              </span>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-black/5 rounded-full transition-colors">
              <X className="w-5 h-5 opacity-50" />
            </button>
          </div>

          <div className="p-8">
            {/* Meta Data */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-500 mb-6">
              <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md">
                <Globe className="w-3.5 h-3.5" />
                {noticia.fuente || 'Johto Financial Times'}
              </div>
              <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md">
                <User className="w-3.5 h-3.5" />
                {noticia.autor || 'Redacción JFT'}
              </div>
              <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md">
                <Clock className="w-3.5 h-3.5" />
                {new Date(noticia.publicada_en).toLocaleString()}
              </div>
            </div>

            {/* Title & Body */}
            <h2 className="text-2xl font-black text-slate-900 mb-4 leading-tight">
              {noticia.titulo}
            </h2>
            <p className="text-slate-600 leading-relaxed text-lg mb-8">
              {noticia.descripcion}
            </p>

            {/* Impact Analysis */}
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Análisis de Impacto</h3>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Ticker Afectado</span>
                  <span className="font-mono font-black text-slate-700 bg-slate-200/50 px-2 py-0.5 rounded">
                    {noticia.ticker_afectado}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Sentimiento</span>
                  <span className="font-bold text-slate-700 capitalize">
                    {noticia.sentimiento}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Factor de Impacto</span>
                  <span className={`font-black ${noticia.factor_impacto >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {noticia.factor_impacto > 0 ? '+' : ''}{(noticia.factor_impacto * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
