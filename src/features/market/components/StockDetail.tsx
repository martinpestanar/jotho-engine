"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import type { Company, PricePoint } from "@/types/market"
import { Zap } from "lucide-react"

interface Props {
  stock: Company | undefined
  history: PricePoint[]
  balance: number
  onTrade: (action: "buy" | "sell", shares: number) => void
}

export default function StockDetail({ stock, history, balance, onTrade }: Props) {
  const [qty, setQty] = useState(1)
  const [msg, setMsg] = useState<string | null>(null)

  if (!stock) return <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 text-center text-slate-400">Select a stock to begin</div>

  const cost = stock.current_price * qty

  const handleTrade = (action: "buy" | "sell") => {
    onTrade(action, qty)
    setMsg(`${action === "buy" ? "Bought" : "Sold"} ${qty} ${stock.ticker} @ ¥${stock.current_price.toFixed(1)}`)
    setTimeout(() => setMsg(null), 2500)
  }

  return (
    <div className="space-y-4">
      {/* Stock header with lore */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
            <img src={stock.ceo_sprite} alt={stock.ceo_name} className="w-10 h-10 object-contain" loading="lazy" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
                <p className="text-lg font-bold text-navy">{stock.ticker}</p>
                <span className="text-xs text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">{stock.region}</span>
                <span className="text-xs text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">{stock.sector}</span>
            </div>
            <p className="text-sm text-navy/70">{stock.name}</p>
            <p className="text-xs text-slate-400 mt-0.5">{stock.ceo_title} &middot; {stock.ceo_name}</p>
            <div className="flex items-center gap-3 mt-2">
              <p className="text-2xl font-bold font-mono text-navy">¥{stock.current_price.toFixed(1)}</p>
              <p className={`text-xs font-semibold ${stock.change_percent >= 0 ? "text-plant-green" : "text-coral"}`}>
                {stock.change_percent >= 0 ? "▲" : "▼"} {Math.abs(stock.change_percent).toFixed(2)}%
              </p>
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-3 leading-relaxed italic border-t border-slate-50 pt-3">
          {stock.description}
        </p>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={history} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gradDetail" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00C3E3" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#00C3E3" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="time" tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis domain={["auto", "auto"]} tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `¥${v}`} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0" }} />
            <Area type="monotone" dataKey="price" stroke="#00C3E3" strokeWidth={2} fill="url(#gradDetail)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Trading Panel */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Trade</p>
          <span className="text-xs text-slate-400 font-mono">Wallet: ¥{balance.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm text-navy/70">Shares:</span>
          <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-8 h-8 rounded-full bg-slate-100 text-navy font-bold hover:bg-slate-200">−</button>
          <input type="number" value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))} className="w-16 text-center text-sm font-mono font-bold text-navy bg-slate-50 border border-slate-200 rounded-xl py-1.5 outline-none focus:ring-2 focus:ring-joycon-cyan/30" />
          <button onClick={() => setQty(qty + 1)} className="w-8 h-8 rounded-full bg-slate-100 text-navy font-bold hover:bg-slate-200">+</button>
          <span className="text-xs text-slate-400 font-mono ml-auto">= ¥{cost.toLocaleString()}</span>
        </div>
        <div className="flex gap-3">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleTrade("buy")} className="flex-1 py-3 rounded-full bg-gradient-to-r from-plant-green to-emerald-500 text-white font-bold text-sm shadow-sm">
            <Zap className="w-4 h-4 mr-1.5 inline" /> BUY
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleTrade("sell")} className="flex-1 py-3 rounded-full bg-gradient-to-r from-coral to-nintendo-red text-white font-bold text-sm shadow-sm">
            SELL
          </motion.button>
        </div>
        <AnimatePresence>
          {msg && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-3 text-xs text-center text-slate-500 bg-slate-50 rounded-xl py-2">{msg}</motion.p>}
        </AnimatePresence>
      </div>
    </div>
  )
}
