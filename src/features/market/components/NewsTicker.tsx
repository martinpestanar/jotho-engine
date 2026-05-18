"use client"

import { useEffect } from "react"
import { motion } from "framer-motion"
import type { NewsEvent } from "@/types/market"
import { TrendingUp, TrendingDown } from "lucide-react"

interface Props {
  news: NewsEvent[]
  loading: boolean
}

export default function NewsTicker({ news, loading }: Props) {
  const colors: Record<string, string> = {
    positive: "bg-plant-green/10 text-plant-green border-plant-green/20",
    negative: "bg-coral/10 text-coral border-coral/20",
    neutral: "bg-slate-50 text-slate-500 border-slate-200",
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-sm">
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-plant-green animate-pulse" />
          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Live Feed</span>
        </div>
      </div>
      <div className="flex overflow-x-auto gap-2 p-2 [scrollbar-width:none]">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="shrink-0 w-64 h-16 rounded-xl bg-slate-50 animate-pulse" />
            ))
          : news.map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`shrink-0 w-56 rounded-xl border p-3 ${colors[n.sentiment]}`}
              >
                <div className="flex items-center gap-1 mb-1">
                  {n.sentiment === "positive" ? <TrendingUp className="w-3 h-3" /> : n.sentiment === "negative" ? <TrendingDown className="w-3 h-3" /> : null}
                  <span className="text-[10px] font-semibold uppercase tracking-wider">{n.sentiment}</span>
                </div>
                <p className="text-xs font-medium line-clamp-2">{n.title}</p>
              </motion.div>
            ))}
      </div>
    </div>
  )
}
