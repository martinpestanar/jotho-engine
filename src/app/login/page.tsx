"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { supabase } from "@/shared/lib/supabase/client"
import { LogIn, UserPlus, ShieldCheck, Mail, Lock, Gamepad2, Sparkles } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        })
        if (error) throw error
        if (error === null) {
            alert("¡Registro exitoso! Revisa tu correo para confirmar.")
        }
      }
      router.push("/dashboard")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Ocurrió un error inesperado")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Poké Ball Watermark */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.02] bg-no-repeat bg-center"
        style={{ 
          backgroundImage: "url('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png')",
          backgroundSize: "40%"
        }}
      />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 160, damping: 20 }}
        className="w-full max-w-md bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden relative z-10"
      >
        {/* Header Decorativo */}
        <div className="bg-[#E60012] h-2 w-full" />
        
        <div className="p-8 sm:p-10 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-[#F0F2F5] rounded-3xl flex items-center justify-center shadow-inner group">
              <Gamepad2 className="w-8 h-8 text-[#E60012] group-hover:scale-110 transition-transform" />
            </div>
          </div>

          <h1 className="text-2xl font-black text-[#1A1A2E] uppercase tracking-tighter mb-2">
            Johto LifeSync
          </h1>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">
            {isLogin ? "Accede a tu Legado" : "Inicia tu Aventura"}
          </p>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
              <input 
                type="email" 
                placeholder="TU CORREO ELECTRÓNICO"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-full text-sm font-bold text-[#1A1A2E] placeholder:text-slate-300 focus:border-[#00C3E3] focus:ring-4 focus:ring-[#00C3E3]/10 outline-none transition-all uppercase tracking-tighter"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
              <input 
                type="password" 
                placeholder="TU CONTRASEÑA"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-full text-sm font-bold text-[#1A1A2E] placeholder:text-slate-300 focus:border-[#00C3E3] focus:ring-4 focus:ring-[#00C3E3]/10 outline-none transition-all uppercase tracking-tighter"
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-50 text-red-500 text-[10px] font-black uppercase tracking-widest p-3 rounded-2xl border border-red-100"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full py-4 bg-[#E60012] text-white rounded-full font-black uppercase tracking-widest shadow-lg shadow-red-500/20 flex items-center justify-center gap-3 transition-all ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <Sparkles className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Entrar al Éter</span>
                  <Sparkles className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-50">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-[#00C3E3] transition-colors"
            >
              {isLogin ? "¿Eres nuevo? Regístrate aquí" : "¿Ya tienes cuenta? Inicia sesión"}
            </button>
          </div>
        </div>

        {/* Footer Info */}
        <div className="bg-slate-50 p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-slate-300">
            <ShieldCheck className="w-3 h-3" />
            <span className="text-[8px] font-bold uppercase tracking-widest">Supabase Secure Auth v2.1</span>
          </div>
        </div>
      </motion.div>

      {/* Decorative Switch Icons */}
      <div className="absolute top-10 left-10 opacity-10 rotate-12">
        <Gamepad2 className="w-20 h-20 text-[#00C3E3]" />
      </div>
      <div className="absolute bottom-10 right-10 opacity-10 -rotate-12">
        <Sparkles className="w-24 h-24 text-[#FFDE00]" />
      </div>
    </div>
  )
}
