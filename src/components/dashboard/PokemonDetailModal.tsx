"use client"

import { motion, AnimatePresence } from "framer-motion"
import { X, MapPin, Film, Sparkles, BookOpen, Info, Activity } from "lucide-react"

interface PokemonDetailProps {
  isOpen: boolean
  onClose: () => void
  pokemon: {
    id: string
    name: string
    image_url: string
    description: string
    rarity: string
    status: string
    habitat?: string
    anime_lore?: string
    curiosities?: string
    isCaught?: boolean
    base_stats?: {
      hp: number
      atk: number
      def: number
      spa: number
      spd: number
      spe: number
    }
  } | null
}

export default function PokemonDetailModal({ isOpen, onClose, pokemon }: PokemonDetailProps) {
  if (!pokemon) return null

  const isShiny = pokemon.name.includes("⭐")
  const isCaught = pokemon.isCaught !== false // Default to true if not provided (from backpack)
  const stats = pokemon.base_stats || { hp: 50, atk: 50, def: 50, spa: 50, spd: 50, spe: 50 }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header / Background Pattern */}
            <div className={`h-32 w-full absolute top-0 left-0 opacity-10 ${isShiny ? 'bg-amber-400' : 'bg-blue-500'}`} 
                 style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }} />
            
            <div className="relative p-8 pb-0">
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 p-2 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col items-center">
                {/* Sprite Container */}
                <div className="relative mb-6">
                  <div className={`absolute inset-0 blur-3xl opacity-20 ${isShiny ? 'bg-amber-400' : 'bg-blue-500'}`} />
                  <motion.div 
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="relative"
                  >
                    <img 
                      src={pokemon.image_url} 
                      alt={pokemon.name} 
                      className={`w-40 h-40 object-contain drop-shadow-2xl transition-all duration-700 ${
                        !isCaught ? 'brightness-0 opacity-20 blur-[2px]' : ''
                      }`}
                    />
                  </motion.div>
                  {isShiny && (
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                      className="absolute -top-4 -right-4"
                    >
                      <Sparkles className="w-8 h-8 text-amber-400 fill-amber-400/20" />
                    </motion.div>
                  )}
                </div>

                <div className="text-center mb-6 px-4">
                  <h2 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tighter">
                    {isCaught ? pokemon.name : "??? ??????"}
                  </h2>
                  <div className="flex items-center justify-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      isShiny ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {isShiny ? 'Legendario Shiny' : 'Rareza: ' + pokemon.rarity}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                      ID: {pokemon.id.split('-')[1]}
                    </span>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 gap-4 w-full pb-8">
                  {/* Stats Bar */}
                  <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl shadow-slate-200">
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Activity className="w-3 h-3 text-amber-400" /> Estadísticas Base
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        { label: 'HP', val: stats.hp, color: 'bg-red-500' },
                        { label: 'ATK', val: stats.atk, color: 'bg-orange-500' },
                        { label: 'DEF', val: stats.def, color: 'bg-blue-500' },
                        { label: 'SPD', val: stats.spe, color: 'bg-emerald-500' },
                      ].map(s => (
                        <div key={s.label} className="flex items-center gap-3">
                          <span className="text-[9px] font-bold w-6 text-slate-400">{s.label}</span>
                          <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: isCaught ? `${Math.min(100, (s.val / 180) * 100)}%` : 0 }}
                              className={`h-full ${s.color}`}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-slate-300 w-8 text-right">
                            {isCaught ? s.val : "??"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pokedex Entry */}
                  <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                    <div className="flex items-center gap-2 mb-3">
                      <BookOpen className="w-4 h-4 text-slate-400" />
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">Entrada de la Pokédex</h3>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium italic">
                      {isCaught ? `"${pokemon.description}"` : "La información biológica de este ejemplar está restringida hasta su captura."}
                    </p>
                  </div>

                  {/* Lore Section */}
                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-slate-50 rounded-3xl p-5 border border-slate-100">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="w-4 h-4 text-emerald-500" />
                          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hábitat</h3>
                        </div>
                        <p className="text-xs font-bold tracking-tight text-slate-600">
                          {pokemon.habitat || "Desconocido en esta dimensión."}
                        </p>
                     </div>
                     <div className="bg-indigo-50 rounded-3xl p-5 border border-indigo-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Film className="w-4 h-4 text-indigo-500" />
                          <h3 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Anime</h3>
                        </div>
                        <p className="text-xs font-bold tracking-tight text-indigo-700">
                          {pokemon.anime_lore || "Sin registros en las crónicas."}
                        </p>
                     </div>
                  </div>

                  {/* Curiosidad */}
                  <div className="bg-violet-50 rounded-3xl p-6 border border-violet-100 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-violet-500" />
                      <h3 className="text-[10px] font-bold text-violet-400 uppercase tracking-widest italic">Curiosidad del Oráculo</h3>
                    </div>
                    <p className="text-xs text-violet-700 font-bold leading-relaxed">
                      {isCaught ? pokemon.curiosities : "El Oráculo solo revela secretos a quienes demuestran su disciplina capturando a la criatura."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer Action */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-center sticky bottom-0 z-20">
               <button 
                onClick={onClose}
                className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-200"
               >
                 Cerrar Registro
               </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
