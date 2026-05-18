"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Package, Trophy, ArrowRight } from "lucide-react";
import confetti from "canvas-confetti";

interface LootModalProps {
  isOpen: boolean;
  onClose: () => void;
  reward?: {
    name: string;
    image: string;
    type: "item" | "pokemon";
    amount?: number;
  };
}

export default function LootModal({ isOpen, onClose, reward }: LootModalProps) {
  const [phase, setPhase] = useState<"closed" | "opening" | "revealed">("closed");

  useEffect(() => {
    if (isOpen) {
      setPhase("closed");
    }
  }, [isOpen]);

  const handleOpen = () => {
    setPhase("opening");
    
    // Simular el suspenso de la captura (3 batidas)
    setTimeout(() => {
      setPhase("revealed");
      // Lanzar confetti al revelar
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#EB0012", "#00BDEE", "#FFCC00", "#10B981"]
      });
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={phase === "revealed" ? onClose : undefined}
          className="absolute inset-0 bg-slate-900/90 backdrop-blur-md"
        />

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="relative w-full max-w-sm bg-white rounded-[3rem] p-8 text-center shadow-2xl overflow-hidden border-4 border-slate-200"
        >
          {/* Background Rays for Revealed Phase */}
          {phase === "revealed" && (
            <motion.div 
              initial={{ opacity: 0, rotate: 0 }}
              animate={{ opacity: 1, rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 -z-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"
            />
          )}

          <div className="relative z-10">
            {phase !== "revealed" ? (
              <div className="space-y-6">
                <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">¡Nuevo Botín Detectado!</p>
                
                <div className="relative py-12">
                  <motion.div
                    animate={phase === "opening" ? {
                      rotate: [0, -10, 10, -10, 10, 0],
                      x: [0, -5, 5, -5, 5, 0],
                    } : {}}
                    transition={{ 
                      duration: 0.5, 
                      repeat: phase === "opening" ? 3 : 0,
                      ease: "easeInOut"
                    }}
                    className="cursor-pointer"
                    onClick={phase === "closed" ? handleOpen : undefined}
                  >
                    <img 
                      src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png" 
                      alt="Pokeball"
                      className="w-32 h-32 mx-auto drop-shadow-[0_20px_30px_rgba(235,0,18,0.3)]"
                    />
                    {phase === "closed" && (
                      <motion.div 
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="mt-4 text-slate-400 font-bold text-sm"
                      >
                        Toca para abrir
                      </motion.div>
                    )}
                  </motion.div>
                </div>
              </div>
            ) : (
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="space-y-6"
              >
                <div className="inline-flex items-center gap-2 px-4 py-1 bg-pk-yellow/20 rounded-full">
                  <Sparkles className="w-4 h-4 text-pk-yellow" />
                  <span className="text-xs font-black text-navy uppercase tracking-widest">¡Victoria!</span>
                </div>

                <div className="relative">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-40 h-40 mx-auto bg-slate-50 rounded-full flex items-center justify-center border-4 border-slate-100 shadow-inner overflow-hidden"
                  >
                    <img 
                      src={reward?.image || "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/151.gif"} 
                      alt="Reward"
                      className="w-28 h-28 object-contain"
                    />
                  </motion.div>
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="absolute -bottom-2 -right-2 bg-[#EB0012] text-white w-12 h-12 rounded-full flex items-center justify-center border-4 border-white font-black text-xl shadow-lg"
                  >
                    {reward?.amount || 1}
                  </motion.div>
                </div>

                <div>
                  <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">
                    {reward?.name || "Pokémon Legendario"}
                  </h3>
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">
                    Agregado a tu PC de Almacenamiento
                  </p>
                </div>

                <button
                  onClick={onClose}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-800 transition-colors group shadow-xl"
                >
                  Continuar
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
