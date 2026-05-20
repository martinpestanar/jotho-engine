"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useAppStore } from "@/store/useAppStore"
import { useOracleStore } from "@/store/useOracleStore"
import { Eye, EyeOff } from "lucide-react"
import { useHabitStore } from "@/features/habits"
import { useEconomyStore } from "@/store/useEconomyStore"
import { supabase } from "@/shared/lib/supabase/client"
import {
  Gamepad2, Clock, TrendingUp, Zap, Heart, Flame, Trophy, Package, AlertCircle, Lock, ChevronRight,
  User, Briefcase, Sword, Shield, Coins, Star, LayoutGrid, Box, BookOpen, RefreshCw, GraduationCap,
  Sparkles
} from "lucide-react"
import BackpackDashboard from "@/components/dashboard/BackpackDashboard"
import { TransferBox } from "@/features/dashboard/components/TransferBox"
import ShinyGiftWidget from "@/components/dashboard/ShinyGiftWidget"

import LootModal from "@/components/modals/LootModal"

import StatsChart from "@/components/dashboard/StatsChart"
import PokedexView from "@/components/dashboard/PokedexView"
import { GauntletTracker } from "@/features/gauntlet/components/GauntletTracker"

interface ItemInventario {
  id: string
  cantidad: number
  master_objetos: {
    nombre_es: string
    sprite_url: string
    categoria: string
  }
}

interface PokemonCompanero {
  mote: string | null
  nivel: number
  master_pokemon: {
    nombre_es: string
    sprite_url: string
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const { dailyPlayTimeRemaining, hasCompletedDailyCheckIn, hasCompletedOnboarding, completeOnboarding } = useAppStore()
  const pkdBalance = useEconomyStore((s) => s.pkdBalance)
  const habits = useHabitStore((s) => s.habits)
  const completed = habits.filter((h) => !h.isActive).length

  const { 
    userStatus, 
    fetchUserStatus, 
    fetchLifePlan,
    fetchPerfilVida,
    perfilVida,
    inventory,
    fetchInventory,
    isLoading: oracleLoading 
  } = useOracleStore()

  // Estados Dinámicos de Supabase
  const [companero, setCompanero] = useState<PokemonCompanero | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [theme, setTheme] = useState<"dark" | "light">("light")

  const [isBackpackOpen, setIsBackpackOpen] = useState(false)

  // Estados para el Loot Drop
  const [isLootModalOpen, setIsLootModalOpen] = useState(false)
  const [lootReward, setLootReward] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<"home" | "pokedex">("home")

  const fetchDashboardData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) {
        setIsLoading(false)
        return
      }
      setUserId(user.id)

      // 1. Fetch Compañero
      const { data: teamData } = await supabase
        .from('equipo_pokemon_usuario')
        .select(`
          mote,
          nivel,
          master_pokemon (
            nombre_es,
            sprite_url
          )
        `)
        .eq('usuario_id', user.id)
        .eq('es_companero', true)
        .maybeSingle()

