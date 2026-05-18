'use client'

/**
 * TransferBox.tsx — Rediseño Premium Fase 4
 *
 * Muestra el historial de inyecciones con nombres reales, sprites y diseño glassmorphism.
 */

import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/shared/lib/supabase/client'
import { 
  Package, 
  Terminal, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  ArrowRightLeft,
  Search
} from 'lucide-react'

type Injection = {
  id: string
  type: 'item' | 'pokemon'
  status: 'pending' | 'applied' | 'failed'
  source: string
  source_note: string | null
  item_id: number | null
  item_quantity: number | null
  species: number | null
  shiny: boolean
  created_at: string
  applied_at: string | null
  // Metadata extendida para la UI
  displayName?: string
  displayImage?: string
}

const STATUS_CONFIG = {
  pending: {
    label: 'En Tránsito',
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
    border: 'border-amber-400/30',
    icon: Clock,
    pulse: true
  },
  applied: {
    label: 'Recibido',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    border: 'border-emerald-400/20',
    icon: CheckCircle2,
    pulse: false
  },
  failed: {
    label: 'Fallido',
    color: 'text-rose-400',
    bg: 'bg-rose-400/10',
    border: 'border-rose-400/20',
    icon: AlertCircle,
    pulse: false
  }
}

export function TransferBox({ userId }: { userId: string }) {
  const [injections, setInjections] = useState<Injection[]>([])
  const [masterItems, setMasterItems] = useState<any[]>([])
  const [masterPokemon, setMasterPokemon] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'applied'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 3
  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      // 1. Cargar Tablas Maestras para el mapeo
      const [itemsRes, pokemonRes] = await Promise.all([
        supabase.from('master_objetos').select('id_interno_gba, nombre_es, sprite_url'),
        supabase.from('master_pokemon').select('id_interno_gba, nombre_es, sprite_url')
      ])

      setMasterItems(itemsRes.data || [])
      setMasterPokemon(pokemonRes.data || [])

      // 2. Cargar Inyecciones
      const { data } = await supabase
        .from('pending_injections')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30)

      setInjections((data ?? []) as Injection[])
      setLoading(false)
    }

    loadData()

    const channel = supabase
      .channel('injection-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'pending_injections',
        filter: `user_id=eq.${userId}`,
      }, () => loadData())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  // Mapear IDs a metadatos reales
  const enrichedInjections = useMemo(() => {
    return injections.map(inj => {
      let displayName = inj.source_note || 'Objeto Desconocido'
      let displayImage = ''

      if (inj.type === 'item' && inj.item_id) {
        const master = masterItems.find(m => m.id_interno_gba === inj.item_id)
        if (master) {
          displayName = `${master.nombre_es} x${inj.item_quantity || 1}`
          displayImage = master.sprite_url
        }
      } else if (inj.type === 'pokemon' && inj.species) {
        const master = masterPokemon.find(m => m.id_interno_gba === inj.species)
        if (master) {
          displayName = master.nombre_es + (inj.shiny ? ' ✨' : '')
          const pokemonName = master.nombre_es.toLowerCase().replace(/[^a-z0-9]/g, '')
          displayImage = inj.shiny 
            ? `https://play.pokemonshowdown.com/sprites/gen5ani-shiny/${pokemonName}.gif`
            : `https://play.pokemonshowdown.com/sprites/gen5ani/${pokemonName}.gif`
        }
      }

      return { ...inj, displayName, displayImage }
    })
  }, [injections, masterItems, masterPokemon])

  const filteredInjections = useMemo(() => {
    // Reset page when tab changes
    return enrichedInjections.filter(i => activeTab === 'all' || i.status === activeTab)
  }, [enrichedInjections, activeTab])

  // Pagination Logic
  const totalPages = Math.ceil(filteredInjections.length / itemsPerPage)
  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredInjections.slice(start, start + itemsPerPage)
  }, [filteredInjections, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
          <div className="absolute inset-0 bg-cyan-500/20 blur-xl animate-pulse" />
        </div>
        <p className="text-cyan-500 text-xs font-black uppercase tracking-widest animate-pulse">Sincronizando Éter...</p>
      </div>
    )
  }

  const pendingCount = enrichedInjections.filter(i => i.status === 'pending').length

  return (
    <div className="relative flex flex-col h-full">
      {/* Header Widget */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/30">
            <ArrowRightLeft className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tighter">Terminal de Entrega</h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sincronización con PARTIDA_ACTIVA.SRM</p>
          </div>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1 bg-amber-400/10 border border-amber-400/30 rounded-full animate-pulse">
            <span className="w-2 h-2 bg-amber-400 rounded-full" />
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">{pendingCount} Pendiente{pendingCount > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-slate-950/50 rounded-xl border border-white/5 mb-6">
        {(['all', 'pending', 'applied'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all
              ${activeTab === tab ? 'bg-white/10 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}
            `}
          >
            {tab === 'all' ? 'Todo' : tab === 'pending' ? 'En Tránsito' : 'Recibido'}
          </button>
        ))}
      </div>

      {/* List Area */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3 min-h-[420px]">
        <AnimatePresence mode="popLayout">
          {currentItems.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-20 opacity-30 text-center"
            >
              <Package className="w-12 h-12 mb-4" />
              <p className="text-xs font-black uppercase tracking-widest">No hay registros</p>
            </motion.div>
          ) : (
            currentItems.map((inj, idx) => {
              const config = STATUS_CONFIG[inj.status]
              const StatusIcon = config.icon
              
              return (
                <motion.div
                  key={inj.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`
                    group relative p-4 rounded-2xl border transition-all duration-300
                    bg-slate-900/40 hover:bg-slate-800/60 backdrop-blur-md
                    ${config.border}
                  `}
                >
                  <div className="flex items-center gap-4">
                    {/* Item Sprite Container */}
                    <div className="relative w-14 h-14 bg-slate-950/50 rounded-xl border border-white/5 flex items-center justify-center group-hover:scale-105 transition-transform">
                      {inj.displayImage ? (
                        <img 
                          src={inj.displayImage} 
                          alt={inj.displayName} 
                          className="w-10 h-10 object-contain drop-shadow-lg"
                        />
                      ) : (
                        <Package className="w-6 h-6 text-slate-700" />
                      )}
                      
                      {/* Pulse effect for pending items */}
                      {config.pulse && (
                        <div className="absolute inset-0 bg-amber-400/20 rounded-xl animate-pulse blur-sm" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${config.color} flex items-center gap-1`}>
                          <StatusIcon className="w-3 h-3" />
                          {config.label}
                        </span>
                        <span className="text-[8px] font-medium text-slate-600">
                          {new Date(inj.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      
                      <h4 className="text-sm font-black text-white truncate uppercase tracking-tight">
                        {inj.displayName}
                      </h4>
                      
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                          <Terminal className="w-2.5 h-2.5" />
                          {inj.source}
                        </span>
                        {inj.applied_at && (
                          <span className="text-[9px] font-medium text-slate-600">
                            • Sync {new Date(inj.applied_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className="w-4 h-4 text-slate-600" />
                    </div>
                  </div>

                  {/* Pending Action Hint */}
                  {inj.status === 'pending' && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="mt-3 pt-3 border-t border-white/5"
                    >
                      <p className="text-[9px] text-amber-200/60 leading-relaxed italic">
                        Vínculo establecido. Inicia el juego para materializar el objeto en la PC.
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              )
            })
          )}
        </AnimatePresence>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 px-1">
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`
                p-2 rounded-xl border transition-all
                ${currentPage === 1 
                  ? 'bg-slate-900/20 border-white/5 text-slate-700 cursor-not-allowed' 
                  : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20 active:scale-95'}
              `}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={`
                p-2 rounded-xl border transition-all
                ${currentPage === totalPages 
                  ? 'bg-slate-900/20 border-white/5 text-slate-700 cursor-not-allowed' 
                  : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20 active:scale-95'}
              `}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Página <span className="text-white">{currentPage}</span> de {totalPages}
            </span>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-[8px] font-black text-slate-600 uppercase tracking-[0.3em]">
        <span>Sistema de Inyección v2.4</span>
        <div className="flex items-center gap-1">
          <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
          En Línea
        </div>
      </div>
    </div>
  )
}
