"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { supabaseReady, supabase } from "@/shared/lib/supabase/client"
import { johtoSounds } from "@/shared/lib/sounds"
import { useEconomyStore } from "@/store/useEconomyStore"

const COMISION = 0.01
const ENERGIA_MAXIMA = 3

export interface Empresa {
  id: string; ticker: string; nombre: string; region: string; sector: string
  ceo_nombre: string; ceo_sprite: string; descripcion: string
  precio_base: number; precio_actual: number; precio_cierre: number
  variacion_24h: number; capitalizacion_mercado: number
  historia?: string; num_empleados?: number; sede_principal?: string
  sentimiento_mercado?: string; tasa_dividendo?: number
  market_cap?: number; volumen_24h?: number; max_52w?: number; min_52w?: number
  objeto_perk_id?: string; umbral_perk?: number
  beneficios_json?: any[]
  logo_url?: string
}

export interface VelaOHLC {
  time: number; open: number; high: number; low: number; close: number; p?: number
}

export interface OrdenPendiente {
  id: string; empresa_id: string; ticker: string
  tipo: string; cantidad: number; precio_objetivo: number; estado: string
}

export interface Transaccion {
  id: string; usuario_id: string; empresa_id: string; ticker: string
  tipo: string; cantidad: number; precio_ejecucion: number
  comision_pagada: number; total_neto: number; creada_en: string
}

export interface Noticia {
  id: string
  titulo: string
  descripcion: string
  ticker_afectado: string
  sector_afectado?: string
  region_afectada?: string
  factor_impacto: number
  noticia_tipo?: 'POSITIVA' | 'NEGATIVA' | 'CRISIS' | 'BULLISH' | 'NEUTRAL'
  duracion_horas?: number
  sentimiento: string
  fuente?: string
  autor?: string
  imagen_url?: string
  fue_procesada?: boolean
  publicada_en: string
  estado?: 'PROGRAMADA' | 'ACTIVA' | 'EXPIRADA'
}

interface LifeSyncState {
  // saldo_pkd eliminado — lee useEconomyStore.getState().pkdBalance
  energia_trading: number
  racha_habitos: number
  cumplimiento_semanal: number
}

interface TradeState {
  empresas: Empresa[]
  velas: Record<string, VelaOHLC[]>
  portafolio: Record<string, { cantidad: number; precio_promedio: number }>
  ordenes: OrdenPendiente[]
  transacciones: Transaccion[]
  noticias: Noticia[]
  notificaciones: string[]
  flashMap: Record<string, "up" | "down" | null>
  cargando: boolean
  tickActivo: boolean
  _tickRequests?: any[]
  _evaluarTick?: () => void

  // LifeSync
  life: LifeSyncState
  usuario_id: string | null

  // Acciones LifeSync
  completarHabito: () => void
  restarEnergia: () => boolean

  // Acciones Mercado
  cargarDatos: () => Promise<void>
  cargarHistorialTicker: (ticker: string) => Promise<void>
  cargarNoticias: () => Promise<void>
  suscribirRealtime: () => () => void
  procesarUpdateEmpresa: (payload: any) => void
  iniciarTick: (intervalMs?: number) => () => void
  detenerTick: () => void
  generarVela: (ticker: string) => void
  motorMercado: () => void
  aplicarTickVisual: () => void
  inyectarNoticia: (ticker: string, impacto: number) => void
  forzarSubida: (ticker: string) => void
  forzarCaida: (ticker: string) => void

  // Acciones Trading
  comprarSpot: (ticker: string, cantidad: number) => Promise<string | null>
  venderSpot: (ticker: string, cantidad: number) => Promise<string | null>
  colocarSL: (ticker: string, cantidad: number, precio: number) => void
  colocarTP: (ticker: string, cantidad: number, precio: number) => void
  colocarOrdenLimite: (ticker: string, cantidad: number, precio: number, tipo: "COMPRA_LIMITE" | "VENTA_LIMITE") => Promise<void>
  cancelarOrden: (id: string) => void

  // Dev
  simularTickGlobal: () => void
  aumentarCumplimiento: () => void
  crashMercado: () => void
}

function generarFecha(n: number): number {
  const bucket = Math.floor(Date.now() / 1000 / 300) * 300
  return bucket - (n * 300)
}