      setCompanero(teamData as any)

    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  useEffect(() => {
    fetchUserStatus()
    fetchLifePlan()
    fetchPerfilVida()
    fetchInventory()
    fetchDashboardData()

    let activeChannel: any = null;

    const setupRealtime = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;

      // Unsubscribe from previous if exists
      if (activeChannel) {
        supabase.removeChannel(activeChannel);
      }

      activeChannel = supabase.channel(`oracle-logs-${user.id}-${Date.now()}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'oracle_logs',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          const log = payload.new;
          if (log.type === 'reward') {
            const rewardData = log.payload;
            
            let modalReward = null;
            if (rewardData.pokemon) {
              modalReward = {
                name: rewardData.pokemon_name + (rewardData.shiny ? " ⭐" : ""),
                image: rewardData.pokemon_sprite,
                type: "pokemon" as const,
                amount: 1
              };
            } else if (rewardData.item) {
              modalReward = {
                name: rewardData.item_name,
                image: rewardData.item_sprite,
                type: "item" as const,
                amount: rewardData.item_qty
              };
            } else if (rewardData.pkd > 0) {
              modalReward = {
                name: "Monedas PKD",
                image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/nugget.png",
                type: "item" as const,
                amount: rewardData.pkd
              }
            }

            if (modalReward) {
              setLootReward(modalReward);
              setIsLootModalOpen(true);
            }

            // Sincronización silenciosa de Oracle
            fetchDashboardData();
            fetchUserStatus();
            
            // El saldo PKD (si lo hay) se actualizará automáticamente 
            // a través de la suscripción Realtime del useEconomyStore
          }
        })
        .subscribe();
    }

    setupRealtime();

    return () => {
      if (activeChannel) {
        supabase.removeChannel(activeChannel);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (userStatus?.is_onboarding_completed && !hasCompletedOnboarding) {
      completeOnboarding()
    }
  }, [userStatus, hasCompletedOnboarding, completeOnboarding])

  const [isDevBypass, setIsDevBypass] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlBypass = new URLSearchParams(window.location.search).get('bypass') === 'true'
      const isLocal = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1' || 
                      process.env.NODE_ENV === 'development'
      setIsDevBypass(urlBypass || (isLocal && localStorage.getItem('dev_bypass_checkin') !== 'false'))
    }
  }, [])

  // Permitir render si tiene bypass O si ya completó el ritual
  // RouteGuard se encarga de la redirección real de manera segura.
  if (!hasCompletedDailyCheckIn && !isDevBypass) { 
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-cyan-500 rounded-full animate-spin" />
        <span className="text-xs font-black uppercase tracking-widest text-slate-400">Verificando Pacto...</span>
      </div>
    )
  }

  const battery = userStatus?.ether_battery ?? 100
  const isLocked = userStatus?.trading_locked_until && new Date(userStatus.trading_locked_until) > new Date()

  const pct = Math.round((dailyPlayTimeRemaining / 600) * 100)
  const hrs = Math.floor(dailyPlayTimeRemaining / 60)
  const mins = dailyPlayTimeRemaining % 60
  const canPlay = dailyPlayTimeRemaining > 0

  const spr = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { type: "spring" as const, stiffness: 140, damping: 18 },
  }

  // Generar slots de mochila (siempre 6, excluyendo Pokémon)
  const nonPokemonInventory = inventory.filter(item => item.category !== "Refugio Pokémon")
  const backpackSlots = [...nonPokemonInventory, ...Array(Math.max(0, 6 - nonPokemonInventory.length)).fill(null)].slice(0, 6)

  return (
    <div className="min-h-screen bg-[#F8FAFC] relative overflow-hidden px-4 py-8 lg:py-12">
      {/* Background Ho-Oh Watermark */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03] bg-no-repeat bg-right-bottom"
        style={{ 
          backgroundImage: "url('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/250.png')",
          backgroundSize: "60%",
          backgroundPosition: "right bottom"
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:gap-8">
        {/* ========================================================
            NAVEGACIÓN SUPERIOR
        ======================================================== */}
        <div className="lg:col-span-12 mb-4">
          <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm p-1.5 rounded-2xl border border-white w-fit shadow-sm">
            <button 
              onClick={() => setActiveTab("home")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === "home" ? "bg-white text-slate-900 shadow-md ring-1 ring-slate-100" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Panel de Control
            </button>
            <button 
              onClick={() => setActiveTab("pokedex")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === "pokedex" ? "bg-white text-slate-900 shadow-md ring-1 ring-slate-100" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Pokédex Nacional
            </button>
            <button 
              onClick={() => router.push("/dashboard/mercado")}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs transition-all text-slate-500 hover:text-sky-600 hover:bg-white/80 rounded-xl"
            >
              <TrendingUp className="w-4 h-4 text-sky-500" />
              Mercado PKD
            </button>
            <button 
              onClick={() => router.push("/dashboard/academia")}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs transition-all text-slate-500 hover:text-violet-600 hover:bg-white/80 rounded-xl"
            >
              <GraduationCap className="w-4 h-4 text-violet-500" />
              Academia JTU
            </button>
            <button 
              onClick={() => router.push("/oracle")}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs transition-all text-slate-500 hover:text-cyan-600 hover:bg-white/80 rounded-xl"
            >
              <Sparkles className="w-4 h-4 text-cyan-500" />
              Volver al Oráculo
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "home" ? (
            <motion.div 
              key="home"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="lg:col-span-12 grid lg:grid-cols-12 gap-6 lg:gap-8"
            >
              {/* ========================================================
                  SECCIÓN 1: Identidad y Progreso (Desktop: 3 cols)
              ======================================================== */}
              <div className="lg:col-span-3 space-y-6">
          <motion.div {...spr} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 text-center">
            {/* Avatar & Dynamic Companion */}
            <div className="relative inline-block mb-4">
              <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-md flex items-center justify-center overflow-hidden">
                <span className="text-5xl">👤</span>
              </div>
              <AnimatePresence mode="wait">
                {companero ? (
                  <motion.img 
                    key={companero.master_pokemon.sprite_url}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    src={companero.master_pokemon.sprite_url} 
                    alt={companero.mote || companero.master_pokemon.nombre_es} 
                    className="absolute -bottom-2 -right-4 w-16 h-16 drop-shadow-md pixelated"
                  />
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="absolute -bottom-2 -right-4 w-12 h-12 bg-slate-200 rounded-full border-2 border-white flex items-center justify-center"
                  >
                    <Box className="w-6 h-6 text-slate-400" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">
              {perfilVida?.nombre_entrenador || 'Entrenador'}
            </h2>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">
              {perfilVida?.profesion_actual || 'Novato'}
            </p>

            <div className="flex flex-col gap-3 mt-6">


              <button 
                onClick={() => router.push("/onboarding?edit=true")}
                className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-3 border ${
                  theme === "dark" 
                  ? "bg-white/5 border-white/10 text-slate-400 hover:text-white" 
                  : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                } group`}
              >
                <User className="w-3.5 h-3.5" />
                Configurar Perfil
              </button>
              
              <button 
                onClick={() => router.push("/dashboard/mercado")}
                className="w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-3 bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md shadow-indigo-500/20 hover:from-sky-600 hover:to-indigo-700 active:scale-95 group"
              >
                <TrendingUp className="w-4 h-4 text-sky-200 group-hover:scale-110 transition-transform" />
                Mercado Financiero
              </button>
              
              <button 
                onClick={handleSignOut}
                className="w-full py-3 text-slate-400 hover:text-rose-500 font-bold text-[10px] uppercase tracking-widest transition-all"
              >
                Cerrar Sesión
              </button>
            </div>

            {/* EXP Bar Dinámica (Nivel del compañero) */}
            <div className="mt-6 text-left">
              <div className="flex justify-between items-end mb-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Nivel {companero?.nivel || 5}
                </span>
                <span className="text-[10px] font-bold text-slate-400">XP: 850/1000</span>
              </div>
              <div className="h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <motion.div 
                  className="h-full bg-[#10B981]"
                  initial={{ width: 0 }} 
                  animate={{ width: "85%" }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </div>
            </div>
          </motion.div>

          {/* Widgets Stats */}
          <div className="grid grid-cols-2 gap-3">
            <motion.div {...spr} transition={{ ...spr.transition, delay: 0.1 }} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
              <Flame className="w-5 h-5 text-coral mx-auto mb-1" />
              <p className="text-lg font-black text-navy">4</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Días 🔥</p>
            </motion.div>
            <motion.div {...spr} transition={{ ...spr.transition, delay: 0.15 }} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
              <Coins className="w-5 h-5 text-pk-yellow mx-auto mb-1" />
              <p className="text-lg font-black text-navy">{pkdBalance.toLocaleString()}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">PKD 🪙</p>
            </motion.div>
          </div>
        </div>

        {/* ========================================================
            SECCIÓN 2: Registro de Misiones y Estadísticas (Centro: 5 cols)
        ======================================================== */}
        <div className="lg:col-span-5 space-y-6 flex flex-col">
          {/* Gauntlet Tracker */}
          <motion.div {...spr} transition={{ ...spr.transition, delay: 0.22 }}>
            <GauntletTracker />
          </motion.div>

          {/* Graficos */}
          <motion.div {...spr} transition={{ ...spr.transition, delay: 0.25 }} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex-1 flex flex-col">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-slate-400" />
              Evolución de Riqueza
            </p>
            <div className="flex-1 min-h-[200px] w-full relative">
               <StatsChart />
            </div>
          </motion.div>
        </div>

        {/* ========================================================
            SECCIÓN 3: Mochila y Energía (Derecha: 4 cols)
        ======================================================== */}
        <div className="lg:col-span-4 space-y-6 flex flex-col">
          {/* MOCHILA DINÁMICA (6 Slots) */}
          <motion.div {...spr} transition={{ ...spr.transition, delay: 0.3 }} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Package className="w-4 h-4 text-slate-400" />
                Mochila
              </p>
              <button 
                onClick={() => setIsBackpackOpen(true)}
                className="text-[10px] font-black text-cyan-600 uppercase hover:underline"
              >
                Ver Todo
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {backpackSlots.map((item, idx) => (
                <div key={idx} className="aspect-square rounded-2xl border-2 border-dashed border-slate-100 bg-slate-50 flex items-center justify-center relative overflow-hidden group">
                  {item ? (
                    <>
                      <img 
                        src={item.image_url} 
                        alt={item.name} 
                        className="w-10 h-10 object-contain drop-shadow-sm group-hover:scale-110 transition-transform"
                      />
                      <span className="absolute bottom-1 right-1 bg-slate-900/80 text-white text-[8px] font-black px-1 rounded-md">
                        x{item.quantity}
                      </span>
                    </>
                  ) : (
                    <span className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter">Vacío</span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* REGALO SHINY MENSUAL */}
          {userId && <ShinyGiftWidget userId={userId} />}

          <motion.div {...spr} transition={{ ...spr.transition, delay: 0.32 }} className="bg-slate-900 rounded-3xl p-6 shadow-xl border-b-4 border-slate-950">
            {userId && <TransferBox userId={userId} />}
          </motion.div>

          {/* Barras Vitales */}
          <motion.div {...spr} transition={{ ...spr.transition, delay: 0.35 }} className="bg-slate-900 rounded-3xl p-6 shadow-xl space-y-5 border-b-4 border-slate-950">
            <div>
              <div className="flex justify-between items-end mb-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#00BDEE]" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tiempo Libre</span>
                  {process.env.NODE_ENV === 'development' && (
                    <button 
                      onClick={() => useAppStore.getState().DEBUG_resetTime()}
                      className="ml-2 p-1 hover:bg-slate-800 rounded-full transition-colors text-slate-500 hover:text-[#00BDEE]"
                      title="Resetear a 10h (Dev)"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <span className="text-sm font-mono font-black text-white">{hrs}h {mins}m</span>
              </div>
              <div className="h-4 bg-slate-800 rounded-full border border-slate-700 overflow-hidden shadow-inner">
                <motion.div 
                  className="h-full bg-[#00BDEE] shadow-[0_0_10px_rgba(0,189,238,0.5)]"
                  initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-end mb-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#EB0012]" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Batería de Juego</span>
                </div>
                <span className="text-sm font-mono font-black text-white">{battery}%</span>
              </div>
              <div className="h-4 bg-slate-800 rounded-full border border-slate-700 overflow-hidden shadow-inner">
                <motion.div 
                  className="h-full bg-[#EB0012] shadow-[0_0_10px_rgba(235,0,18,0.5)]"
                  initial={{ width: 0 }} animate={{ width: `${battery}%` }}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    ) : (
            <motion.div 
              key="pokedex"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="lg:col-span-12"
            >
              <PokedexView />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* BOTÓN DE ACCIÓN GLOBAL */}
      <motion.button
        onClick={() => router.push("/play")}
        disabled={!canPlay}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={canPlay ? { scale: 1.05 } : {}}
        whileTap={canPlay ? { scale: 0.95 } : {}}
        className={`fixed bottom-6 right-6 lg:bottom-10 lg:right-10 z-50 py-4 px-8 rounded-full font-black text-lg uppercase tracking-tighter transition-all flex items-center gap-3 shadow-2xl border-4 border-white/20 ${
          canPlay 
            ? 'bg-[#EB0012] text-white shadow-[#EB0012]/30 animate-bounce hover:animate-none' 
            : 'bg-slate-200 text-slate-400 cursor-not-allowed border-none'
        }`}
      >
        <Gamepad2 className="w-6 h-6" />
        Entrar al Éter
      </motion.button>

      {/* Modals */}
      <LootModal 
        isOpen={isLootModalOpen}
        onClose={() => setIsLootModalOpen(false)}
        reward={lootReward}
      />


      <BackpackDashboard 
        isOpen={isBackpackOpen} 
        onClose={() => setIsBackpackOpen(false)} 
      />

      <style jsx global>{`
        .pixelated {
          image-rendering: pixelated;
        }
      `}</style>
    </div>
  )
}

