"use client"

import { useEffect, useRef, useCallback, useState, useMemo } from "react"
import { useRouter, useParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { createChart, ColorType, CandlestickSeries, LineSeries } from "lightweight-charts"
import { useAppStore } from "@/store/useAppStore"
import { useHabitStore } from "@/features/habits"
import { useTradeStore, type VelaOHLC } from "@/store/useTradeStore"
import { useEconomyStore } from "@/store/useEconomyStore"
import { ArrowLeft, TrendingUp, TrendingDown, X, Clock, Zap, CheckCircle2 } from "lucide-react"

const TradeModal = ({ message, onClose }: { message: string, onClose: () => void }) => {
  const isError = message.toLowerCase().includes("error") || message.toLowerCase().includes("insuficiente") || message.toLowerCase().includes("agotada")
  
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/60 backdrop-blur-sm p-4">
        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white rounded-[40px] p-8 max-w-sm w-full shadow-2xl text-center relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-full h-2 ${isError ? 'bg-red-500' : 'bg-plant-green'}`} />
          <div className={`w-20 h-20 ${isError ? 'bg-red-50' : 'bg-plant-green/10'} rounded-full flex items-center justify-center mx-auto mb-6`}>
            {isError ? <X className="w-10 h-10 text-red-500" /> : <CheckCircle2 className="w-10 h-10 text-plant-green" />}
          </div>
          <h2 className="text-2xl font-black text-navy mb-2">{isError ? 'Atención' : '¡Operación Exitosa!'}</h2>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">{message}</p>
          <button onClick={onClose} className={`w-full py-4 ${isError ? 'bg-slate-800' : 'bg-navy'} text-white rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg`}>Entendido</button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default function TerminalProPage() {
  const router = useRouter(); const params = useParams()
  const ticker = typeof params.ticker === "string" ? decodeURIComponent(params.ticker).toUpperCase() : ""
  const { hasCompletedDailyCheckIn } = useAppStore()
  const pkdBalance = useEconomyStore((s) => s.pkdBalance)
  const habitUserId = useHabitStore((s) => s.userId)

  const { empresas, cargarDatos, portafolio, ordenes, velas, life, restarEnergia, comprarSpot, venderSpot, colocarSL, colocarTP, colocarOrdenLimite, cancelarOrden, suscribirRealtime, iniciarTick, detenerTick, noticias, cargarHistorialTicker } = useTradeStore()
  const empresa = useMemo(() => empresas.find((e) => e.ticker === ticker), [empresas, ticker])
  const ohlc = velas[ticker] ?? []

  // --- Calculos de PNL para este Ticker ---
  const posActualTicker = portafolio[ticker]
  const misAcc = typeof posActualTicker === 'number' ? posActualTicker : (posActualTicker?.cantidad ?? 0)
  const miPrecioProm = typeof posActualTicker === 'number' ? 0 : (posActualTicker?.precio_promedio ?? 0)
  const miPNL = empresa && miPrecioProm > 0 ? (empresa.precio_actual - miPrecioProm) * misAcc : 0
  const miPNLPerc = miPrecioProm > 0 ? (miPNL / (miPrecioProm * misAcc)) * 100 : 0

  const [tab, setTab] = useState<"mercado" | "limite">("mercado")
  const [cantidad, setCantidad] = useState(1)
  const [precioLimite, setPrecioLimite] = useState("")
  const [stopLoss, setStopLoss] = useState("")
  const [takeProfit, setTakeProfit] = useState("")
  const [mensaje, setMensaje] = useState<string | null>(null)
  const chartRef = useRef<HTMLDivElement>(null)
  const chartApiRef = useRef<ReturnType<typeof createChart> | null>(null)
  const seriesRef = useRef<any>(null)
  const smaSeriesRef = useRef<any>(null)
  const dataLoadedRef = useRef(false)
  const lastLengthRef = useRef(0)
  const lastPlottedTimeRef = useRef(0)

  // --- Order Book Simulado ---
  const orderBook = useMemo(() => {
    if (!empresa) return { asks: [], bids: [] }
    const p = empresa.precio_actual
    const asks = Array.from({length: 6}, (_, i) => ({ price: p + p * 0.001 * (i + 1), size: Math.floor(Math.random() * 500) + 50 })).reverse()
    const bids = Array.from({length: 6}, (_, i) => ({ price: p - p * 0.001 * (i + 1), size: Math.floor(Math.random() * 500) + 50 }))
    return { asks, bids }
  }, [empresa?.precio_actual])

  // --- Realtime & History ---
  useEffect(() => {
    if (ticker && empresas.length > 0) {
       cargarHistorialTicker(ticker)
    }
  }, [ticker, empresas, cargarHistorialTicker])

  useEffect(() => {
    const desub = suscribirRealtime()
    return () => {
      desub()
    }
  }, [suscribirRealtime])

  // --- Chart Initialization & Data Sync ---
  useEffect(() => {
    if (!chartRef.current) return
    
    let isMounted = true
    let chart: ReturnType<typeof createChart> | null = null

    const init = () => {
      if (!chartRef.current || chartRef.current.clientWidth === 0) {
        if (isMounted) requestAnimationFrame(init)
        return
      }

      chart = createChart(chartRef.current, {
        layout: { background: { type: ColorType.Solid, color: "#ffffff" }, textColor: "#64748B", fontSize: 12 },
        grid: { vertLines: { color: "#f1f5f9" }, horzLines: { color: "#f1f5f9" } },
        width: chartRef.current.clientWidth,
        height: 400,
        timeScale: { borderColor: "#F1F5F9", timeVisible: true, secondsVisible: true },
      })

      const candlestickSeries = chart.addSeries(CandlestickSeries, {
        upColor: "#10B981", downColor: "#EF4444", borderUpColor: "#10B981", borderDownColor: "#EF4444",
        wickUpColor: "#10B981", wickDownColor: "#EF4444",
      })

      const smaSeries = chart.addSeries(LineSeries, {
        color: 'rgba(56, 189, 248, 0.7)',
        lineWidth: 2,
        crosshairMarkerVisible: false,
        lastValueVisible: false,
        priceLineVisible: false,
      })

      chartApiRef.current = chart
      seriesRef.current = candlestickSeries
      smaSeriesRef.current = smaSeries

      // Set initial data if available
      if (ohlc.length > 0) {
        const sortedData = [...ohlc].sort((a, b) => (a.time as number) - (b.time as number))
        candlestickSeries.setData(sortedData as any)
        
        const smaData = []
        for (let i = 0; i < sortedData.length; i++) {
          if (i < 9) continue
          let sum = 0
          for (let j = 0; j < 10; j++) sum += sortedData[i - j].close
          smaData.push({ time: sortedData[i].time, value: sum / 10 })
        }
        smaSeries.setData(smaData as any)
        
        // Solo ajustar contenido la primera vez que cargamos datos reales
        if (ohlc.length > 5) {
          chart.timeScale().fitContent()
        }
      }

      const handleResize = () => {
        if (chartRef.current && chart && chartRef.current.clientWidth > 0) {
          chart.applyOptions({ width: chartRef.current.clientWidth })
        }
      }
      window.addEventListener("resize", handleResize)
    }

    init()

    return () => {
      isMounted = false
      if (chart) {
        chart.remove()
        chartApiRef.current = null
        seriesRef.current = null
        smaSeriesRef.current = null
      }
      dataLoadedRef.current = false
      lastLengthRef.current = 0
      lastPlottedTimeRef.current = 0
    }
  }, [ticker])

  useEffect(() => {
    if (seriesRef.current && ohlc.length > 0) {
      const sortedData = [...ohlc]
        .map(v => ({ ...v, time: Number(v.time) }))
        .sort((a, b) => a.time - b.time)
      
      const lastCandle = sortedData[sortedData.length - 1]
      
      // Inteligencia para decidir entre setData (pesado, pero seguro ante cambios bruscos)
      // y update (ligero, instantáneo, sin animación lenta de serpiente).
      const shouldFullRefresh = 
        !dataLoadedRef.current || 
        sortedData.length > lastLengthRef.current + 1 || 
        lastCandle.time < lastPlottedTimeRef.current

      if (shouldFullRefresh) {
        seriesRef.current.setData(sortedData)
        
        if (smaSeriesRef.current) {
          const smaData = []
          for (let i = 0; i < sortedData.length; i++) {
            if (i < 9) continue
            let sum = 0
            for (let j = 0; j < 10; j++) sum += sortedData[i - j].close
            smaData.push({ time: sortedData[i].time, value: sum / 10 })
          }
          smaSeriesRef.current.setData(smaData)
        }

        if (!dataLoadedRef.current && sortedData.length > 5) {
          chartApiRef.current?.timeScale().fitContent()
          dataLoadedRef.current = true
        }
      } else {
        // Tick en tiempo real (instantáneo, sin animaciones molestas)
        seriesRef.current.update({ ...lastCandle })
        
        if (smaSeriesRef.current && sortedData.length >= 10) {
           let sum = 0
           for (let j = 0; j < 10; j++) sum += sortedData[sortedData.length - 1 - j].close
           smaSeriesRef.current.update({ time: lastCandle.time, value: sum / 10 })
        }
      }
      
      lastLengthRef.current = sortedData.length
      lastPlottedTimeRef.current = lastCandle.time
    }
  }, [ohlc])


  const comision = empresa ? Math.round(empresa.precio_actual * cantidad * 0.01 * 100) / 100 : 0
  const totalOp = empresa ? empresa.precio_actual * cantidad + comision : 0
  
  const misOrdenes = ordenes.filter((o) => o.ticker === ticker && o.estado === "ACTIVA")
  
  const todasMisPosiciones = Object.entries(portafolio).map(([t, pos]) => {
    const pCantidad = typeof pos === 'number' ? pos : (pos?.cantidad || 0)
    const pPrecio = typeof pos === 'number' ? 0 : (pos?.precio_promedio || 0)
    const emp = empresas.find(e => e.ticker === t)
    const pnl = emp && pPrecio > 0 ? (emp.precio_actual - pPrecio) * pCantidad : 0
    const pnlPerc = pPrecio > 0 ? (pnl / (pPrecio * pCantidad)) * 100 : 0
    return { ticker: t, cantidad: pCantidad, precio_promedio: pPrecio, currentPrice: emp?.precio_actual ?? 0, pnl, pnlPerc }
  }).filter(p => p.cantidad > 0)

  const handleComprar = useCallback(async () => {
    if (!empresa) return
    if (cantidad <= 0) return setMensaje("Error: La cantidad debe ser mayor a 0")
    
    if (tab === "limite") {
      if (!precioLimite) return setMensaje("Error: Ingresa un precio límite")
      await colocarOrdenLimite(ticker, cantidad, Number(precioLimite), "COMPRA_LIMITE")
      setMensaje(`Orden de Compra Límite colocada: ${cantidad} ${ticker} @ $${precioLimite}`)
    } else {
      const err = await comprarSpot(ticker, cantidad)
      if (err) setMensaje(err)
      else setMensaje(`¡Compra exitosa! Has adquirido ${cantidad} ${ticker}.`)
    }
    setTimeout(() => setMensaje(null), 5000) 
  }, [empresa, cantidad, ticker, comprarSpot, tab, precioLimite, colocarOrdenLimite])

  const handleVender = useCallback(async () => {
    if (!empresa) return
    if (cantidad <= 0) return setMensaje("Error: La cantidad debe ser mayor a 0")

    if (tab === "limite") {
      if (!precioLimite) return setMensaje("Error: Ingresa un precio límite")
      await colocarOrdenLimite(ticker, cantidad, Number(precioLimite), "VENTA_LIMITE")
      setMensaje(`Orden de Venta Límite colocada: ${cantidad} ${ticker} @ $${precioLimite}`)
    } else {
      const err = await venderSpot(ticker, cantidad)
      if (err) setMensaje(err)
      else setMensaje(`¡Venta exitosa! Has vendido ${cantidad} ${ticker}.`)
    }
    setTimeout(() => setMensaje(null), 5000) 
  }, [empresa, cantidad, ticker, venderSpot, tab, precioLimite, colocarOrdenLimite])

  const handleColocarSL = useCallback(async () => {
    if (!empresa || !stopLoss) return
    await colocarSL(ticker, cantidad, Number(stopLoss))
    setMensaje(`Stop Loss colocado: $${stopLoss}`)
    setTimeout(() => setMensaje(null), 2000)
  }, [empresa, cantidad, stopLoss, ticker, colocarSL])

  const handleColocarTP = useCallback(async () => {
    if (!empresa || !takeProfit) return
    await colocarTP(ticker, cantidad, Number(takeProfit))
    setMensaje(`Take Profit colocado: $${takeProfit}`)
    setTimeout(() => setMensaje(null), 2000)
  }, [empresa, cantidad, takeProfit, ticker, colocarTP])

  if (!hasCompletedDailyCheckIn) return null

  return (
    <div className={`min-h-screen transition-colors duration-1000 ${miPNL > 0 ? "bg-emerald-50/30" : miPNL < 0 ? "bg-red-50/30" : "bg-page"}`}>
      {/* Header con indicador de PNL reactivo */}
      <header className={`sticky top-0 z-50 bg-white/70 backdrop-blur border-b transition-all duration-500 px-4 py-2 ${miPNL > 0 ? "border-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.1)]" : miPNL < 0 ? "border-red-200 shadow-[0_0_15px_rgba(239,68,68,0.1)]" : "border-slate-100"}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/dashboard/mercado")} className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 shadow-sm transition-all active:scale-90"><ArrowLeft className="w-4 h-4 text-slate-500" /></button>
            {empresa ? (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <img src={empresa.ceo_sprite} alt="" className="w-8 h-8 object-contain" />
                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${empresa.variacion_24h >= 0 ? "bg-emerald-500" : "bg-red-500"}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-black text-navy tracking-tight">{ticker}</p>
                    <span className="text-[9px] font-bold text-white bg-joycon-cyan rounded-full px-1.5 py-0.5 uppercase tracking-wider">{empresa.region}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">{empresa.nombre}</p>
                </div>
              </div>
            ) : <p className="text-sm text-slate-400 animate-pulse">Sincronizando con el Mercado...</p>}
          </div>

          {empresa && (
            <div className="flex items-center gap-6 text-xs">
              {/* PNL WIDGET REACTIVO */}
              {misAcc > 0 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className={`hidden md:flex items-center gap-3 px-4 py-1.5 rounded-2xl border transition-all ${miPNL >= 0 ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-red-50 border-red-100 text-red-700"}`}>
                  <TrendingUp className={`w-3.5 h-3.5 ${miPNL < 0 && "rotate-180"}`} />
                  <div className="text-[10px] font-bold">
                    <p className="opacity-70 leading-none mb-0.5">Tu Posición</p>
                    <p className="font-mono text-xs">{miPNL >= 0 ? "+" : ""}{miPNL.toFixed(2)} PKD ({miPNLPerc.toFixed(2)}%)</p>
                  </div>
                </motion.div>
              )}

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-slate-400 text-[9px] font-bold uppercase tracking-tighter">Precio JFT</p>
                  <p className={`font-black font-mono text-sm tracking-tighter ${useTradeStore.getState().flashMap[ticker] === "up" ? "text-emerald-500" : useTradeStore.getState().flashMap[ticker] === "down" ? "text-red-500" : "text-navy"}`}>
                    ${empresa.precio_actual.toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 text-[9px] font-bold uppercase tracking-tighter">Variación</p>
                  <p className={`font-black font-mono text-xs ${empresa.variacion_24h >= 0 ? "text-plant-green" : "text-coral"}`}>
                    {empresa.variacion_24h >= 0 ? "▲" : "▼"}{Math.abs(empresa.variacion_24h).toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT: Gráfico + Fundamentales */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-2 relative min-w-0 overflow-hidden group">
            <div className="absolute top-4 left-4 z-10 pointer-events-none flex items-center gap-2">
               <span className="text-[10px] font-black text-sky-500 bg-sky-50 px-2 py-1 rounded-lg border border-sky-100 shadow-sm">MA(10) LITE</span>
               <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 shadow-sm flex items-center gap-1">
                 <Clock className="w-3 h-3" /> 5m
               </span>
            </div>
            <div ref={chartRef} className="w-full min-h-[400px] min-w-0" />
          </div>

          {/* FUNDAMENTALES GRID */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Market Cap", val: empresa ? `$${(empresa.market_cap || 0).toLocaleString()} PKD` : "---", icon: Zap, color: "text-amber-500" },
              { label: "Volumen 24h", val: empresa ? `${(empresa.volumen_24h || 0).toLocaleString()} PKD` : "---", icon: Clock, color: "text-blue-500" },
              { label: "Máx 52W", val: empresa ? `$${(empresa.max_52w || 0).toFixed(2)}` : "---", icon: TrendingUp, color: "text-emerald-500" },
              { label: "Mín 52W", val: empresa ? `$${(empresa.min_52w || 0).toFixed(2)}` : "---", icon: TrendingDown, color: "text-red-500" },
            ].map((f, i) => (
              <div key={i} className="bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-default group">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-1.5 rounded-lg bg-slate-50 ${f.color}`}>
                    <f.icon className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{f.label}</p>
                </div>
                <p className="text-sm font-black text-navy font-mono group-hover:scale-105 transition-transform origin-left">{f.val}</p>
              </div>
            ))}
          </div>
        </div>

        {/* MIDDLE: Order Book + Sentiment */}
        <div className="lg:col-span-2 space-y-4">
          {/* INDICADOR DE SENTIMIENTO */}
          <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-4 overflow-hidden relative">
            <div className="flex justify-between items-center mb-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sentimiento</p>
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${empresa?.variacion_24h && empresa.variacion_24h > 0 ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}>
                {empresa?.variacion_24h && empresa.variacion_24h > 0 ? "BULLISH" : "BEARISH"}
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
              <div className="h-full bg-emerald-400" style={{ width: "65%" }} />
              <div className="h-full bg-red-400" style={{ width: "35%" }} />
            </div>
            <p className="text-[9px] text-slate-400 mt-2 italic text-center font-medium">Basado en flujos de n8n & noticias</p>
          </div>

          <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-3 min-h-[350px] flex flex-col">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3 flex justify-between px-1">
              <span>Precio</span><span>Cant.</span>
            </p>
            <div className="space-y-0.5 mb-auto">
              {orderBook.asks.map((a, i) => (
                <div key={i} className="flex justify-between text-[10px] font-mono relative overflow-hidden group cursor-pointer hover:bg-red-50 px-1 py-0.5 rounded transition-colors">
                  <div className="absolute right-0 top-0 bottom-0 bg-red-500/5 transition-all group-hover:bg-red-500/10" style={{ width: `${(a.size / 600) * 100}%` }} />
                  <span className="text-red-500 relative z-10 font-bold">${a.price.toFixed(2)}</span>
                  <span className="text-slate-400 relative z-10">{a.size}</span>
                </div>
              ))}
            </div>
            <div className="py-3 flex items-center justify-center gap-2 border-y border-slate-50 my-2 bg-slate-50/50 rounded-xl">
               <span className={`text-sm font-black font-mono tracking-tighter ${empresa?.variacion_24h && empresa.variacion_24h >= 0 ? "text-plant-green" : "text-coral"}`}>
                 ${empresa?.precio_actual.toFixed(2)} {empresa?.variacion_24h && empresa.variacion_24h >= 0 ? "↑" : "↓"}
               </span>
            </div>
            <div className="space-y-0.5">
              {orderBook.bids.map((b, i) => (
                <div key={i} className="flex justify-between text-[10px] font-mono relative overflow-hidden group cursor-pointer hover:bg-emerald-50 px-1 py-0.5 rounded transition-colors">
                  <div className="absolute right-0 top-0 bottom-0 bg-emerald-500/5 transition-all group-hover:bg-emerald-500/10" style={{ width: `${(b.size / 600) * 100}%` }} />
                  <span className="text-emerald-500 relative z-10 font-bold">${b.price.toFixed(2)}</span>
                  <span className="text-slate-400 relative z-10">{b.size}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Panel de Trading */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-5 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl opacity-10 pointer-events-none ${tab === "mercado" ? "bg-joycon-cyan" : "bg-amber-400"}`} />
            
            {/* Tabs Mercado / Límite */}
            <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl mb-5">
              <button onClick={() => setTab("mercado")} className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${tab === "mercado" ? "bg-white text-navy shadow-sm scale-[1.02]" : "text-slate-400 hover:text-slate-500"}`}>MERCADO</button>
              <button onClick={() => setTab("limite")} className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${tab === "limite" ? "bg-white text-navy shadow-sm scale-[1.02]" : "text-slate-400 hover:text-slate-500"}`}>LÍMITE</button>
            </div>

            {/* Cantidad */}
            <div className="mb-4">
              <div className="flex justify-between items-end mb-1.5 px-1">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Cantidad</p>
                <p className="text-[10px] text-slate-300 font-medium">Disponible: {misAcc}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setCantidad(Math.max(1, cantidad - 1))} className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 text-navy font-bold hover:bg-slate-100 transition-colors shadow-sm">−</button>
                <input type="number" value={cantidad} onChange={(e) => setCantidad(Math.max(1, Number(e.target.value) || 1))} className="flex-1 text-center text-sm font-mono font-black text-navy bg-white border border-slate-100 rounded-xl py-2 shadow-inner outline-none focus:ring-2 focus:ring-joycon-cyan/20" />
                <button onClick={() => setCantidad(cantidad + 1)} className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 text-navy font-bold hover:bg-slate-100 transition-colors shadow-sm">+</button>
              </div>
            </div>

            {/* Precio límite (solo en modo límite) */}
            {tab === "limite" && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="mb-4">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 px-1">Precio Objetivo</p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 font-bold text-xs">$</span>
                  <input type="number" value={precioLimite} onChange={(e) => setPrecioLimite(e.target.value)} placeholder={empresa ? `${empresa.precio_actual}` : ""} className="w-full text-sm font-mono font-black pl-7 pr-3 bg-white border border-slate-100 rounded-xl py-2 shadow-inner outline-none focus:ring-2 focus:ring-amber-400/20" />
                </div>
              </motion.div>
            )}

            {/* Gestión de Riesgo (SL/TP) */}
            <div className="space-y-3 mb-5 border-t border-slate-50 pt-4">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1 px-1">Gestión de Riesgo</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative group">
                   <div className="absolute -left-1 top-0 bottom-0 w-0.5 bg-red-400 rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity" />
                   <input type="number" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} placeholder="STOP LOSS" className="w-full text-[10px] font-mono font-bold bg-red-50/30 border border-red-100/50 rounded-xl py-2 px-3 outline-none focus:bg-red-50 transition-colors placeholder:text-red-300" />
                </div>
                <div className="relative group">
                   <div className="absolute -left-1 top-0 bottom-0 w-0.5 bg-emerald-400 rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity" />
                   <input type="number" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} placeholder="TAKE PROFIT" className="w-full text-[10px] font-mono font-bold bg-emerald-50/30 border border-emerald-100/50 rounded-xl py-2 px-3 outline-none focus:bg-emerald-50 transition-colors placeholder:text-emerald-300" />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleColocarSL} disabled={!stopLoss} className="flex-1 py-1.5 rounded-xl border border-red-200 text-red-500 text-[9px] font-black uppercase tracking-tighter disabled:opacity-20 hover:bg-red-500 hover:text-white transition-all">Set SL</button>
                <button onClick={handleColocarTP} disabled={!takeProfit} className="flex-1 py-1.5 rounded-xl border border-emerald-200 text-emerald-500 text-[9px] font-black uppercase tracking-tighter disabled:opacity-20 hover:bg-emerald-500 hover:text-white transition-all">Set TP</button>
              </div>
            </div>

            {/* Resumen */}
            <div className="bg-slate-50 rounded-2xl p-3 space-y-1.5 mb-5 border border-slate-100/50">
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-slate-400">VALOR ORDEN</span>
                <span className="font-mono text-navy">${(empresa ? empresa.precio_actual * cantidad : 0).toLocaleString()} PKD</span>
              </div>
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-slate-400">COMISIÓN (1%)</span>
                <span className="font-mono text-red-400">-${comision.toLocaleString()} PKD</span>
              </div>
              <div className="h-px bg-slate-200/50 my-1" />
              <div className="flex justify-between text-[11px] font-black">
                <span className="text-navy">TOTAL A PAGAR</span>
                <span className="font-mono text-joycon-cyan">${totalOp.toLocaleString()} PKD</span>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex gap-3">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleComprar}
                className="flex-[1.5] py-3.5 rounded-2xl bg-gradient-to-br from-emerald-500 to-plant-green text-white font-black text-xs shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2">
                <Zap className="w-3.5 h-3.5" /> COMPRAR
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleVender}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-br from-coral to-nintendo-red text-white font-black text-xs shadow-lg shadow-red-200 transition-all">
                VENDER
              </motion.button>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
              <CheckCircle2 className="w-3 h-3 text-joycon-cyan" /> 
              <span>Trading Pro Verificado</span>
            </div>
          </div>

          {/* Órdenes Activas */}
          <AnimatePresence>
            {misOrdenes.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-4">
                <div className="flex items-center gap-2 mb-3">
                   <Clock className="w-3.5 h-3.5 text-amber-500" />
                   <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Órdenes Pendientes</p>
                </div>
                <div className="space-y-2">
                  {misOrdenes.map((o) => (
                    <div key={o.id} className="flex items-center justify-between text-[10px] p-2 bg-slate-50 rounded-xl border border-slate-100 group transition-all hover:bg-white hover:border-joycon-cyan/30">
                      <div className="flex flex-col">
                        <span className={`font-black tracking-tighter ${o.tipo.includes("COMPRA") || o.tipo.includes("STOP") ? "text-plant-green" : "text-coral"}`}>{o.tipo}</span>
                        <span className="text-slate-400 font-medium">{o.cantidad} Acc.</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-black text-navy text-xs">${o.precio_objetivo.toFixed(1)}</span>
                        <button onClick={() => cancelarOrden(o.id)} className="w-6 h-6 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-300 hover:text-red-500 hover:border-red-100 shadow-sm transition-all"><X className="w-3 h-3" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* BOTTOM: Posiciones Detalladas */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden relative">
          {/* Fondo decorativo */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-joycon-cyan via-emerald-500 to-nintendo-red opacity-50" />
          
          <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
            <h3 className="text-lg font-black text-navy flex items-center gap-3 tracking-tight">
              <TrendingUp className="w-5 h-5 text-emerald-500" /> POSICIONES ABIERTAS SPOT
            </h3>
            <div className="flex gap-4">
               <div className="text-right">
                 <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Saldo Total</p>
                 <p className="text-sm font-black text-navy font-mono">${pkdBalance.toLocaleString()} PKD</p>
               </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] text-slate-400 uppercase tracking-widest">
                  <th className="px-8 py-4 font-black">Activo / Par</th>
                  <th className="px-8 py-4 font-black">Cantidad</th>
                  <th className="px-8 py-4 font-black">Entrada Prom.</th>
                  <th className="px-8 py-4 font-black">Precio Mercado</th>
                  <th className="px-8 py-4 font-black">PNL No Realizado</th>
                  <th className="px-8 py-4 font-black text-right">Gestión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {todasMisPosiciones.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-16 text-center">
                      <div className="max-w-xs mx-auto">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                          <Zap className="w-8 h-8 text-slate-200" />
                        </div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Sin Posiciones</p>
                        <p className="text-[10px] text-slate-300">Tus compras spot aparecerán aquí con seguimiento en tiempo real.</p>
                      </div>
                    </td>
                  </tr>
                ) : todasMisPosiciones.map((pos) => (
                  <tr key={pos.ticker} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-navy text-white flex items-center justify-center text-xs font-black shadow-lg shadow-navy/20">{pos.ticker}</div>
                        <div>
                          <p className="text-sm font-black text-navy leading-none mb-1">{pos.ticker} / PKD</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Spot Trading</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-xs font-mono font-bold text-slate-600">{pos.cantidad.toLocaleString()}</td>
                    <td className="px-8 py-6 text-xs font-mono font-bold text-slate-600">${pos.precio_promedio.toFixed(2)}</td>
                    <td className="px-8 py-6 text-xs font-mono font-black text-navy">${pos.currentPrice.toFixed(2)}</td>
                    <td className="px-8 py-6">
                      <div className={`text-xs font-black font-mono flex flex-col ${pos.pnl >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                        <span className="text-sm">{pos.pnl >= 0 ? "+" : ""}{pos.pnl.toFixed(2)} PKD</span>
                        <span className="text-[10px] opacity-70 tracking-tighter">{pos.pnlPerc >= 0 ? "▲" : "▼"} {Math.abs(pos.pnlPerc).toFixed(2)}%</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <motion.button 
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={async () => {
                          const err = await venderSpot(pos.ticker, pos.cantidad)
                          if (err) setMensaje(err)
                          else setMensaje(`¡Posición cerrada! Has liquidado ${pos.ticker}.`)
                        }}
                        className="px-5 py-2 rounded-xl bg-red-50 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-100"
                      >
                        CERRAR POSICIÓN
                      </motion.button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL DE NOTIFICACIÓN */}
      <AnimatePresence>
        {mensaje && <TradeModal message={mensaje} onClose={() => setMensaje(null)} />}
      </AnimatePresence>
    </div>
  )
}
