"use client"

import type { Company, PortfolioItem } from "@/types/market"
import { Briefcase, UserRound } from "lucide-react"

const TIPS = [
  "Diversify across regions — Kanto tech, Johto farming, Hoenn energy.",
  "Buy when Ether storms hit. Sell when the sun shines.",
  "The Magnate says: patience is the ultimate asset.",
  "Silph and Devon have competed for 70 years. Bet on both.",
  "Kurt's limited editions never lose value long-term.",
  "Watchlist your favorites first. Always.",
]
const TIP = TIPS[Math.floor(Math.random() * TIPS.length)]

interface Props {
  companies: Company[]
  portfolio: PortfolioItem[]
  balance: number
}

export default function PortfolioCard({ companies, portfolio, balance }: Props) {
  const stockValue = portfolio.reduce((sum, p) => {
    const company = companies.find((c) => c.id === p.company_id)
    return sum + (company?.current_price ?? 0) * p.shares
  }, 0)

  const netWorth = balance + stockValue

  return (
    <div className="space-y-4">
      {/* Net Worth */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
        <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5">
          <Briefcase className="w-3.5 h-3.5" /> Net Worth
        </p>
        <p className="text-2xl font-bold font-mono text-navy">¥{netWorth.toLocaleString()}</p>
        <div className="mt-3 space-y-1.5">
          <div className="flex justify-between text-xs"><span className="text-slate-400">PKD Wallet</span><span className="font-mono font-semibold text-navy">{balance.toLocaleString()}</span></div>
          <div className="flex justify-between text-xs"><span className="text-slate-400">Stock Value</span><span className="font-mono font-semibold text-navy">{stockValue.toLocaleString()}</span></div>
        </div>
      </div>

      {/* Holdings */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4">
        <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2">Holdings</p>
        {portfolio.length === 0 ? (
          <p className="text-xs text-slate-400">No holdings yet</p>
        ) : (
          <div className="space-y-2">
            {portfolio.map((p) => {
              const company = companies.find((c) => c.id === p.company_id)
              const val = (company?.current_price ?? 0) * p.shares
              return (
                <div key={p.id} className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-navy w-10">{company?.ticker ?? "?"}</span>
                  <span className="text-slate-400">{p.shares} sh.</span>
                  <span className="ml-auto font-mono text-navy">¥{val.toLocaleString()}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Advisor */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl border border-amber-100 shadow-sm p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center">
            <UserRound className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-amber-800">The Magnate</p>
            <p className="text-[10px] text-amber-600">Market Advisor</p>
          </div>
        </div>
        <p className="text-xs text-amber-700/80 leading-relaxed italic">&ldquo;{TIP}&rdquo;</p>
      </div>
    </div>
  )
}
