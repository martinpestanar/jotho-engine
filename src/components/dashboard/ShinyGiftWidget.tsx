"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Gift, Search, X, Check, Loader2, Lock, Calendar, Info } from "lucide-react"
import { useOracleStore } from "@/store/useOracleStore"
import { createClient } from "@/shared/lib/supabase/client"

interface ShinyGiftWidgetProps {
  userId: string
}

export default function ShinyGiftWidget({ userId }: { userId: string }) {
  const { userStatus, pokedex, fetchPokedex, fetchUserStatus, fetchInventory } = useOracleStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPokemon, setSelectedPokemon] = useState<any[]>([])
  const [isClaiming, setIsClaiming] = useState(false)
  const supabase = createClient()

  // Calculate cooldown
  const lastGiftDateStr = userStatus?.last_pokemon_gift_at || null

  const { isCooldownActive, daysRemaining, nextAvailableDateStr } = useMemo(() => {
    if (!lastGiftDateStr) {
      return { isCooldownActive: false, daysRemaining: 0, nextAvailableDateStr: "" }
    }

    const [year, month, day] = lastGiftDateStr.split("-").map(Number)
    const lastClaimDate = new Date(year, month - 1, day)
    const today = new Date()
    
    // Normalize to midnight local time
    const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    
    const diffTime = todayNormalized.getTime() - lastClaimDate.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    const remaining = 30 - diffDays
    const active = remaining > 0

    const nextDate = new Date(lastClaimDate)
    nextDate.setDate(nextDate.getDate() + 30)
    const formattedNextDate = nextDate.toLocaleDateString(undefined, { 
      day: "numeric", 
      month: "long", 
      year: "numeric" 
    })

    return { 
      isCooldownActive: active, 
      daysRemaining: active ? remaining : 0, 
      nextAvailableDateStr: formattedNextDate 
    }
  }, [lastGiftDateStr])

  // Open modal & fetch catalog
  const handleOpenModal = () => {
    if (isCooldownActive) return
    setIsModalOpen(true)
    setSelectedPokemon([])
    setSearchQuery("")
    if (pokedex.length === 0) {
      fetchPokedex()
    }
  }

  // Filter pokedex catalog
  const filteredCatalog = useMemo(() => {
    if (!searchQuery.trim()) return pokedex
    return pokedex.filter(p => 
      p.nombre_es.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nombre_en.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [pokedex, searchQuery])

  // Select / Deselect Pokemon
  const handleSelectPokemon = (pokemon: any) => {
    if (selectedPokemon.some(p => p.id === pokemon.id)) {
      setSelectedPokemon(prev => prev.filter(p => p.id !== pokemon.id))
    } else {
      if (selectedPokemon.length >= 2) return // Max 2
      setSelectedPokemon(prev => [...prev, pokemon])
    }
  }

  // Helper for random IVs (0 to 31)
  const getRandomIV = () => Math.floor(Math.random() * 32)

  // Submit Claim
  const handleClaimGift = async () => {
    if (selectedPokemon.length !== 2 || isClaiming) return
    setIsClaiming(true)

    try {
      const todayDateStr = new Date().toISOString().split("T")[0]

      // 1. Insert both Pokémon into equipo_pokemon_usuario
      const inserts = selectedPokemon.map(p => ({
        usuario_id: userId,
        pokemon_id: p.id,
        nivel: 5,
        es_shiny: true,
        es_companero: false,
        mote: null,
        iv_hp: getRandomIV(),
        iv_ataque: getRandomIV(),
        iv_defensa: getRandomIV(),
        iv_sp_ataque: getRandomIV(),
        iv_sp_defensa: getRandomIV(),
        iv_velocidad: getRandomIV()
      }))

      const { error: insertError } = await supabase
        .from("equipo_pokemon_usuario")
        .insert(inserts)

      if (insertError) throw insertError

      // 2. Update last_pokemon_gift_at in user_status
      const { error: statusError } = await supabase
        .from("user_status")
        .update({ last_pokemon_gift_at: todayDateStr })
        .eq("user_id", userId)

      if (statusError) throw statusError

      // 3. Refresh Store Data
      await Promise.all([
        fetchUserStatus(),
        fetchInventory()
      ])

      alert(`¡Éxito! Tus 2 Pokémon Shinys han sido enviados a tu mochila del dashboard.`)
      setIsModalOpen(false)
    } catch (err) {
      console.error("Error claiming shiny gift:", err)
      alert("Hubo un error al inyectar los Pokémon en tu mochila. Inténtalo de nuevo.")
    } finally {
      setIsClaiming(false)
    }
  }

  // Get Pokemon animated sprite helper
  const getShowdownSprite = (pokemonNameEs: string) => {
    const cleanName = pokemonNameEs.toLowerCase().replace(/[^a-z0-9]/g, "")
    return `https://play.pokemonshowdown.com/sprites/gen5ani-shiny/${cleanName}.gif`
  }

  const spr = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { type: "spring" as const, stiffness: 140, damping: 18 }
  }

  return (
    <>
      {/* WIDGET CARD */}
      <motion.div 
        {...spr} 
        className={`bg-white rounded-3xl border border-slate-100 shadow-sm p-6 transition-all relative overflow-hidden ${
          isCooldownActive 
            ? "border-slate-100 opacity-90" 
            : "border-violet-100 bg-gradient-to-br from-violet-50/30 to-fuchsia-50/30 hover:shadow-md hover:border-violet-200"
        }`}
      >
        {/* Glow effect for ready state */}
        {!isCooldownActive && (
          <div className="absolute -right-16 -top-16 w-32 h-32 bg-violet-300 rounded-full blur-3xl opacity-20 animate-pulse pointer-events-none" />
        )}

        <div className="flex items-center gap-4 mb-4">
          <div className={`p-3 rounded-2xl ${
            isCooldownActive 
              ? "bg-slate-100 text-slate-400" 
              : "bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-md shadow-violet-500/20"
          }`}>
            {isCooldownActive ? <Lock className="w-5 h-5" /> : <Gift className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
              Regalo Shiny Mensual
            </h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              Fase 4 • Inyección de Éter
            </p>
          </div>
        </div>

        {isCooldownActive ? (
          <div className="space-y-4">
            <div className="flex justify-between items-end text-[10px] font-bold text-slate-400">
              <span className="uppercase tracking-widest flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Cargando Células...
              </span>
              <span className="font-mono">{daysRemaining} días restantes</span>
            </div>
            
            {/* Sleek Switch Style Cooldown Bar */}
            <div className="h-3 bg-slate-100 rounded-full border border-slate-200/50 overflow-hidden shadow-inner">
              <motion.div 
                className="h-full bg-gradient-to-r from-[#00D68F] to-[#00C3E3]"
                initial={{ width: 0 }}
                animate={{ width: `${((30 - daysRemaining) / 30) * 100}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
            
            <p className="text-[10px] font-bold text-slate-400/80 italic text-center">
              Próximo reclamo: {nextAvailableDateStr}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs font-bold text-slate-500 leading-relaxed">
              Elige 2 Pokémon Shinys para teletransportarlos instantáneamente a tu Refugio Pokémon.
            </p>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleOpenModal}
              className="w-full py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.15em] transition-all bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-md shadow-violet-500/25 hover:from-violet-600 hover:to-fuchsia-600 flex items-center justify-center gap-2 group cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-violet-200 group-hover:scale-110 group-hover:rotate-12 transition-all" />
              Elegir Pokémones Shinys
            </motion.button>
          </div>
        )}
      </motion.div>

      {/* SELECTION MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[350] flex items-center justify-center p-4 lg:p-8">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isClaiming && setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ y: 50, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 50, opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-4xl h-[85vh] bg-white rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border-4 border-slate-100 z-10"
            >
              {/* Header */}
              <div className="bg-slate-50 border-b border-slate-100 flex items-center justify-between px-8 h-20 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-violet-500 text-white rounded-xl shadow-md">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter">
                      Regalo de Éter: Doble Shiny
                    </h2>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      Selecciona exactamente 2 de la Pokédex Nacional
                    </p>
                  </div>
                </div>
                <button 
                  disabled={isClaiming}
                  onClick={() => setIsModalOpen(false)} 
                  className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Selected Banner */}
              <div className="bg-gradient-to-r from-violet-50 to-fuchsia-50 px-8 py-5 border-b border-slate-100 shrink-0 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="text-center md:text-left">
                    <span className="text-[10px] font-black text-violet-500 uppercase tracking-widest block">
                      Selección actual
                    </span>
                    <span className="text-2xl font-black text-slate-800">
                      {selectedPokemon.length} <span className="text-slate-300 font-bold">/</span> 2
                    </span>
                  </div>
                  <div className="flex gap-4">
                    {selectedPokemon.length === 0 && (
                      <span className="text-xs font-bold text-slate-400 italic">
                        No hay pokémon seleccionados todavía...
                      </span>
                    )}
                    {selectedPokemon.map(p => (
                      <div 
                        key={p.id} 
                        className="bg-white/80 border border-violet-100 px-4 py-2 rounded-2xl flex items-center gap-3 relative shadow-sm group"
                      >
                        <img 
                          src={getShowdownSprite(p.nombre_es)} 
                          alt={p.nombre_es} 
                          className="w-10 h-10 object-contain pixelated" 
                        />
                        <div>
                          <span className="text-[8px] font-black text-slate-400 block">#{p.id_interno_gba.toString().padStart(3, "0")}</span>
                          <span className="text-xs font-black text-slate-800 uppercase tracking-tight">{p.nombre_es} ⭐</span>
                        </div>
                        <button 
                          disabled={isClaiming}
                          onClick={() => handleSelectPokemon(p)}
                          className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleClaimGift}
                  disabled={selectedPokemon.length !== 2 || isClaiming}
                  className="py-3.5 px-8 rounded-full font-black text-xs uppercase tracking-widest bg-violet-600 text-white shadow-lg shadow-violet-600/25 hover:bg-violet-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none transition-all flex items-center gap-2 shrink-0 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isClaiming ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Materializar Shinys
                    </>
                  )}
                </button>
              </div>

              {/* Main Area: Catalog and search */}
              <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
                {/* Search Bar */}
                <div className="p-6 bg-white border-b border-slate-100 shrink-0">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Buscar Pokémon por nombre..."
                      className="w-full pl-11 pr-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-600 placeholder:text-slate-400 focus:ring-2 focus:ring-violet-200 focus:border-violet-500 transition-all outline-none text-sm"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                {/* Catalog Grid */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {filteredCatalog.map(p => {
                      const isSelected = selectedPokemon.some(item => item.id === p.id)
                      const isLimitReached = selectedPokemon.length >= 2 && !isSelected
                      return (
                        <div
                          key={p.id}
                          onClick={() => !isLimitReached && handleSelectPokemon(p)}
                          className={`
                            relative bg-white rounded-3xl p-4 border-2 transition-all flex flex-col items-center justify-between cursor-pointer select-none
                            ${isSelected 
                              ? "border-violet-500 shadow-md scale-105 shadow-violet-100" 
                              : isLimitReached 
                                ? "border-slate-50 opacity-40 cursor-not-allowed" 
                                : "border-slate-100 hover:border-violet-200 hover:shadow-sm"
                            }
                          `}
                        >
                          {isSelected && (
                            <div className="absolute top-2 right-2 bg-violet-500 text-white rounded-full p-1 shadow-sm">
                              <Check className="w-3.5 h-3.5" />
                            </div>
                          )}
                          <img 
                            src={getShowdownSprite(p.nombre_es)} 
                            alt={p.nombre_es} 
                            className="w-16 h-16 object-contain pixelated mb-3 mt-1" 
                          />
                          <div className="text-center">
                            <span className="text-[8px] font-black text-slate-300 block mb-0.5">#{p.id_interno_gba.toString().padStart(3, "0")}</span>
                            <h4 className="text-xs font-black text-slate-700 uppercase tracking-tight truncate max-w-[120px]">
                              {p.nombre_es}
                            </h4>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {filteredCatalog.length === 0 && (
                    <div className="text-center py-16 opacity-40">
                      <Info className="w-12 h-12 mx-auto mb-4" />
                      <p className="text-xs font-bold uppercase tracking-widest">No se encontraron Pokémon</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <style jsx global>{`
        .pixelated {
          image-rendering: pixelated;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </>
  )
}
