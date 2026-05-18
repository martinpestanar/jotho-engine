"use client"

import { create } from "zustand"
import { supabaseReady, supabase } from "@/shared/lib/supabase/client"
import type { Company, PricePoint, NewsEvent, PortfolioItem } from "@/types/market"

function genHistory(basePrice: number, points = 48): PricePoint[] {
  let p = basePrice
  const vol = basePrice * 0.018
  const now = new Date()
  return Array.from({ length: points + 1 }, (_, i) => {
    if (i > 0) p += (Math.random() - 0.48) * vol
    p = Math.max(p, basePrice * 0.35)
    const t = new Date(now.getTime() - (points - i) * 30 * 60000)
    return { time: t.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }), price: Math.round(p * 100) / 100 }
  })
}

interface MarketState {
  companies: Company[]
  filterRegion: string
  searchQuery: string
  selectedTicker: string | null
  priceHistory: Record<string, PricePoint[]>
  news: NewsEvent[]
  portfolio: PortfolioItem[]
  watchlist: string[]
  loading: boolean
  error: string | null

  setFilterRegion: (r: string) => void
  setSearchQuery: (q: string) => void
  setSelectedTicker: (t: string | null) => void
  loadData: () => Promise<void>
  loadNews: () => Promise<void>
  loadPortfolio: (userId: string | undefined) => Promise<void>
  loadWatchlist: (userId: string | undefined) => Promise<void>
  toggleWatchlist: (companyId: string, userId: string | undefined) => Promise<void>
  buyShares: (companyId: string, shares: number, price: number, userId: string | undefined) => Promise<string | null>
  sellShares: (companyId: string, shares: number, price: number) => Promise<string | null>
  updatePrice: (ticker: string, price: number) => void
}

export const useMarketStore = create<MarketState>((set, get) => ({
  companies: [],
  filterRegion: "Global",
  searchQuery: "",
  selectedTicker: null,
  priceHistory: {},
  news: [],
  portfolio: [],
  watchlist: [],
  loading: false,
  error: null,

  setFilterRegion: (r) => set({ filterRegion: r }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setSelectedTicker: (t) => set({ selectedTicker: t }),

  loadData: async () => {
    if (!supabaseReady || !supabase) return
    set({ loading: true, error: null })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from("companies") as any).select("*").order("ticker")
    if (error) { set({ error: error.message, loading: false }); return }
    const c = data as Company[]
    const h: Record<string, PricePoint[]> = {}
    for (const comp of c) h[comp.ticker] = genHistory(comp.current_price)
    set({ companies: c, priceHistory: h, loading: false, selectedTicker: c[0]?.ticker ?? null })
  },

  loadNews: async () => {
    if (!supabaseReady || !supabase) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from("market_news") as any).select("*").order("published_at", { ascending: false }).limit(8)
    if (data) set({ news: data as NewsEvent[] })
  },

  loadPortfolio: async (userId) => {
    if (!supabaseReady || !supabase || !userId) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from("user_portfolio") as any).select("*").eq("user_id", userId)
    if (data) set({ portfolio: data as PortfolioItem[] })
  },

  loadWatchlist: async (userId) => {
    if (!supabaseReady || !supabase || !userId) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from("user_watchlist") as any).select("company_id").eq("user_id", userId)
    if (data) set({ watchlist: data.map((r: { company_id: string }) => r.company_id) })
  },

  toggleWatchlist: async (companyId, userId) => {
    if (!supabaseReady || !supabase || !userId) return
    const exists = get().watchlist.includes(companyId)
    if (exists) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("user_watchlist") as any).delete().eq("user_id", userId).eq("company_id", companyId)
      set({ watchlist: get().watchlist.filter((c) => c !== companyId) })
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("user_watchlist") as any).insert({ user_id: userId, company_id: companyId })
      set({ watchlist: [...get().watchlist, companyId] })
    }
  },

  buyShares: async (companyId, shares, price, userId) => {
    if (!supabaseReady || !supabase || !userId) return "Market offline"
    const existing = get().portfolio.find((p) => p.company_id === companyId)
    if (existing) {
      const ns = existing.shares + shares
      const na = (existing.avg_price * existing.shares + price * shares) / ns
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from("user_portfolio") as any).update({ shares: ns, avg_price: Math.round(na * 100) / 100, updated_at: new Date().toISOString() }).eq("id", existing.id)
      if (error) return error.message
      set((s) => ({ portfolio: s.portfolio.map((p) => (p.company_id === companyId ? { ...p, shares: ns, avg_price: Math.round(na * 100) / 100 } : p)) }))
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from("user_portfolio") as any).insert({ user_id: userId, company_id: companyId, shares, avg_price: price })
      if (error) return error.message
      set((s) => ({ portfolio: [...s.portfolio, { id: crypto.randomUUID(), user_id: userId, company_id: companyId, shares, avg_price: price }] }))
    }
    return null
  },

  sellShares: async (companyId, shares, price) => {
    const existing = get().portfolio.find((p) => p.company_id === companyId)
    if (!existing || existing.shares < shares) return "Not enough shares"
    const ns = existing.shares - shares
    if (ns <= 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (supabaseReady && supabase) await (supabase.from("user_portfolio") as any).delete().eq("id", existing.id)
      set((s) => ({ portfolio: s.portfolio.filter((p) => p.company_id !== companyId) }))
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (supabaseReady && supabase) await (supabase.from("user_portfolio") as any).update({ shares: ns, updated_at: new Date().toISOString() }).eq("id", existing.id)
      set((s) => ({ portfolio: s.portfolio.map((p) => (p.company_id === companyId ? { ...p, shares: ns } : p)) }))
    }
    return null
  },

  updatePrice: (ticker, price) => {
    set((s) => {
      const old = s.companies.find((c) => c.ticker === ticker)?.current_price ?? price
      const ch = old > 0 ? ((price - old) / old) * 100 : 0
      return { companies: s.companies.map((c) => c.ticker === ticker ? { ...c, current_price: price, change_percent: Math.round(ch * 100) / 100 } : c) }
    })
  },
}))
