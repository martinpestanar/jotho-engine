"use client"

import { useEffect, useState } from "react"
import { useGauntletStore } from "@/store/useGauntletStore"
import { supabase } from "@/shared/lib/supabase/client"
import { Shield, ShieldAlert, ShieldCheck, Swords, Trophy, XCircle } from "lucide-react"

const GYMS = [
  { id: 1, name: "Falkner", type: "Volador", badge: "Zephyr Badge" },
  { id: 2, name: "Bugsy", type: "Bicho", badge: "Hive Badge" },
  { id: 3, name: "Whitney", type: "Normal", badge: "Plain Badge" },
  { id: 4, name: "Morty", type: "Fantasma", badge: "Fog Badge" },
  { id: 5, name: "Chuck", type: "Lucha", badge: "Storm Badge" },
  { id: 6, name: "Jasmine", type: "Acero", badge: "Mineral Badge" },
  { id: 7, name: "Pryce", type: "Hielo", badge: "Glacier Badge" },
  { id: 8, name: "Clair", type: "Dragón", badge: "Rising Badge" },
]

export const GauntletTracker = () => {
  const [userId, setUserId] = useState<string | null>(null)
  
  const { 
    isActive, 
    currentTargetGym, 
    defeatedInRun, 
    isLoading,
    loadState, 
    startGauntlet, 
    failGauntlet 
  } = useGauntletStore()

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.id) {
        setUserId(session.user.id)
        loadState(session.user.id)
      }
    }
    fetchUser()
  }, [loadState])

  if (!userId) return null

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 overflow-hidden relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-black text-navy flex items-center gap-2">
            <Swords className="w-6 h-6 text-indigo-500" /> 
            El Guantelete de Johto
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Progresión continua. Pierdes una vez, vuelves a empezar.
          </p>
        </div>
        
        {isActive ? (
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold border border-indigo-100">
              Run Activa
            </span>
            <button 
              onClick={() => failGauntlet(userId)}
              disabled={isLoading}
              className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-bold border border-red-100 hover:bg-red-500 hover:text-white transition-colors"
            >
              Rendirse
            </button>
          </div>
        ) : (
          <button 
            onClick={() => startGauntlet(userId)}
            disabled={isLoading}
            className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl text-sm font-black shadow-md hover:opacity-90 transition-opacity"
          >
            Iniciar Guantelete
          </button>
        )}
      </div>

      <div className="relative">
        <div className="absolute top-1/2 left-4 right-4 h-1 bg-slate-100 -translate-y-1/2 rounded-full z-0" />
        
        <div className="relative z-10 flex justify-between">
          {GYMS.map((gym) => {
            const isDefeated = defeatedInRun.includes(gym.id)
            const isTarget = isActive && currentTargetGym === gym.id
            const isLocked = isActive && currentTargetGym !== null && currentTargetGym < gym.id
            const isPastTarget = isActive && currentTargetGym !== null && currentTargetGym > gym.id

            return (
              <div key={gym.id} className="flex flex-col items-center gap-2 group">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                  {gym.name}
                </div>
                
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                  ${isDefeated ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 
                    isTarget ? 'bg-white border-indigo-500 text-indigo-500 scale-110 shadow-lg shadow-indigo-500/20' : 
                    isActive && !isLocked && !isPastTarget ? 'bg-white border-slate-200 text-slate-300' :
                    'bg-slate-50 border-slate-200 text-slate-300'
                  }
                `}>
                  {isDefeated ? (
                    <ShieldCheck className="w-5 h-5" />
                  ) : isTarget ? (
                    <Swords className="w-5 h-5 animate-pulse" />
                  ) : isLocked ? (
                    <ShieldAlert className="w-4 h-4 opacity-50" />
                  ) : (
                    <Shield className="w-5 h-5" />
                  )}
                </div>
                
                <div className={`text-[9px] font-black uppercase tracking-widest ${isTarget ? 'text-indigo-500' : 'text-slate-300'}`}>
                  Gym {gym.id}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      
      {isActive && currentTargetGym !== null && currentTargetGym <= 8 && (
        <div className="mt-8 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center border border-indigo-100 text-indigo-500">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">
              Siguiente Objetivo
            </p>
            <p className="text-sm font-bold text-navy">
              Derrota a <span className="text-indigo-600">{GYMS[currentTargetGym - 1]?.name}</span> ({GYMS[currentTargetGym - 1]?.type})
            </p>
          </div>
        </div>
      )}
      
      {isActive && currentTargetGym !== null && currentTargetGym > 8 && (
        <div className="mt-8 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500 rounded-xl shadow-sm flex items-center justify-center text-white">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">
              ¡Guantelete Completado!
            </p>
            <p className="text-sm font-bold text-navy">
              Has derrotado a los 8 líderes de gimnasio sin perder.
            </p>
          </div>
        </div>
      )}

      {!isActive && defeatedInRun.length > 0 && (
        <div className="mt-8 p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-red-100 rounded-xl shadow-sm flex items-center justify-center text-red-500 border border-red-200">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">
              Run Fallida
            </p>
            <p className="text-sm font-bold text-navy">
              Llegaste hasta el gimnasio {defeatedInRun.length + 1}. ¡Inténtalo de nuevo!
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