function generarVelas(precioBase: number, cantidad: number): VelaOHLC[] {
  let p = precioBase
  const velas: VelaOHLC[] = []
  
  for (let i = 0; i < cantidad; i++) {
    // El precio actual (p) es el cierre (close) de esta vela
    const c = Math.round(p * 100) / 100
    
    // Simulamos la apertura de esta vela
    const o = Math.round((p + (Math.random() - 0.5) * p * 0.02) * 100) / 100
    
    // Máximos y mínimos basados en o y c
    const max_oc = Math.max(o, c)
    const min_oc = Math.min(o, c)
    const h = Math.round(max_oc * (1 + Math.random() * 0.01) * 100) / 100
    const l = Math.round(min_oc * (1 - Math.random() * 0.01) * 100) / 100
    
    velas.push({ 
      time: generarFecha(i), 
      p: c,
      open: o, 
      high: h, 
      low: l, 
      close: c 
    })
    
    // El cierre de la vela anterior (más antigua) será aprox la apertura de esta
    p = o
  }
  
  // Invertir para que quede ordenado cronológicamente (pasado -> presente)
  return velas.reverse()
}

// ============================================================
// MARKET ENGINE SINGLETON — Inmortal ante HMR y recargas
// Vive a nivel de módulo, completamente fuera de React.
// ============================================================
let engineInstance: MarketEngine | null = null;

class MarketEngine {
  private visualIntervalId: ReturnType<typeof setInterval> | null = null
  private syncIntervalId: ReturnType<typeof setInterval> | null = null
  private observers: Set<string> = new Set()
  private lastSyncAt: number = 0
  private readonly VISUAL_INTERVAL_MS = 3000
  private readonly SYNC_ACTIVE_MS = 15 * 60 * 1000
  private readonly SYNC_DORMANT_MS = 6 * 60 * 60 * 1000

  static getInstance(): MarketEngine {
    if (!engineInstance) engineInstance = new MarketEngine();
    return engineInstance;
  }

  join(id: string) {
    const wasEmpty = this.observers.size === 0
    this.observers.add(id)
    if (wasEmpty) {
      this._startVisualTick()
      this._startSyncTick()
    }
  }

  leave(id: string) {
    this.observers.delete(id)
    if (this.observers.size === 0) {
      this._stopAll()
    }
  }

  private _startVisualTick() {
    if (this.visualIntervalId) return
    this.visualIntervalId = setInterval(() => {
      useTradeStore.getState().aplicarTickVisual()
    }, this.VISUAL_INTERVAL_MS)
  }

  private _startSyncTick() {
    if (this.syncIntervalId) return
    this._doSync()
    this.syncIntervalId = setInterval(() => this._doSync(), this.SYNC_ACTIVE_MS)
  }

  private async _doSync() {
    if (!supabaseReady || !supabase) return
    const now = Date.now()
    const modo = this.observers.size > 0 ? 'ACTIVO' : 'REPOSO'
    const minInterval = modo === 'ACTIVO' ? this.SYNC_ACTIVE_MS : this.SYNC_DORMANT_MS
    if (now - this.lastSyncAt < minInterval * 0.9) return
    try {
      const { data } = await (supabase.rpc as any)('tick_mercado_adaptativo', { p_modo: modo })
      if (data?.status === 'ok') {
        this.lastSyncAt = now
        await useTradeStore.getState().cargarDatos()
      }
    } catch (err) {
      console.warn('[MarketEngine] Sync fallido:', err)
    }
  }

  private _stopAll() {
    if (this.visualIntervalId) { clearInterval(this.visualIntervalId); this.visualIntervalId = null }
    if (this.syncIntervalId) { clearInterval(this.syncIntervalId); this.syncIntervalId = null }
  }
}

