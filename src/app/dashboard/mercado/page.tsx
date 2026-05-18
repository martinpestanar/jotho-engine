"use client"

import { useEffect, useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"
import { marketEngine, useTradeStore, Noticia } from "@/store/useTradeStore"
import { useEconomyStore } from "@/store/useEconomyStore"
import OracleDrawer from "@/components/OracleDrawer"
import MarketTicker from "@/components/MarketTicker"
import NewsTicker from "@/components/NewsTicker"
import NewsModal from "@/components/NewsModal"
import TutorialOverlay from "@/components/TutorialOverlay"
import { ArrowLeft, BarChart3, Zap, Info, Newspaper, TrendingUp, TrendingDown, Sparkles, Trophy, Package, Check, Wallet, Gauge, Globe, Layers, Leaf, HeartPulse, TrainFront, TreeDeciduous, ShoppingBag, Landmark, Map, Coins } from "lucide-react"

const REGIONES = ["Global", "Kanto", "Johto", "Hoenn", "Sinnoh", "Unova", "Kalos", "Alola", "Galar"]
const SECTORES = [
  { id: "Tecnología", icon: Zap },
  { id: "Agricultura", icon: Leaf },
  { id: "Energía", icon: Sparkles },
  { id: "Minería", icon: Layers },
  { id: "Madera", icon: TreeDeciduous },
  { id: "Salud", icon: HeartPulse },
  { id: "Transporte", icon: TrainFront },
  { id: "Comercio", icon: ShoppingBag },
  { id: "Cultura", icon: Landmark },
  { id: "Deportes", icon: Trophy },
  { id: "Turismo", icon: Map }
]

export default function MercadoPage() {
  const router = useRouter()
  const pkdBalance = useEconomyStore((s) => s.pkdBalance)
  const { empresas, noticias, portafolio, velas, flashMap, cargarDatos, cargarNoticias, cargarHistorialTicker, suscribirRealtime } = useTradeStore()
  const [seleccionada, setSeleccionada] = useState<string | null>(null)
  const [noticiaSeleccionada, setNoticiaSeleccionada] = useState<Noticia | null>(null)
  const [filtroRegion, setFiltroRegion] = useState("Global")
  const [filtroSector, setFiltroSector] = useState("Todo")
  const [busqueda, setBusqueda] = useState("")
  const [drawerAbierto, setDrawerAbierto] = useState(false)
  const [pestañaSidebar, setPestañaSidebar] = useState<"variacion" | "volumen" | "nuevos">("variacion")
  const [top50, setTop50] = useState(false)

  useEffect(() => {
    cargarDatos()
    cargarNoticias()
    
    // Suscribir Realtime (empresas + noticias de n8n)
    const desubscribir = suscribirRealtime()

    // Registrar esta sesión en el MarketEngine inmortal
    const sessionId = `mercado_${Date.now()}`
    marketEngine.join(sessionId)

    return () => {
      desubscribir()
      marketEngine.leave(sessionId)
    }
  }, [cargarDatos, cargarNoticias, suscribirRealtime])

  // Cargar historial al cambiar selección
  useEffect(() => {
    if (seleccionada) {
      cargarHistorialTicker(seleccionada)
    }
  }, [seleccionada, cargarHistorialTicker])

  const sel = useMemo(() => empresas.find((e) => e.ticker === seleccionada), [empresas, seleccionada])
  
  const filtradas = useMemo(() => {
    let l = [...empresas]
    
    // Filtros
    if (filtroRegion !== "Global") l = l.filter((e) => e.region === filtroRegion)
    if (filtroSector !== "Todo") l = l.filter((e) => e.sector === filtroSector)
    if (busqueda.trim()) l = l.filter((e) => `${e.ticker} ${e.nombre} ${e.sector} ${e.region}`.toLowerCase().includes(busqueda.toLowerCase()))
    
    // Ordenar SIEMPRE por Cap de Mercado de mayor a menor
    l.sort((a, b) => (b.capitalizacion_mercado || 0) - (a.capitalizacion_mercado || 0))

    // Filtro Top 50 (opcional)
    if (top50) l = l.slice(0, 50)

    return l
  }, [empresas, filtroRegion, filtroSector, busqueda, top50])

  const rankingSide = useMemo(() => {
    let l = [...empresas]
    if (pestañaSidebar === "variacion") return l.sort((a, b) => b.variacion_24h - a.variacion_24h).slice(0, 8)
    if (pestañaSidebar === "volumen") return l.sort((a, b) => (b.volumen_24h || 0) - (a.volumen_24h || 0)).slice(0, 8)
    return l.reverse().slice(0, 8)
  }, [empresas, pestañaSidebar])

  const portfolioValue = useMemo(() => {
    return Object.entries(portafolio).reduce((acc, [ticker, pos]) => {
      const emp = empresas.find(e => e.ticker === ticker)
      return acc + (pos.cantidad * (emp?.precio_actual || 0))
    }, 0)
  }, [portafolio, empresas])

  const newsFiltradas = useMemo(() => {
    return noticias.filter(n => n.ticker_afectado === seleccionada || n.ticker_afectado === "GLOBAL")
  }, [noticias, seleccionada])

  // Gráfico realista: Usa velas reales de la DB si existen, si no, genera una base estable
  const chartData = useMemo(() => {
    if (!sel || !seleccionada) return []
    const rawVelas = velas[seleccionada] || []
    if (rawVelas.length > 0) {
      // Usar los datos del store que ya vienen formateados profesionalmente
      return rawVelas
    }
    return []
  }, [sel, seleccionada, velas])

  const spr = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { type: "spring" as const, stiffness: 140, damping: 18 },
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 relative overflow-hidden font-sans">
      {/* Background Decorative Elements */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-sky-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-6 py-4">
          <div className="max-w-[1400px] mx-auto flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button onClick={() => router.push("/dashboard")} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-all shadow-sm">
                <ArrowLeft className="w-5 h-5 text-slate-500" />
              </button>
              <div className="flex items-center gap-8">
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">Mercado Johto</h1>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{empresas.length} ACTIVOS EN VIVO</p>
                </div>
                <nav className="hidden md:flex items-center gap-6 text-sm font-bold text-slate-400">
                  <button className="text-slate-900 border-b-2 border-sky-500 pb-1">Resumen</button>
                  <button className="hover:text-slate-600 transition-colors">Datos de trading</button>
                  <button className="hover:text-slate-600 transition-colors">Selección IA</button>
                </nav>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative hidden md:block">
                <input 
                  type="text" 
                  value={busqueda} 
                  onChange={(e) => setBusqueda(e.target.value)} 
                  placeholder="Buscar activo..." 
                  className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs w-64 outline-none focus:border-sky-500 transition-all shadow-sm"
                />
              </div>
              
              {/* Liquid balance header display */}
              <div className="flex items-center gap-2 bg-emerald-50/50 border border-emerald-100/50 px-4 py-2 rounded-2xl shadow-sm">
                <Coins className="w-4 h-4 text-emerald-500" />
                <div className="text-left">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Mi Efectivo</p>
                  <p className="text-xs font-black text-emerald-600 font-mono leading-none mt-1">{pkdBalance.toLocaleString()} PKD</p>
                </div>
              </div>

              <button onClick={() => setDrawerAbierto(!drawerAbierto)} className="text-[11px] font-black text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-4 py-2 hover:bg-amber-100 transition-all shadow-sm">
                🎩 MAGNATE
              </button>
            </div>
          </div>
        </header>

        {/* Live Ticker */}
        <MarketTicker />
        
        {/* News Ticker */}
        <NewsTicker onNewsClick={setNoticiaSeleccionada} />

        {/* Market Insights Grid (Fase 5) */}
        <div className="max-w-7xl mx-auto px-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Global Sentiment */}
            <motion.div {...spr} className="bg-white rounded-3xl border border-slate-100 p-5 flex items-center gap-5 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                <Gauge className="w-7 h-7 text-indigo-600" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Sentimiento Global</p>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black text-slate-800 tracking-tight">84 / 100</span>
                  <span className="text-[10px] font-black px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded-md">CODICIA</span>
                </div>
              </div>
            </motion.div>

            {/* Portfolio Overview */}
            <motion.div {...spr} transition={{ delay: 0.1 }} className="bg-white rounded-3xl border border-slate-100 p-5 flex items-center gap-5 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                <Wallet className="w-7 h-7 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Saldo Líquido</span>
                  <span className="text-sm font-black text-emerald-600 font-mono">{pkdBalance.toLocaleString()} PKD</span>
                </div>
                <div className="h-px bg-slate-100 my-1.5" />
                <div className="flex justify-between items-baseline">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Valor en Acciones</span>
                  <span className="text-sm font-black text-slate-700 font-mono">${portfolioValue.toLocaleString()} PKD</span>
                </div>
              </div>
            </motion.div>

            {/* Region Health */}
            <motion.div {...spr} transition={{ delay: 0.2 }} className="bg-white rounded-3xl border border-slate-100 p-5 flex items-center gap-5 shadow-sm overflow-hidden relative">
               <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0">
                <Globe className="w-7 h-7 text-sky-600" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Heatmap Regional</p>
                <div className="flex gap-1">
                  {REGIONES.slice(0, 4).map(r => (
                    <div key={r} className="h-4 flex-1 rounded-sm bg-emerald-400/80" title={r} />
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Binance Style Top Cards */}
        <div className="max-w-[1400px] mx-auto px-6 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Popular */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 hover:border-sky-100 transition-all group shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Popular</span>
                <button className="text-[10px] text-sky-500 font-bold hover:underline">Más &gt;</button>
              </div>
              <div className="space-y-4">
                {empresas.slice(0, 3).map(e => (
                  <div key={e.ticker} onClick={() => setSeleccionada(e.ticker)} className="flex items-center justify-between group/item cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 group-hover/item:border-sky-200 transition-colors">
                        <img src={e.logo_url || e.ceo_sprite} alt="" className="w-6 h-6 object-contain" />
                      </div>
                      <span className="text-sm font-black text-slate-700 group-hover/item:text-sky-600">{e.ticker}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-slate-900">${e.precio_actual.toFixed(2)}</div>
                      <div className={`text-[10px] font-bold ${e.variacion_24h >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {e.variacion_24h >= 0 ? '+' : ''}{e.variacion_24h.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Nuevos */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 hover:border-sky-100 transition-all shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nuevo</span>
                <button className="text-[10px] text-sky-500 font-bold hover:underline">Más &gt;</button>
              </div>
              <div className="space-y-4">
                {[...empresas].reverse().slice(0, 3).map(e => (
                  <div key={e.ticker} onClick={() => setSeleccionada(e.ticker)} className="flex items-center justify-between cursor-pointer group/item">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 group-hover/item:border-sky-200">
                        <img src={e.logo_url || e.ceo_sprite} alt="" className="w-6 h-6 object-contain" />
                      </div>
                      <span className="text-sm font-black text-slate-700 group-hover/item:text-sky-600">{e.ticker}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-slate-900">${e.precio_actual.toFixed(2)}</div>
                      <div className={`text-[10px] font-bold ${e.variacion_24h >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {e.variacion_24h >= 0 ? '+' : ''}{e.variacion_24h.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ganadora Principal */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 hover:border-emerald-100 transition-all shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ganadora principal</span>
                <button className="text-[10px] text-sky-500 font-bold hover:underline">Más &gt;</button>
              </div>
              <div className="space-y-4">
                {[...empresas].sort((a,b) => b.variacion_24h - a.variacion_24h).slice(0, 3).map(e => (
                  <div key={e.ticker} onClick={() => setSeleccionada(e.ticker)} className="flex items-center justify-between cursor-pointer group/item">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50/30 flex items-center justify-center border border-emerald-100/50 group-hover/item:border-emerald-300">
                        <img src={e.logo_url || e.ceo_sprite} alt="" className="w-6 h-6 object-contain" />
                      </div>
                      <span className="text-sm font-black text-slate-700 group-hover/item:text-emerald-600">{e.ticker}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-slate-900">${e.precio_actual.toFixed(2)}</div>
                      <div className={`text-[10px] font-black text-emerald-500`}>
                        +{e.variacion_24h.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mayor Volumen */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 hover:border-sky-100 transition-all shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mayor volumen</span>
                <button className="text-[10px] text-sky-500 font-bold hover:underline">Más &gt;</button>
              </div>
              <div className="space-y-4">
                {[...empresas].sort((a,b) => (b.volumen_24h||0) - (a.volumen_24h||0)).slice(0, 3).map(e => (
                  <div key={e.ticker} onClick={() => setSeleccionada(e.ticker)} className="flex items-center justify-between cursor-pointer group/item">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 group-hover/item:border-sky-200">
                        <img src={e.logo_url || e.ceo_sprite} alt="" className="w-6 h-6 object-contain" />
                      </div>
                      <span className="text-sm font-black text-slate-700 group-hover/item:text-sky-600">{e.ticker}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-slate-900">${(e.volumen_24h || 0).toLocaleString()}</div>
                      <div className={`text-[10px] font-bold ${e.variacion_24h >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {e.variacion_24h >= 0 ? '+' : ''}{e.variacion_24h.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Filter Navigation */}
        <div className="max-w-[1400px] mx-auto px-6 mt-12 mb-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
             <div className="flex items-center gap-8 text-sm font-bold text-slate-400 overflow-x-auto whitespace-nowrap scrollbar-hide">
                <button className="hover:text-slate-600 transition-colors">Favoritos</button>
                <button className="text-sky-600 border-b-2 border-sky-600 pb-4">Empresas</button>
                <button className="hover:text-slate-600 transition-colors">Spot</button>
                <button className="hover:text-slate-600 transition-colors">Futuros</button>
                <button className="hover:text-slate-600 transition-colors relative flex items-center gap-1">
                  Alpha <span className="text-[8px] bg-amber-500 text-white px-1 rounded-sm leading-none py-0.5">NEW</span>
                </button>
                <button className="hover:text-slate-600 transition-colors">Nuevo</button>
                <button className="hover:text-slate-600 transition-colors">Zonas</button>
              </div>
            </div>
          </div>

        {/* Filtros de Mercado */}
        <div className="max-w-[1400px] mx-auto px-6 mb-8">
          <div className="bg-white/50 backdrop-blur-sm rounded-3xl border border-slate-200 p-6 space-y-6">
            {/* Header de Resultados */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                {top50 ? "🏆 Ranking Institucional TOP 50" : `🌍 Mercado ${filtroRegion === 'Global' ? 'Global' : filtroRegion}`}
                <span className="text-[10px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">
                  {filtradas.length} activos
                </span>
              </h2>
            </div>

            {/* Regiones */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pt-2 w-20 shrink-0">Región:</span>
              <div className="flex flex-wrap items-center gap-2">
                <button 
                  onClick={() => {
                    setTop50(!top50)
                    if (!top50) setFiltroRegion("Global")
                  }}
                  className={`flex items-center gap-2 px-5 py-2 rounded-xl text-[11px] font-black transition-all border ${
                    top50
                    ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white border-orange-700 shadow-lg shadow-orange-500/30 ring-2 ring-orange-200" 
                    : "bg-white text-slate-500 hover:text-orange-600 border-slate-200 hover:border-orange-200"
                  }`}
                >
                  {top50 ? "🏆 RANKING TOP 50" : "🏆 TOP 50"}
                </button>
                <div className="hidden sm:block w-[1px] h-6 bg-slate-200 mx-2" />
                {REGIONES.map((reg) => (
                  <button 
                    key={reg}
                    onClick={() => {
                      setFiltroRegion(reg)
                    }}
                    className={`px-4 py-1.5 rounded-full text-[11px] font-bold transition-all border ${
                      filtroRegion === reg && !top50
                      ? "bg-sky-500 text-white border-sky-500 shadow-md shadow-sky-500/20" 
                      : filtroRegion === reg && top50
                        ? "bg-slate-100 text-slate-600 border-slate-300"
                        : "bg-white text-slate-500 hover:text-slate-700 border-slate-200"
                    }`}
                  >
                    {reg}
                  </button>
                ))}
              </div>
            </div>

            {/* Sectores */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pt-2 w-20 shrink-0">Industria:</span>
              <div className="flex flex-wrap items-center gap-2">
                <button 
                  onClick={() => setFiltroSector("Todo")}
                  className={`px-4 py-1.5 rounded-full text-[11px] font-bold transition-all border ${
                    filtroSector === "Todo"
                    ? "bg-slate-800 text-white border-slate-800 shadow-md" 
                    : "bg-white text-slate-500 hover:text-slate-700 border-slate-200"
                  }`}
                >
                  Todo
                </button>
                {SECTORES.map((sec) => (
                  <button 
                    key={sec.id}
                    onClick={() => setFiltroSector(sec.id)}
                    className={`px-4 py-1.5 rounded-full text-[11px] font-bold transition-all border flex items-center gap-2 ${
                      filtroSector === sec.id
                      ? "bg-indigo-500 text-white border-indigo-500 shadow-md shadow-indigo-500/20" 
                      : "bg-white text-slate-500 hover:text-slate-700 border-slate-200 shadow-sm"
                    }`}
                  >
                    <sec.icon className="w-3 h-3" />
                    {sec.id}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Data Table */}
        <div className="max-w-[1400px] mx-auto px-6 pb-20">
          <div className="bg-white rounded-3xl border border-slate-200 overflow-x-auto scrollbar-hide shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-5 font-black">Nombre</th>
                  <th className="px-6 py-5 font-black text-right">Precio</th>
                  <th className="px-6 py-5 font-black text-right">Cambio 24h</th>
                  <th className="px-6 py-5 font-black text-right">Volumen en 24h</th>
                  <th className="px-6 py-5 font-black text-right">Cap. de mercado</th>
                  <th className="px-6 py-5 font-black text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-sm font-bold">
                {filtradas.map((e) => (
                  <motion.tr 
                    key={e.ticker} 
                    onClick={() => setSeleccionada(e.ticker)}
                    animate={{
                      backgroundColor: flashMap[e.ticker] === 'up' 
                        ? 'rgba(16, 185, 129, 0.08)' 
                        : flashMap[e.ticker] === 'down' 
                          ? 'rgba(244, 63, 94, 0.08)' 
                          : seleccionada === e.ticker ? 'rgba(224, 242, 254, 0.5)' : 'rgba(255, 255, 255, 0)'
                    }}
                    transition={{ 
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                      duration: 0.3 
                    }}
                    className={`group border-b border-slate-50 hover:bg-slate-50/50 transition-all cursor-pointer relative`}
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:border-sky-300 transition-colors">
                          <img src={e.logo_url || e.ceo_sprite} alt="" className="w-7 h-7 object-contain" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-900 font-black">{e.ticker}</span>
                            <span className="text-[9px] text-slate-400 font-black">{e.nombre}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{e.region}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right font-mono text-slate-900 text-base">
                      ${e.precio_actual.toFixed(2)}
                      <div className="text-[9px] text-slate-400 font-bold mt-0.5">${e.precio_actual.toFixed(2)}</div>
                    </td>
                    <td className={`px-6 py-5 text-right font-black ${e.variacion_24h >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                      {e.variacion_24h >= 0 ? "+" : ""}{e.variacion_24h.toFixed(2)}%
                    </td>
                    <td className="px-6 py-5 text-right text-slate-600 font-mono">
                      ${(e.volumen_24h || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-5 text-right text-slate-600 font-mono">
                      ${(Number(e.capitalizacion_mercado) / 1000000).toFixed(2)}B
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-3">
                        <button 
                          onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/mercado/${sel?.ticker}`); }}
                          className="p-2 hover:bg-sky-100 hover:text-sky-600 text-slate-400 rounded-lg transition-all"
                          title="Trading Pro"
                        >
                          <Zap className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-slate-100 text-slate-400 rounded-lg transition-all" title="Ver Gráfico">
                          <BarChart3 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Asset Detail Modal (Replaces old floating bar) */}
        <AnimatePresence>
          {sel && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSeleccionada(null)}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm pointer-events-auto"
              />
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-[40px] w-full max-w-5xl max-h-[90vh] overflow-y-auto scrollbar-hide shadow-2xl pointer-events-auto border border-slate-100 flex flex-col relative z-10"
              >
                {/* Modal Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-[40px] shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[20px] bg-white flex items-center justify-center border border-slate-100 shadow-sm overflow-hidden">
                      <img src={sel.logo_url || sel.ceo_sprite} alt="" className="w-8 h-8 object-contain" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-800 tracking-tight">{sel.nombre} <span className="text-sm font-bold text-slate-400">({sel.ticker})</span></h2>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{sel.sector} • {sel.region}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSeleccionada(null)} 
                    className="p-3 hover:bg-slate-200 bg-white rounded-full transition-colors text-slate-400 shadow-sm border border-slate-100"
                  >
                    <ArrowLeft className="w-5 h-5 rotate-90" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-8 flex-1">
                  {/* Left: Info & Stats */}
                  <div className="md:col-span-1 space-y-6">
                    <div>
                      <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3">Descripción</h3>
                      <p className="text-sm text-slate-600 leading-relaxed font-medium">
                        {sel.descripcion || "No hay descripción disponible para esta entidad."}
                      </p>
                    </div>

                    {sel.beneficios_json && sel.beneficios_json.length > 0 && (
                      <div>
                        <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3">Beneficios Corporativos</h3>
                        <ul className="space-y-3">
                          {sel.beneficios_json.map((b: any, i: number) => (
                            <li key={i} className="flex items-start gap-3 text-xs text-slate-600 font-bold group/benefit">
                              <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                                <Check className="w-3 h-3 text-emerald-500" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-slate-800">{b.recompensa || b.descripcion || (typeof b === 'string' ? b : "Beneficio Corporativo")}</span>
                                <span className="text-[10px] text-slate-400 font-medium">Requisito: {b.umbral || 100} acciones • {b.frecuencia || 'Permanente'}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Market Cap</p>
                        <p className="text-sm font-black text-slate-700">${((sel.market_cap || sel.capitalizacion_mercado) / 1000000).toFixed(1)}B</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Volumen 24h</p>
                        <p className="text-sm font-black text-slate-700 font-mono">${(sel.volumen_24h || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Middle & Right: Chart & Actions */}
                  <div className="md:col-span-2 space-y-6 flex flex-col">
                    {(() => {
                      const isUp = (sel.variacion_24h || 0) >= 0
                      const chartData = velas[sel.ticker] || [
                        { time: '09:00', p: sel.precio_cierre * 0.98 },
                        { time: '10:00', p: sel.precio_cierre * 1.01 },
                        { time: '11:00', p: sel.precio_cierre * 0.99 },
                        { time: '12:00', p: sel.precio_actual * 0.97 },
                        { time: '13:00', p: sel.precio_actual * 1.02 },
                        { time: '14:00', p: sel.precio_actual }
                      ]
                      
                      return (
                        <>
                          <div className="flex justify-between items-end mb-2">
                           <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Precio Actual</p>
                              <p className="text-4xl font-black text-slate-900 font-mono leading-none">${sel.precio_actual.toFixed(2)}</p>
                           </div>
                           <div className="flex items-center gap-3 bg-indigo-50/50 px-4 py-2 rounded-2xl border border-indigo-100/50">
                              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center overflow-hidden border border-indigo-100 shadow-sm">
                                <img src={sel.logo_url || sel.ceo_sprite} alt="CEO" className="w-5 h-5 object-contain" />
                              </div>
                              <div>
                                <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">CEO / Director</p>
                                <p className="text-xs font-black text-indigo-900 leading-none">{sel.ceo_nombre}</p>
                              </div>
                           </div>
                          </div>

                          <div className="h-[220px] w-full mt-6 -ml-6">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={chartData}>
                                <defs>
                                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={isUp ? "#10b981" : "#f43f5e"} stopOpacity={0.05}/>
                                    <stop offset="95%" stopColor={isUp ? "#10b981" : "#f43f5e"} stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                  dataKey="time" 
                                  hide={false} 
                                  axisLine={false} 
                                  tickLine={false} 
                                  tick={{ fontSize: 10, fill: '#94a3b8' }} 
                                  dy={10}
                                />
                                <YAxis 
                                  domain={['auto', 'auto']} 
                                  orientation="right"
                                  axisLine={false}
                                  tickLine={false}
                                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                                  tickFormatter={(val) => `$${val.toFixed(2)}`}
                                />
                                <Tooltip 
                                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                                  formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Precio']}
                                />
                                <Area 
                                  type="monotone" 
                                  dataKey="p" 
                                  stroke={isUp ? "#10b981" : "#f43f5e"} 
                                  strokeWidth={2}
                                  fillOpacity={1} 
                                  fill="url(#colorPrice)" 
                                  isAnimationActive={false}
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>

                          <div className="flex gap-4">
                            <button 
                              onClick={() => router.push(`/dashboard/mercado/${sel.ticker}`)}
                              className="flex-1 bg-slate-900 text-white py-5 rounded-[25px] font-black flex items-center justify-center gap-3 hover:bg-sky-600 hover:-translate-y-1 transition-all shadow-xl shadow-slate-200"
                            >
                              <Zap className="w-5 h-5 text-sky-400" />
                              ABRIR TRADING PRO
                            </button>
                            <button className="px-8 bg-slate-50 text-slate-400 rounded-[25px] border border-slate-100 hover:bg-slate-100 transition-colors">
                              <BarChart3 className="w-5 h-5" />
                            </button>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        {/* Overlays */}
        <OracleDrawer 
          tipo="magnate" 
          abierto={drawerAbierto} 
          onToggle={() => setDrawerAbierto(!drawerAbierto)} 
          userId="209a47ac-b113-4c1b-8a10-b33a99c55105"
        />
        <NewsModal noticia={noticiaSeleccionada} onClose={() => setNoticiaSeleccionada(null)} />
        <TutorialOverlay />
      </div>
    </div>
  )
}
