"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Trophy, Circle, CheckCircle2, Filter, Info, ChevronRight } from "lucide-react"
import { useOracleStore } from "@/store/useOracleStore"
import PokemonDetailModal from "./PokemonDetailModal"

export default function PokedexView() {
  const { pokedex, fetchPokedex, isLoading } = useOracleStore()
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "caught" | "missing">("all")
  const [selectedPokemon, setSelectedPokemon] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    fetchPokedex()
  }, [])

  const filteredPokedex = useMemo(() => {
    return pokedex.filter(p => {
      const matchesSearch = p.nombre_es.toLowerCase().includes(search.toLowerCase()) || 
                           p.nombre_en.toLowerCase().includes(search.toLowerCase())
      
      if (filter === "caught") return matchesSearch && p.isCaught
      if (filter === "missing") return matchesSearch && !p.isCaught
      return matchesSearch
    })
  }, [pokedex, search, filter])

  const caughtCount = pokedex.filter(p => p.isCaught).length
  const totalCount = pokedex.length
  const progressPercentage = totalCount > 0 ? (caughtCount / totalCount) * 100 : 0

  const handleOpenDetail = (pokemon: any) => {
    setSelectedPokemon(pokemon)
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header Estilo Switch */}
      <div className="bg-white rounded-[40px] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Pokédex</h2>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">Enciclopedia del Éter • Johto Legacy</p>
            </div>

            <div className="flex items-center gap-4">
               <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Progreso Regional</p>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-black text-slate-900">{caughtCount}</span>
                    <span className="text-slate-300 font-bold">/</span>
                    <span className="text-xl font-bold text-slate-400">{totalCount}</span>
                  </div>
               </div>
               <div className="w-16 h-16 rounded-full border-4 border-slate-100 flex items-center justify-center relative">
                  <svg className="w-full h-full -rotate-90">
                    <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" className="text-slate-100" />
                    <circle 
                      cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" 
                      className="text-blue-500"
                      strokeDasharray={2 * Math.PI * 28}
                      strokeDashoffset={2 * Math.PI * 28 * (1 - progressPercentage / 100)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <Trophy className="w-6 h-6 text-blue-500 absolute" />
               </div>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar por nombre o número..."
                className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-600 placeholder:text-slate-400 focus:ring-4 focus:ring-blue-100 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
              {[
                { id: 'all', label: 'Todos', icon: Circle },
                { id: 'caught', label: 'Capturados', icon: CheckCircle2 },
                { id: 'missing', label: 'Faltantes', icon: Filter }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id as any)}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs transition-all ${
                    filter === f.id ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <f.icon className="w-3.5 h-3.5" />
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Pokémon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {isLoading ? (
          Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-square bg-white rounded-[32px] animate-pulse border border-slate-100" />
          ))
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredPokedex.map((pokemon) => (
              <motion.div
                key={pokemon.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ y: -8, scale: 1.02 }}
                onClick={() => handleOpenDetail(pokemon)}
                className={`group relative bg-white rounded-[32px] p-6 shadow-lg border-2 transition-all cursor-pointer ${
                  pokemon.isCaught 
                    ? 'border-transparent shadow-slate-200/50 hover:shadow-xl hover:shadow-blue-100' 
                    : 'border-slate-50 grayscale opacity-40 hover:grayscale-0 hover:opacity-100'
                }`}
              >
                <div className="absolute top-4 right-4">
                  {pokemon.isCaught ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-50" />
                  ) : (
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">? ? ?</span>
                  )}
                </div>

                <div className="flex flex-col items-center gap-4 mt-2">
                  <div className="relative">
                    {/* Glow effect for caught pokemon */}
                    {pokemon.isCaught && (
                      <div className="absolute inset-0 bg-blue-400 blur-2xl opacity-10 group-hover:opacity-30 transition-opacity" />
                    )}
                    <img 
                      src={pokemon.image_url} 
                      alt={pokemon.nombre_es}
                      className={`w-24 h-24 object-contain relative z-10 transition-transform duration-500 group-hover:scale-110 ${
                        !pokemon.isCaught && 'brightness-0 opacity-20'
                      }`}
                    />
                  </div>
                  
                  <div className="text-center">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">#{pokemon.id_interno_gba.toString().padStart(3, '0')}</p>
                    <h3 className="font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
                      {pokemon.isCaught ? pokemon.nombre_es : "Incógnito"}
                    </h3>
                  </div>
                </div>

                {/* Switch Style Footer Badge */}
                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Detalles</span>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      <PokemonDetailModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        pokemon={selectedPokemon ? {
          ...selectedPokemon,
          name: selectedPokemon.nombre_es,
          description: selectedPokemon.description || "Sin descripción disponible.",
          rarity: selectedPokemon.rarity || "Común",
          status: selectedPokemon.isCaught ? "Capturado" : "Salvaje"
        } : null}
      />
    </div>
  )
}