const EMPRESAS_MOCK: Empresa[] = [
  { id: "s1", ticker: "SLPH", nombre: "Silph Co.", region: "Kanto", sector: "Tecnología", ceo_nombre: "Presidente Silph", ceo_sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/max-revive.png", descripcion: "Monopolio global de Poké Balls y tecnología de contención Ether.", precio_base: 312, precio_actual: 312.40, precio_cierre: 308, variacion_24h: 4.83, capitalizacion_mercado: 520000 },
  { id: "s2", ticker: "DVN", nombre: "Devon Corp.", region: "Hoenn", sector: "Tecnología", ceo_nombre: "Sr. Peñas", ceo_sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/devon-parts.png", descripcion: "Nanotecnología y restauración fósil con expansión agresiva.", precio_base: 142, precio_actual: 142.80, precio_cierre: 145, variacion_24h: -1.65, capitalizacion_mercado: 380000 },
  { id: "s3", ticker: "MOOM", nombre: "Granja Mu-Mu", region: "Johto", sector: "Agricultura", ceo_nombre: "Granjero Baoba", ceo_sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/moomoo-milk.png", descripcion: "Leche Mu-Mu, el estándar lácteo de Johto.", precio_base: 67, precio_actual: 67.30, precio_cierre: 63, variacion_24h: 6.66, capitalizacion_mercado: 120000 },
  { id: "s4", ticker: "RCKT", nombre: "Rocket Game Corner", region: "Kanto", sector: "Entretenimiento", ceo_nombre: "Giovanni", ceo_sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/blackglasses.png", descripcion: "Imperio de casinos con nexos en el mercado Ether.", precio_base: 55, precio_actual: 53.20, precio_cierre: 55, variacion_24h: -3.27, capitalizacion_mercado: 85000 },
]

/** Instancia global para exportar a componentes */
export const marketEngine = MarketEngine.getInstance()

export const useTradeStore = create<TradeState>()(
  persist(
    (set, get) => ({
      empresas: [],
      velas: {},
      portafolio: {},
      ordenes: [],
      transacciones: [],
      noticias: [],
      notificaciones: [],
      flashMap: {},
      cargando: false,
      tickActivo: false,
      usuario_id: null,
      life: { energia_trading: ENERGIA_MAXIMA, racha_habitos: 0, cumplimiento_semanal: 50 },

      // --- LifeSync ---
      completarHabito: () => {
        set((s) => ({
          life: {
            ...s.life,
            energia_trading: ENERGIA_MAXIMA,
            racha_habitos: s.life.racha_habitos + 1,
            cumplimiento_semanal: Math.min(100, s.life.cumplimiento_semanal + 5),
          },
          notificaciones: [...s.notificaciones, "¡Hábito completado! Energía restaurada a " + ENERGIA_MAXIMA],
        }))
      },

      restarEnergia: () => {
        const e = get().life.energia_trading
        if (e <= 0) return false
        set((s) => ({ life: { ...s.life, energia_trading: e - 1 } }))
        return true
      },

      // --- Mercado ---
      cargarDatos: async () => {
        set({ cargando: true })
        
        // 1. Cargar Empresas
        if (supabaseReady && supabase) {
          const { data: emps } = await (supabase.from("empresas") as any).select("*").order("ticker").limit(100)
          if (emps) set({ empresas: emps as Empresa[] })

          // 2. Sincronizar Usuario
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            set({ usuario_id: user.id })
            
            // Saldo PKD: gestionado exclusivamente por useEconomyStore + Realtime
            // No leer pkd_balance aquí — evita desincronización
            const econStore = useEconomyStore.getState()
            if (!econStore.isReady) {
              await econStore.loadBalance(user.id)
            }

            // Cargar Portafolio
            const { data: portData } = await (supabase.from("portafolio_usuario") as any).select("*, empresas(ticker)").eq("usuario_id", user.id)
            if (portData) {
              const portMap: Record<string, { cantidad: number; precio_promedio: number }> = {}
              portData.forEach((p: any) => {
                if (p.empresas?.ticker) {
                  portMap[p.empresas.ticker] = { 
                    cantidad: p.cantidad, 
                    precio_promedio: Number(p.precio_promedio) 
                  }
                }
              })
              set({ portafolio: portMap })
            }

            // Cargar Órdenes Pendientes
            const { data: ordData } = await (supabase.from("ordenes_pendientes") as any).select("*, empresas(ticker)").eq("usuario_id", user.id).eq("estado", "ACTIVA")
            if (ordData) {
              set({ ordenes: ordData.map((o: any) => ({
                id: o.id, empresa_id: o.empresa_id, ticker: o.empresas?.ticker || '?',
                tipo: o.tipo_orden, cantidad: o.cantidad, precio_objetivo: Number(o.precio_objetivo), estado: o.estado
              })) })
            }
          }
        } else {
          set({ empresas: EMPRESAS_MOCK })
        }
        set({ cargando: false })
      },

      cargarHistorialTicker: async (ticker: string) => {
        const existing = get().velas[ticker]
        if (existing && existing.length > 0) {
          // Si el formato es antiguo (tiempo numérico), forzamos recarga
          if (typeof existing[0].time === 'number') {
            set(s => ({ velas: { ...s.velas, [ticker]: [] } }))
          } else {
            return
          }
        }

        if (supabaseReady && supabase) {
          let emp = get().empresas.find(e => e.ticker === ticker)
          if (!emp) {
            const { data: empDb } = await (supabase.from("empresas") as any).select("*").eq("ticker", ticker).single()
            if (empDb) emp = empDb
          }

          if (emp) {
            const { data } = await (supabase.from("historial_ohlc") as any)
              .select("apertura, maximo, minimo, cierre, registrado_en")
              .eq("empresa_id", emp.id)
              .order("registrado_en", { ascending: true })
              .limit(1000)

            if (data && data.length > 0) {
              const history = data.map((h: any) => {
                const closePrice = parseFloat(h.cierre)
                return {
                  time: Math.floor(new Date(h.registrado_en).getTime() / 1000), 
                  p: closePrice,
                  open: parseFloat(h.apertura),
                  high: parseFloat(h.maximo),
                  low: parseFloat(h.minimo),
                  close: closePrice
                }
              })
              set(s => ({ velas: { ...s.velas, [ticker]: history.slice(-50) } }))
              return
            }
          }
        }
        
        const empLocal = get().empresas.find(e => e.ticker === ticker)
        if (empLocal) {
          set(s => ({ velas: { ...s.velas, [ticker]: generarVelas(empLocal.precio_actual, 60) } }))
        }
      },

      cargarNoticias: async () => {
        if (supabaseReady && supabase) {
          const { data } = await (supabase.from("noticias_mercado") as any)
            .select("id,titulo,descripcion,ticker_afectado,sector_afectado,region_afectada,factor_impacto,noticia_tipo,duracion_horas,sentimiento,fuente,autor,imagen_url,fue_procesada,publicada_en,estado")
            .order("publicada_en", { ascending: false })
            .limit(30)
          if (data) {
            set({ noticias: data as Noticia[] })
            return
          }
        }
        // Mock news fallback
        set({
          noticias: [
            { id: "n1", titulo: "Nueva patente de Silph Co.", descripcion: "Silph Co. anuncia una nueva tecnología de captura ultra eficiente.", ticker_afectado: "SLPH", factor_impacto: 0.05, sentimiento: "positivo", noticia_tipo: "POSITIVA", fuente: "Johto Financial Times", autor: "Redacción JFT", publicada_en: new Date().toISOString(), estado: 'ACTIVA' },
            { id: "n2", titulo: "Crisis de producción en Granja Mu-Mu", descripcion: "Una plaga afecta la producción de leche en Johto.", ticker_afectado: "MOOM", factor_impacto: -0.08, sentimiento: "negativo", noticia_tipo: "NEGATIVA", fuente: "Johto Financial Times", autor: "Redacción JFT", publicada_en: new Date().toISOString(), estado: 'ACTIVA' },
          ],
        })
      },

      suscribirRealtime: () => {
        if (!supabaseReady || !supabase) return () => {}

        const engine = MarketEngine.getInstance()
        const id = Math.random().toString(36).substr(2, 9)
        engine.join(id)

        const channel = supabase
          .channel('cambios_mercado_v2')
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'empresas' }, (payload) => {
            get().procesarUpdateEmpresa(payload.new)
          })
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'noticias_mercado' }, () => {
            get().cargarNoticias()
          })
          .subscribe()

        return () => {
          engine.leave(id)
          supabase?.removeChannel(channel)
        }
      },

      procesarUpdateEmpresa: (emp: any) => {
        set((s) => {
          const nuevasEmpresas = s.empresas.map((e) => e.id === emp.id ? { ...e, ...emp } : e)
          
          const ticker = emp.ticker
          const currentVelas = [...(s.velas[ticker] ?? [])]
          if (currentVelas.length > 0) {
            const p = Number(emp.precio_actual)
            const currentBucket = Math.floor(Date.now() / 1000 / 300) * 300
            const last = { ...currentVelas[currentVelas.length - 1] }
            
            if (last.time < currentBucket) {
               currentVelas.push({
                  time: currentBucket,
                  open: last.close,
                  high: Math.max(last.close, p),
                  low: Math.min(last.close, p),
                  close: p,
                  p: p
               })
               if (currentVelas.length > 50) currentVelas.shift()
            } else {
               last.close = p
               last.high = Math.max(last.high, p)
               last.low = Math.min(last.low, p)
               currentVelas[currentVelas.length - 1] = last
            }
          }

          // Sonido de tick sutil (solo si el precio cambió)
          if (emp.precio_actual !== (s.empresas.find(e => e.id === emp.id)?.precio_actual)) {
            johtoSounds.playTick()
          }

          const oldPrice = s.empresas.find(e => e.id === emp.id)?.precio_actual ?? 0
          const flash = emp.precio_actual > oldPrice ? "up" : emp.precio_actual < oldPrice ? "down" : null

          return { 
            empresas: nuevasEmpresas, 
            velas: { ...s.velas, [ticker]: currentVelas },
            flashMap: { ...s.flashMap, [ticker]: flash }
          }
        })

        // Limpiar flash después de un momento
        setTimeout(() => {
          set((s) => ({ flashMap: { ...s.flashMap, [emp.ticker]: null } }))
        }, 1000)
      },

      iniciarTick: (intervalMs = 30000) => {
        const id = Math.random().toString(36).substr(2, 9)
        const requests = [...(get()._tickRequests || [])]
        requests.push({ id, intervalMs })
        set({ _tickRequests: requests })
        
        get()._evaluarTick?.()

        // Devolvemos la función de limpieza específica para este caller
        return () => {
          const currentReqs = get()._tickRequests || []
          set({ _tickRequests: currentReqs.filter((r: any) => r.id !== id) })
          get()._evaluarTick?.()
        }
      },

      _evaluarTick: () => {
        const requests = (get() as any)._tickRequests || []
        const currentInterval = (get() as any)._currentIntervalRef
        
        if (requests.length === 0) {
          if (currentInterval) clearInterval(currentInterval)
          set({ tickActivo: false, _currentIntervalRef: null, _activeIntervalMs: null } as any)
          return
        }

        // Encontrar el intervalo más rápido solicitado
        const minInterval = Math.min(...requests.map((r: any) => r.intervalMs))
        const activeIntervalMs = (get() as any)._activeIntervalMs

        // Si ya estamos corriendo al ritmo correcto, no hacer nada
        if (get().tickActivo && activeIntervalMs === minInterval) return

        // Si hay que cambiar el ritmo, limpiamos el actual
        if (currentInterval) clearInterval(currentInterval)

        set({ tickActivo: true, _activeIntervalMs: minInterval } as any)

        const tick = async () => {
          if (!get().tickActivo) return
          if (supabaseReady && supabase) {
            try {
              const { error } = await supabase.rpc('simular_tick_mercado')
              if (error) throw error
            } catch (err) {
              console.warn("RPC falló, usando motor local:", err)
              get().motorMercado()
            }
          } else {
            get().motorMercado() // Fallback local
          }
        }

        tick()
        const interval = setInterval(tick, minInterval)
        set({ _currentIntervalRef: interval } as any)
      },

      detenerTick: () => {
        // Backwards compatibility for callers not using the returned cleanup
      },

      generarVela: (ticker) => {
        set((s) => {
          const velas = [...(s.velas[ticker] ?? [])]
          const last = velas[velas.length - 1]
          if (!last) return {}
          const p = last.close + (Math.random() - 0.45) * last.close * 0.002
          const o = last.close
          const h = Math.round(Math.max(o, p + Math.random() * p * 0.001) * 100) / 100
          const l = Math.round(Math.min(o, p - Math.random() * p * 0.001) * 100) / 100
          const c = Math.round(p * 100) / 100
          const flash = c > o ? "up" : c < o ? "down" : null
          
          // Nueva vela 5 minutos después de la última
          const lastTime = last.time
          const newTime = lastTime + 300 
          
          velas.push({ time: newTime, p: c, open: o, high: h, low: l, close: c })
          const newEmpresas = s.empresas.map((e) =>
            e.ticker === ticker ? { ...e, precio_actual: c, precio_cierre: e.precio_actual, variacion_24h: Math.round(((c - e.precio_cierre) / e.precio_cierre) * 10000) / 100 } : e
          )
          return { velas: { ...s.velas, [ticker]: velas.slice(-20) }, empresas: newEmpresas, flashMap: { ...s.flashMap, [ticker]: flash } }
        })
        // Limpiar flash del motor local después de un momento
        setTimeout(() => {
          set((s) => ({ flashMap: { ...s.flashMap, [ticker]: null } }))
        }, 600)

        // Check SL/TP triggers
        const emp = get().empresas.find((e) => e.ticker === ticker)
        const precioActual = emp?.precio_actual ?? 0
        const pendientes = get().ordenes.filter((o) => o.ticker === ticker && o.estado === "ACTIVA")
        for (const o of pendientes) {
          if (
            (o.tipo === "STOP_LOSS" && precioActual <= o.precio_objetivo) ||
            (o.tipo === "TAKE_PROFIT" && precioActual >= o.precio_objetivo)
          ) {
            // Execute
            set((s) => ({
              ordenes: s.ordenes.map((or) => (or.id === o.id ? { ...or, estado: "EJECUTADA" } : or)),
              notificaciones: [...s.notificaciones, `${o.tipo} ejecutado: ${ticker} @ $${precioActual.toFixed(2)}`],
              transacciones: [...s.transacciones, {
                id: crypto.randomUUID(), usuario_id: "local", empresa_id: emp?.id ?? "", ticker,
                tipo: o.tipo === "STOP_LOSS" ? "VENTA_SL" : "VENTA_TP", cantidad: o.cantidad,
                precio_ejecucion: precioActual, comision_pagada: 0, total_neto: o.cantidad * precioActual,
                creada_en: new Date().toISOString(),
              }],
            }))
          }
        }
      },

      motorMercado: () => {
        for (const e of get().empresas) get().generarVela(e.ticker)
      },

      aplicarTickVisual: () => {
        set((s) => {
          if (!s.empresas.length) return s
          const flashMap: Record<string, "up" | "down" | null> = {}
          const currentBucket = Math.floor(Date.now() / 1000 / 300) * 300
          
          const nuevasEmpresas = s.empresas.map((e) => {
            const ruido = (Math.random() - 0.48) * 0.0002
            const nuevoPrecio = parseFloat((e.precio_actual * (1 + ruido)).toFixed(2))
            flashMap[e.ticker] = nuevoPrecio > e.precio_actual ? "up" : "down"
            return { ...e, precio_actual: nuevoPrecio }
          })

          const nuevasVelas = { ...s.velas }
          nuevasEmpresas.forEach((e) => {
            const ticker = e.ticker
            const p = e.precio_actual
            const velasActuales = [...(nuevasVelas[ticker] ?? [])]
            
            if (velasActuales.length > 0) {
              const last = { ...velasActuales[velasActuales.length - 1] }
              if (last.time < currentBucket) {
                 velasActuales.push({
                    time: currentBucket,
                    open: last.close,
                    high: Math.max(last.close, p),
                    low: Math.min(last.close, p),
                    close: p,
                    p: p
                 })
                 if (velasActuales.length > 50) velasActuales.shift()
              } else {
                 last.close = p
                 last.high = Math.max(last.high, p)
                 last.low = Math.min(last.low, p)
                 velasActuales[velasActuales.length - 1] = last
              }
              nuevasVelas[ticker] = velasActuales
            }
          })

          return {
            empresas: nuevasEmpresas,
            flashMap,
            velas: nuevasVelas
          }
        })
        
        setTimeout(() => {
          set((s) => ({ flashMap: Object.fromEntries(Object.keys(s.flashMap).map(k => [k, null])) }))
        }, 800)
      },

      inyectarNoticia: (ticker, impacto) => {
        set((s) => ({
          empresas: s.empresas.map((e) => e.ticker === ticker ? { ...e, precio_actual: Math.round(e.precio_actual * (1 + impacto) * 100) / 100, variacion_24h: Math.round((e.variacion_24h + impacto * 100) * 100) / 100 } : e),
          notificaciones: [...s.notificaciones, `NOTICIA: ${ticker} ${impacto > 0 ? "sube" : "baja"} ${Math.round(Math.abs(impacto) * 100)}%`],
        }))
      },

      forzarSubida: (ticker) => { get().inyectarNoticia(ticker, 0.15) },
      forzarCaida: (ticker) => { get().inyectarNoticia(ticker, -0.15) },

      // --- Trading ---
      comprarSpot: async (ticker, cantidad) => {
        const emp = get().empresas.find((e) => e.ticker === ticker)
        const uid = get().usuario_id
        if (!emp) return "Empresa no encontrada"
        // Energía desactivada para Trading Pro
        // if (!get().restarEnergia()) return "Energía agotada. Completa hábitos para recargar."
        
        const costo = emp.precio_actual * cantidad
        const comisionCargo = Math.round(costo * COMISION * 100) / 100
        const total = costo + comisionCargo

        const currentBalance = useEconomyStore.getState().pkdBalance
        if (total > currentBalance) return `Saldo insuficiente. Necesitas $${total.toLocaleString()} PKD.`

        if (supabaseReady && supabase && uid) {
          // 1. Descontar saldo via RPC atómica (fuente de verdad)
          const nuevoSaldo = await useEconomyStore.getState().modifySaldo(-total, 'trade')
          if (nuevoSaldo === null) return "Error al procesar pago."

          // 2. Log Transacción
          await (supabase.from("historial_transacciones") as any).insert({
            usuario_id: uid, empresa_id: emp.id, tipo: 'COMPRA',
            cantidad, precio_ejecucion: emp.precio_actual, comision_pagada: comisionCargo,
            total_neto: total
          })

          // Actualizar estado local del portafolio
          const pos = get().portafolio[ticker] || { cantidad: 0, precio_promedio: 0 }
          const nuevaCant = pos.cantidad + cantidad
          const nuevoPromedio = (pos.precio_promedio * pos.cantidad + emp.precio_actual * cantidad) / nuevaCant

          johtoSounds.playBuy()
          set((s) => ({
            portafolio: { ...s.portafolio, [ticker]: { cantidad: nuevaCant, precio_promedio: nuevoPromedio } },
            notificaciones: [...s.notificaciones, `COMPRA: ${cantidad} ${ticker} @ $${emp.precio_actual.toFixed(2)}`],
          }))
        } else {
          // Fallback local (sin Supabase)
          useEconomyStore.getState()._setBalance(currentBalance - total)
          set((s) => ({
            portafolio: { ...s.portafolio, [ticker]: { cantidad: (s.portafolio[ticker]?.cantidad ?? 0) + cantidad, precio_promedio: emp.precio_actual } },
            notificaciones: [...s.notificaciones, `COMPRA (MOCK): ${cantidad} ${ticker}`],
          }))
        }
        return null
      },

      venderSpot: async (ticker, cantidad) => {
        const emp = get().empresas.find((e) => e.ticker === ticker)
        const uid = get().usuario_id
        if (!emp) return "Empresa no encontrada"
        // NO requiere energía para vender
        
        const posActual = get().portafolio[ticker] || { cantidad: 0, precio_promedio: 0 }
        if (cantidad > posActual.cantidad) return `No tienes suficientes acciones.`
        
        const ingreso = emp.precio_actual * cantidad
        const comisionCargo = Math.round(ingreso * COMISION * 100) / 100
        const total = ingreso - comisionCargo

        if (supabaseReady && supabase && uid) {
          // 1. Acreditar saldo via RPC atómica (fuente de verdad)
          await useEconomyStore.getState().modifySaldo(total, 'trade')

          // 2. Log Transacción
          await (supabase.from("historial_transacciones") as any).insert({
            usuario_id: uid, empresa_id: emp.id, tipo: 'VENTA',
            cantidad, precio_ejecucion: emp.precio_actual, comision_pagada: comisionCargo,
            total_neto: total
          })

          const pos = get().portafolio[ticker]
          const nuevaCant = pos.cantidad - cantidad

          johtoSounds.playSell()
          set((s) => {
            const np = { ...s.portafolio }
            if (nuevaCant <= 0) delete np[ticker]; 
            else np[ticker] = { ...np[ticker], cantidad: nuevaCant }
            return {
              portafolio: np,
              notificaciones: [...s.notificaciones, `VENTA: ${cantidad} ${ticker} @ $${emp.precio_actual.toFixed(2)}`],
            }
          })
        } else {
          // Fallback local
          const currentBalance = useEconomyStore.getState().pkdBalance
          useEconomyStore.getState()._setBalance(currentBalance + total)
          const nuevaCant = posActual.cantidad - cantidad
          set((s) => {
            const np = { ...s.portafolio }
            if (nuevaCant <= 0) delete np[ticker]; 
            else np[ticker] = { ...np[ticker], cantidad: nuevaCant }
            return {
              portafolio: np,
              notificaciones: [...s.notificaciones, `VENTA (LOCAL): ${cantidad} ${ticker}`],
            }
          })
        }
        return null
      },

      colocarSL: async (ticker, cantidad, precio) => {
        const emp = get().empresas.find((e) => e.ticker === ticker)
        const uid = get().usuario_id
        if (!emp || !uid) return
        
        if (supabaseReady && supabase) {
          const { data, error } = await (supabase.from("ordenes_pendientes") as any).insert({
            usuario_id: uid,
            empresa_id: emp.id,
            tipo_orden: "STOP_LOSS",
            cantidad,
            precio_objetivo: precio,
            estado: "ACTIVA"
          }).select().single()

          if (data) {
            set((s) => ({ ordenes: [...s.ordenes, { id: data.id, empresa_id: emp.id, ticker, tipo: "STOP_LOSS", cantidad, precio_objetivo: precio, estado: "ACTIVA" }] }))
          }
        } else {
          set((s) => ({ ordenes: [...s.ordenes, { id: crypto.randomUUID(), empresa_id: emp.id, ticker, tipo: "STOP_LOSS", cantidad, precio_objetivo: precio, estado: "ACTIVA" }] }))
        }
      },

      colocarTP: async (ticker, cantidad, precio) => {
        const emp = get().empresas.find((e) => e.ticker === ticker)
        const uid = get().usuario_id
        if (!emp || !uid) return

        if (supabaseReady && supabase) {
          const { data, error } = await (supabase.from("ordenes_pendientes") as any).insert({
            usuario_id: uid,
            empresa_id: emp.id,
            tipo_orden: "TAKE_PROFIT",
            cantidad,
            precio_objetivo: precio,
            estado: "ACTIVA"
          }).select().single()

          if (data) {
            set((s) => ({ ordenes: [...s.ordenes, { id: data.id, empresa_id: emp.id, ticker, tipo: "TAKE_PROFIT", cantidad, precio_objetivo: precio, estado: "ACTIVA" }] }))
          }
        } else {
          set((s) => ({ ordenes: [...s.ordenes, { id: crypto.randomUUID(), empresa_id: emp.id, ticker, tipo: "TAKE_PROFIT", cantidad, precio_objetivo: precio, estado: "ACTIVA" }] }))
        }
      },

      colocarOrdenLimite: async (ticker, cantidad, precio, tipo) => {
        const emp = get().empresas.find((e) => e.ticker === ticker)
        const uid = get().usuario_id
        if (!emp || !uid) return

        if (supabaseReady && supabase) {
          const { data } = await (supabase.from("ordenes_pendientes") as any).insert({
            usuario_id: uid,
            empresa_id: emp.id,
            tipo_orden: tipo,
            cantidad,
            precio_objetivo: precio,
            estado: "ACTIVA"
          }).select().single()

          if (data) {
            set((s) => ({ ordenes: [...s.ordenes, { id: data.id, empresa_id: emp.id, ticker, tipo, cantidad, precio_objetivo: precio, estado: "ACTIVA" }] }))
          }
        } else {
          set((s) => ({ ordenes: [...s.ordenes, { id: crypto.randomUUID(), empresa_id: emp.id, ticker, tipo, cantidad, precio_objetivo: precio, estado: "ACTIVA" }] }))
        }
      },

      cancelarOrden: async (id) => {
        if (supabaseReady && supabase) {
          await (supabase.from("ordenes_pendientes") as any).update({ estado: "CANCELADA" }).eq("id", id)
        }
        set((s) => ({ ordenes: s.ordenes.map((o) => (o.id === id ? { ...o, estado: "CANCELADA" } : o)) }))
      },

      // --- Dev ---
      simularTickGlobal: () => { get().motorMercado() },
      aumentarCumplimiento: () => { set((s) => ({ life: { ...s.life, cumplimiento_semanal: 85 } })) },
      crashMercado: () => {
        for (const e of get().empresas) get().inyectarNoticia(e.ticker, -0.18)
      },
    }),
    { name: "egp-trade-store" }
  )
)
