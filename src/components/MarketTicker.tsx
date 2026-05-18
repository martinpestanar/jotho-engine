"use client"

import { motion } from "framer-motion"
import { useTradeStore } from "@/store/useTradeStore"
import { TrendingUp, TrendingDown, Newspaper } from "lucide-react"

export default function MarketTicker() {
  const { empresas, noticias } = useTradeStore()

  // Combinar empresas y noticias para el scroll
  const tickerItems = [
    ...empresas.map(e => ({ type: 'price', label: e.ticker, value: `$${e.precio_actual.toFixed(2)}`, variation: e.variacion_24h })),
  ]

  // Duplicar para el efecto infinite scroll
  const scrollItems = [...tickerItems, ...tickerItems]

  return (
    <div className="w-full bg-slate-50 text-slate-900 overflow-hidden py-2 border-y border-slate-200 flex items-center shadow-sm relative z-40">
      <div className="flex items-center gap-2 px-4 border-r border-slate-200 bg-slate-50 relative z-10 shrink-0">
        <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Live Pulse</span>
      </div>
      
      <motion.div 
        className="flex items-center gap-12 whitespace-nowrap"
        animate={{ x: [0, -1000] }}
        transition={{ 
          duration: 30, 
          repeat: Infinity, 
          ease: "linear" 
        }}
      >
        {scrollItems.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            {item.type === 'price' ? (
              <>
                <span className="text-xs font-black tracking-tight text-slate-900">{item.label}</span>
                <span className="text-xs font-mono font-bold text-slate-500">{item.value}</span>
                <span className={`text-[10px] font-black flex items-center gap-0.5 ${item.variation >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {item.variation >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(item.variation).toFixed(1)}%
                </span>
              </>
            ) : (
              <>
                <span className="text-[9px] font-black px-1.5 py-0.5 bg-sky-500 rounded-md text-white">{item.label}</span>
                <span className="text-xs font-bold text-slate-700 italic flex items-center gap-2">
                  <Newspaper className="w-3 h-3 text-sky-600" />
                  {item.value}
                </span>
              </>
            )}
            <span className="text-slate-700 font-bold ml-4 opacity-30">|</span>
          </div>
        ))}
      </motion.div>
    </div>
  )
}
