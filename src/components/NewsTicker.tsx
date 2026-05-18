"use client"

import { motion } from "framer-motion"
import { useTradeStore, Noticia } from "@/store/useTradeStore"
import { Newspaper, AlertCircle, TrendingUp, TrendingDown, Info } from "lucide-react"

interface NewsTickerProps {
  onNewsClick: (news: Noticia) => void
}

export default function NewsTicker({ onNewsClick }: NewsTickerProps) {
  const { noticias } = useTradeStore()
  
  // Filtrar solo noticias activas para la pasarela
  const noticiasActivas = noticias.filter(n => n.estado === 'ACTIVA' || !n.estado)

  if (noticiasActivas.length === 0) return null

  // Duplicar para el efecto infinite scroll
  const scrollItems = [...noticiasActivas, ...noticiasActivas]

  const getSentimentIcon = (tipo?: string) => {
    switch (tipo) {
      case 'CRISIS': return <AlertCircle className="w-4 h-4 text-rose-500 animate-pulse" />
      case 'BULLISH': return <TrendingUp className="w-4 h-4 text-emerald-500" />
      case 'NEGATIVA': return <TrendingDown className="w-4 h-4 text-rose-500" />
      case 'POSITIVA': return <TrendingUp className="w-4 h-4 text-sky-500" />
      default: return <Info className="w-4 h-4 text-slate-400" />
    }
  }

  const getBadgeColor = (tipo?: string) => {
    switch (tipo) {
      case 'CRISIS': return 'bg-rose-600 text-white shadow-lg shadow-rose-500/20'
      case 'BULLISH': return 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
      case 'NEGATIVA': return 'bg-rose-500 text-white'
      case 'POSITIVA': return 'bg-sky-500 text-white'
      default: return 'bg-slate-700 text-white'
    }
  }

  return (
    <div className="w-full bg-slate-900 text-white overflow-hidden py-3 border-b border-white/10 flex items-center shadow-xl relative z-40 group cursor-pointer">
      <div className="flex items-center gap-3 px-6 border-r border-white/20 bg-slate-900 relative z-10 shrink-0 h-full">
        <div className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-sky-400" />
          Live Headlines
        </span>
      </div>
      
      <motion.div 
        className="flex items-center gap-16 whitespace-nowrap"
        animate={{ x: [0, -2000] }}
        transition={{ 
          duration: 60, 
          repeat: Infinity, 
          ease: "linear" 
        }}
        whileHover={{ animationPlayState: 'paused' }}
      >
        {scrollItems.map((news, i) => (
          <button 
            key={`${news.id}-${i}`} 
            onClick={() => onNewsClick(news)}
            className="flex items-center gap-4 hover:text-sky-300 transition-colors group/item"
          >
            <div className={`px-2 py-0.5 rounded text-[9px] font-black tracking-widest uppercase flex items-center gap-1.5 ${getBadgeColor(news.noticia_tipo)}`}>
              {getSentimentIcon(news.noticia_tipo)}
              {news.noticia_tipo || 'REPORT'}
            </div>
            
            <div className="flex flex-col">
              <span className="text-xs font-black tracking-wide flex items-center gap-2">
                {news.titulo}
                <span className="text-[9px] font-normal opacity-40 uppercase tracking-tighter">[{news.fuente || 'JFT'}]</span>
              </span>
            </div>
            
            <span className="text-white/20 font-black ml-8 group-hover/item:text-sky-500 transition-colors">/ / /</span>
          </button>
        ))}
      </motion.div>

      {/* Fade effects on edges */}
      <div className="absolute top-0 right-0 h-full w-20 bg-gradient-to-l from-slate-900 to-transparent pointer-events-none z-20" />
    </div>
  )
}
