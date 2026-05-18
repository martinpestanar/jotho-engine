"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { Company, PricePoint } from "@/types/market"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import { Zap, Search } from "lucide-react"

interface Props {
  stocks: Company[]
  selected: string | null
  onSelect: (t: string) => void
  loading: boolean
}

export default function StockList({ stocks, selected, onSelect, loading }: Props) {
  const [query, setQuery] = useState("")
  const filtered = query.trim() ? stocks.filter((s) => `${s.ticker} ${s.name} ${s.sector}`.toLowerCase().includes(query.toLowerCase())) : stocks

  return (
    <div className="space-y-2">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search ticker or company..."
          className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white border border-slate-200 text-sm text-navy placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-joycon-cyan/30 focus:border-joycon-cyan transition-all"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-1.5">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-16 rounded-2xl bg-white border border-slate-100 animate-pulse" />)}</div>
      ) : (
        <div className="space-y-1.5 max-h-[calc(100vh-280px)] overflow-y-auto custom-scroll">
          {filtered.map((s, i) => (
            <motion.button
              key={s.ticker}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.015, type: "spring", stiffness: 160, damping: 20 }}
              onClick={() => onSelect(s.ticker)}
              className={`w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${
                selected === s.ticker
                  ? "bg-white border-joycon-cyan/40 shadow-md"
                  : "bg-white border-slate-100 shadow-sm hover:border-slate-200"
              }`}
            >
              <img src={s.ceo_sprite} alt="" className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 p-1.5" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden") }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold text-navy">{s.ticker}</p>
                  <span className="text-[10px] text-slate-400 bg-slate-100 rounded-full px-1.5 py-0.5">{s.region}</span>
                </div>
                <p className="text-[10px] text-slate-500 truncate">{s.ceo_name} &middot; {s.ceo_title}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold font-mono text-navy">&yen;{s.current_price.toFixed(1)}</p>
                <p className={`text-[11px] font-semibold ${s.change_percent >= 0 ? "text-plant-green" : "text-coral"}`}>
                  {s.change_percent >= 0 ? "+" : ""}{s.change_percent.toFixed(2)}%
                </p>
              </div>
            </motion.button>
          ))}
          {filtered.length === 0 && <p className="text-xs text-slate-400 text-center py-8">No matching companies</p>}
        </div>
      )}
    </div>
  )
}
