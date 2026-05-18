"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Info, Package, Sparkles, Terminal, Trees, Flame, Waves, Cloud, Mountain, LayoutGrid, Trash2 } from "lucide-react";
import { useOracleStore } from "@/store/useOracleStore";
import { createClient } from "@/shared/lib/supabase/client";

interface BackpackDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

// Configuración de Bolsillos (Pockets)
const POCKETS = [
  { id: "Objetos", name: "Objetos", icon: Package, color: "text-slate-400" },
  { id: "Poké Balls", name: "Poké Balls", icon: LayoutGrid, color: "text-red-400" },
  { id: "Bayas", name: "Bayas", icon: Sparkles, color: "text-green-400" },
  { id: "Refugio Pokémon", name: "Pokémon", icon: Terminal, color: "text-cyan-400" },
];

// Biomas para las cajas de Pokémon
const HABITATS = [
  { id: "bosque", name: "Bosque", theme: "from-emerald-500 to-green-700", pattern: "bg-[url('https://www.transparenttextures.com/patterns/tree-bark.png')]", icon: Trees },
  { id: "volcan", name: "Volcán", theme: "from-orange-600 to-red-800", pattern: "bg-[url('https://www.transparenttextures.com/patterns/cracked-dirt.png')]", icon: Flame },
  { id: "mar", name: "Mar", theme: "from-blue-500 to-cyan-600", pattern: "bg-[url('https://www.transparenttextures.com/patterns/swirl.png')]", icon: Waves },
  { id: "cielo", name: "Cielo", theme: "from-sky-400 to-indigo-500", pattern: "bg-[url('https://www.transparenttextures.com/patterns/clouds.png')]", icon: Cloud },
  { id: "cueva", name: "Cueva", theme: "from-slate-700 to-stone-900", pattern: "bg-[url('https://www.transparenttextures.com/patterns/rocky-wall.png')]", icon: Mountain },
];

const SLOTS_PER_BOX = 30;

export default function BackpackDashboard({ isOpen, onClose }: BackpackDashboardProps) {
  const { inventory, fetchInventory } = useOracleStore();
  const [activePocketId, setActivePocketId] = useState("Objetos");
  const [currentBoxIndex, setCurrentBoxIndex] = useState(0);
  const [extraBoxes, setExtraBoxes] = useState<Record<string, number>>({}); // { pocketId: count }
  const [selectedSlot, setSelectedSlot] = useState<any | null>(null);
  const [direction, setDirection] = useState(0);

  const [injectQuantity, setInjectQuantity] = useState(1);
  const [isInjecting, setIsInjecting] = useState(false);
  const supabase = createClient();

  // Sincronizar estilos de scrollbar
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const styleTag = document.createElement("style");
      styleTag.id = "backpack-scrollbar-styles";
      styleTag.innerHTML = `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #64748b; }
      `;
      document.head.appendChild(styleTag);
      return () => {
        const tag = document.getElementById("backpack-scrollbar-styles");
        if (tag) document.head.removeChild(tag);
      };
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchInventory();
    }
  }, [isOpen, fetchInventory]);

  // Lógica de organización: Divide el inventario en Bolsillos y luego en Cajas de 30
  const processedInventory = useMemo(() => {
    const pocketsMap: Record<string, any[]> = {};
    
    // 1. Agrupar por bolsillo
    POCKETS.forEach(p => pocketsMap[p.id] = []);
    inventory.forEach(item => {
      if (pocketsMap[item.category]) {
        pocketsMap[item.category].push(item);
      } else {
        pocketsMap["Objetos"].push(item); // Fallback
      }
    });

    // 2. Fragmentar en cajas de 30 slots
    const result: Record<string, any[]> = {};
    Object.keys(pocketsMap).forEach(pocketId => {
      const items = pocketsMap[pocketId];
      const chunkedBoxes = [];
      
      // Cajas basadas en items reales
      for (let i = 0; i < items.length || i === 0; i += SLOTS_PER_BOX) {
        const boxItems = items.slice(i, i + SLOTS_PER_BOX);
        const slots = Array.from({ length: SLOTS_PER_BOX }).map((_, idx) => boxItems[idx] || null);
        
        const habitatIndex = Math.floor(i / SLOTS_PER_BOX) % HABITATS.length;
        const habitat = pocketId === "Refugio Pokémon" ? HABITATS[habitatIndex] : null;

        chunkedBoxes.push({
          id: `${pocketId}-${i}`,
          pocketId,
          name: pocketId === "Refugio Pokémon" ? `Hábitat: ${habitat?.name}` : `Caja ${Math.floor(i/SLOTS_PER_BOX) + 1}`,
          theme: habitat ? habitat.theme : "from-slate-800 to-slate-900",
          pattern: habitat ? habitat.pattern : "bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]",
          habitatIcon: habitat?.icon || Package,
          slots
        });
      }

      // Añadir cajas extra manuales
      const extraCount = extraBoxes[pocketId] || 0;
      const currentCount = chunkedBoxes.length;
      for (let j = 0; j < extraCount; j++) {
        const habitatIndex = (currentCount + j) % HABITATS.length;
        const habitat = pocketId === "Refugio Pokémon" ? HABITATS[habitatIndex] : null;

        chunkedBoxes.push({
          id: `${pocketId}-extra-${j}`,
          pocketId,
          name: pocketId === "Refugio Pokémon" ? `Hábitat: ${habitat?.name}` : `Caja ${currentCount + j + 1}`,
          theme: habitat ? habitat.theme : "from-slate-800 to-slate-900",
          pattern: habitat ? habitat.pattern : "bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]",
          habitatIcon: habitat?.icon || Package,
          slots: Array.from({ length: SLOTS_PER_BOX }).map(() => null)
        });
      }

      result[pocketId] = chunkedBoxes;
    });

    return result;
  }, [inventory, extraBoxes]);

  const currentPocketBoxes = processedInventory[activePocketId] || [];
  const currentBox = currentPocketBoxes[currentBoxIndex] || currentPocketBoxes[0];

  // Reset de página al cambiar de bolsillo
  const handlePocketChange = (id: string) => {
    setActivePocketId(id);
    setCurrentBoxIndex(0);
    setDirection(0);
  };

  // Auto-selección al cambiar de caja o bolsillo
  useEffect(() => {
    if (isOpen && currentBox) {
      const firstItem = currentBox.slots.find((s: any) => s !== null);
      setSelectedSlot(firstItem || null);
    }
  }, [isOpen, activePocketId, currentBoxIndex, currentBox]);

  if (!isOpen) return null;

  const handlePrevBox = () => {
    setDirection(-1);
    setCurrentBoxIndex((prev) => (prev > 0 ? prev - 1 : currentPocketBoxes.length - 1));
  };

  const handleNextBox = () => {
    setDirection(1);
    setCurrentBoxIndex((prev) => (prev < currentPocketBoxes.length - 1 ? prev + 1 : 0));
  };

  const handleDeleteBox = () => {
    if (!currentBox) return;

    // Solo permitir borrar si es una caja extra manual
    const isExtra = currentBox.id.includes("-extra-");
    if (!isExtra) {
      alert("No puedes borrar cajas que contienen inventario base o sistemas obligatorios.");
      return;
    }

    // Verificar si está vacía
    const isEmpty = currentBox.slots.every((s: any) => s === null);
    if (!isEmpty) {
      alert("La caja debe estar vacía para poder eliminarla.");
      return;
    }

    // Eliminar
    setExtraBoxes(prev => ({
      ...prev,
      [activePocketId]: Math.max(0, (prev[activePocketId] || 0) - 1)
    }));

    // Navegar atrás
    if (currentBoxIndex > 0) {
      setDirection(-1);
      setCurrentBoxIndex(prev => prev - 1);
    }
  };

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 500 : -500, opacity: 0 }),
    center: { zIndex: 1, x: 0, opacity: 1 },
    exit: (dir: number) => ({ zIndex: 0, x: dir < 0 ? 500 : -500, opacity: 0 })
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 lg:p-8">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl"
        />

        <motion.div
          initial={{ y: 50, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 50, opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-7xl h-[90vh] bg-slate-900 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border-4 border-slate-800"
        >
          {/* TOP NAV: Pocket Selector */}
          <div className="bg-slate-950 border-b border-slate-800 flex items-center justify-between px-8 h-20">
            <div className="flex gap-4">
              {POCKETS.map((pocket) => {
                const Icon = pocket.icon;
                const isActive = activePocketId === pocket.id;
                return (
                  <button
                    key={pocket.id}
                    onClick={() => handlePocketChange(pocket.id)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all ${
                      isActive 
                        ? "bg-slate-800 text-white shadow-lg ring-2 ring-slate-700" 
                        : "text-slate-500 hover:text-slate-300 hover:bg-slate-900"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? pocket.color : ""}`} />
                    {pocket.name}
                  </button>
                );
              })}
            </div>
            <button onClick={onClose} className="p-3 text-slate-500 hover:text-white hover:bg-slate-800 rounded-full transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* GRID AREA */}
            <div className="flex-1 flex flex-col p-8 bg-slate-950">
              {/* Box Header & Mini-map */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800">
                    <currentBox.habitatIcon className="w-6 h-6 text-slate-300" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tighter">{currentBox.name}</h2>
                    <div className="flex gap-1.5 mt-1.5">
                      {currentPocketBoxes.map((_, idx) => (
                        <div 
                          key={idx} 
                          className={`h-1.5 rounded-full transition-all ${
                            idx === currentBoxIndex ? "w-6 bg-cyan-500" : "w-1.5 bg-slate-800"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                      setExtraBoxes(prev => ({
                        ...prev,
                        [activePocketId]: (prev[activePocketId] || 0) + 1
                      }));
                      // Opcional: saltar a la nueva caja
                      setTimeout(() => {
                        setDirection(1);
                        setCurrentBoxIndex(currentPocketBoxes.length);
                      }, 50);
                    }}
                    className="p-3 bg-cyan-950/30 hover:bg-cyan-900/50 rounded-xl text-cyan-400 border border-cyan-500/30 transition-all flex items-center gap-2 px-4 group"
                    title="Crear nueva caja"
                  >
                    <LayoutGrid className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Añadir Caja</span>
                  </button>

                  {/* Botón Eliminar Caja (Solo si es extra y está vacía) */}
                  {currentBox.id.includes("-extra-") && (
                    <button 
                      onClick={handleDeleteBox}
                      className="p-3 bg-red-950/30 hover:bg-red-900/50 rounded-xl text-red-400 border border-red-500/30 transition-all flex items-center gap-2 px-4 group"
                      title="Eliminar esta caja (solo si está vacía)"
                    >
                      <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Eliminar</span>
                    </button>
                  )}

                  <div className="h-8 w-px bg-slate-800 mx-2" />

                  <button onClick={handlePrevBox} className="p-3 bg-slate-900 hover:bg-slate-800 rounded-xl text-white border border-slate-800"><ChevronLeft/></button>
                  <button onClick={handleNextBox} className="p-3 bg-slate-900 hover:bg-slate-800 rounded-xl text-white border border-slate-800"><ChevronRight/></button>
                </div>
              </div>

              {/* Box Viewport */}
              <div className="flex-1 relative rounded-[2.5rem] overflow-hidden border-8 border-slate-900 shadow-2xl">
                <AnimatePresence initial={false} custom={direction}>
                  <motion.div
                    key={currentBox.id} custom={direction} variants={variants}
                    initial="enter" animate="center" exit="exit"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className={`absolute inset-0 w-full h-full bg-gradient-to-br ${currentBox.theme} p-8`}
                  >
                    <div className={`absolute inset-0 ${currentBox.pattern} opacity-25`} />
                    <div className="relative z-10 grid grid-cols-6 grid-rows-5 gap-4 h-full">
                      {currentBox.slots.map((item: any, idx: number) => (
                        <div 
                          key={item ? item.id : `empty-${idx}`}
                          onClick={() => item && setSelectedSlot(item)}
                          className={`
                            relative bg-slate-950/20 backdrop-blur-md border-2 rounded-2xl flex items-center justify-center cursor-pointer transition-all hover:scale-105
                            ${selectedSlot?.id === item?.id ? 'border-white bg-white/10 shadow-2xl scale-110 z-20' : 'border-white/5'}
                          `}
                        >
                          {item ? (
                            <>
                              <img src={item.image_url} alt={item.name} className={`w-12 h-12 object-contain drop-shadow-lg ${item.status === 'Coma' ? 'grayscale opacity-50' : ''}`} />
                              {item.quantity > 1 && (
                                <span className="absolute bottom-2 right-2 bg-slate-950 text-white text-[10px] font-black px-2 py-0.5 rounded-lg border border-white/20">
                                  x{item.quantity}
                                </span>
                              )}
                            </>
                          ) : (
                            <div className="w-1.5 h-1.5 bg-white/5 rounded-full" />
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* DETAIL PANEL */}
            <div className="w-[450px] bg-slate-900 border-l border-slate-800 p-10 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-[0.02] pointer-events-none"><Package className="w-96 h-96" /></div>

              {selectedSlot ? (
                <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} key={selectedSlot.id} className="relative z-10 flex flex-col h-full">
                  <div className="h-56 bg-slate-950 rounded-[2.5rem] border-4 border-slate-800 mb-8 flex items-center justify-center relative overflow-hidden shadow-inner group">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-10" />
                    <img src={selectedSlot.image_url} className={`w-36 h-36 object-contain drop-shadow-2xl group-hover:scale-110 transition-transform duration-700 ${selectedSlot.status === 'Coma' ? 'grayscale' : ''}`} />
                  </div>

                  <div className="mb-6">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-950 rounded-full mb-4 border border-slate-800">
                      <Sparkles className={`w-3.5 h-3.5 ${selectedSlot.rarity === 'Legendario' ? 'text-violet-400' : 'text-amber-400'}`} />
                      <span className="text-xs font-black text-slate-300 uppercase tracking-widest">{selectedSlot.rarity || 'Común'}</span>
                    </div>
                    <h3 className="text-4xl font-black text-white uppercase tracking-tighter leading-none mb-2">{selectedSlot.name}</h3>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Cantidad en posesión: {selectedSlot.quantity}</p>
                  </div>

                  <div className="bg-slate-950/50 rounded-3xl p-6 border border-slate-800 flex-1 overflow-y-auto custom-scrollbar shadow-inner space-y-4">
                    {selectedSlot.category === "Refugio Pokémon" ? (
                      <>
                        {(selectedSlot.description && selectedSlot.description !== "Un compañero Pokémon leal.") && (
                          <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800/50 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity"><Info className="w-8 h-8" /></div>
                            <p className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                              <Sparkles className="w-3 h-3" /> Entrada Pokédex
                            </p>
                            <p className="text-slate-200 text-sm leading-relaxed italic relative z-10">"{selectedSlot.description}"</p>
                          </div>
                        )}
                        
                        {selectedSlot.habitat && (
                          <div className="p-4 bg-emerald-950/20 rounded-2xl border border-emerald-500/20 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity"><Trees className="w-8 h-8" /></div>
                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                              <Mountain className="w-3 h-3" /> Localización
                            </p>
                            <p className="text-emerald-50 text-sm font-bold relative z-10">{selectedSlot.habitat}</p>
                          </div>
                        )}

                        {selectedSlot.anime_lore && (
                          <div className="p-4 bg-amber-950/10 rounded-2xl border border-amber-500/10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity"><Terminal className="w-10 h-10" /></div>
                            <p className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                              <Info className="w-3 h-3" /> Lore de la Especie
                            </p>
                            <p className="text-slate-300 text-xs leading-relaxed relative z-10">{selectedSlot.anime_lore}</p>
                          </div>
                        )}

                        {(!selectedSlot.habitat && !selectedSlot.anime_lore && (!selectedSlot.description || selectedSlot.description === "Un compañero Pokémon leal.")) && (
                           <div className="flex flex-col items-center justify-center py-8 opacity-40">
                             <Sparkles className="w-8 h-8 mb-2" />
                             <p className="text-[10px] font-black uppercase tracking-widest">Sin datos adicionales</p>
                           </div>
                        )}
                      </>
                    ) : (
                      <p className="text-slate-300 text-base font-medium leading-relaxed italic">"{selectedSlot.description || "Un fragmento de realidad guardado en el Éter."}"</p>
                    )}
                  </div>

                  <div className="mt-8 flex flex-col gap-4">
                    {selectedSlot.id.startsWith("game-") && selectedSlot.quantity > 1 && (
                      <div className="flex items-center justify-between bg-slate-100 p-2 rounded-xl">
                        <span className="text-xs font-bold text-slate-500 uppercase px-2">Cantidad:</span>
                        <div className="flex items-center gap-3">
                          <button 
                            disabled={injectQuantity <= 1 || isInjecting}
                            onClick={() => setInjectQuantity(q => Math.max(1, q - 1))}
                            className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm font-black disabled:opacity-50"
                          >
                            -
                          </button>
                          <span className="font-black text-slate-700 min-w-[20px] text-center">{injectQuantity}</span>
                          <button 
                            disabled={injectQuantity >= selectedSlot.quantity || isInjecting}
                            onClick={() => setInjectQuantity(q => Math.min(selectedSlot.quantity, q + 1))}
                            className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm font-black disabled:opacity-50"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )}

                    <button 
                      onClick={async () => {
                        if (!selectedSlot || !selectedSlot.id_interno_gba || isInjecting) return;
                        
                        setIsInjecting(true);
                        try {
                          const { data: { user } } = await supabase.auth.getUser();
                          if (!user) throw new Error("No user");

                          const isPokemon = selectedSlot.id.startsWith("pokemon-");

                          // 1. Crear el ticket de inyección en Supabase
                          const { error: insertError } = await supabase.from('pending_injections').insert({
                            user_id: user.id,
                            type: isPokemon ? 'pokemon' : 'item',
                            status: 'pending',
                            source: 'Mochila Web',
                            source_note: selectedSlot.name,
                            item_id: !isPokemon ? selectedSlot.id_interno_gba : null,
                            item_quantity: !isPokemon ? injectQuantity : null,
                            species: isPokemon ? selectedSlot.id_interno_gba : null,
                            shiny: isPokemon ? (selectedSlot as any).shiny : false,
                          });
                          if (insertError) throw insertError;

                          // 2. Descontar del inventario en la base de datos
                          if (!isPokemon) {
                            // Extraer el row UUID real del id compuesto (e.g. "game-<uuid>" o "loot-<uuid>")
                            const rawId = selectedSlot.id.replace(/^(game|loot)-/, '');
                            const newQty = selectedSlot.quantity - injectQuantity;

                            if (selectedSlot.id.startsWith('game-')) {
                              // Objeto de juego: tabla inventario_usuario
                              if (newQty <= 0) {
                                const { error } = await supabase.from('inventario_usuario').delete().eq('id', rawId);
                                if (error) throw error;
                              } else {
                                const { error } = await supabase.from('inventario_usuario').update({ cantidad: newQty }).eq('id', rawId);
                                if (error) throw error;
                              }
                            } else if (selectedSlot.id.startsWith('loot-')) {
                              // Objeto de loot (web): tabla user_inventory
                              if (newQty <= 0) {
                                const { error } = await supabase.from('user_inventory').delete().eq('id', rawId);
                                if (error) throw error;
                              } else {
                                const { error } = await supabase.from('user_inventory').update({ quantity: newQty }).eq('id', rawId);
                                if (error) throw error;
                              }
                            }
                          } else {
                            // Pokémon: eliminarlo del equipo web
                            const rawId = selectedSlot.id.replace(/^pokemon-/, '');
                            const { error } = await supabase.from('equipo_pokemon_usuario').delete().eq('id', rawId);
                            if (error) throw error;
                          }

                          // 3. Refrescar y actualizar UI
                          const newQty = selectedSlot.quantity - injectQuantity;
                          if (isPokemon || newQty <= 0) {
                            setSelectedSlot(null);
                          } else {
                            setSelectedSlot({ ...selectedSlot, quantity: newQty });
                            setInjectQuantity(1);
                          }
                          await fetchInventory();

                          alert(`✅ ¡${isPokemon ? selectedSlot.name : injectQuantity + 'x ' + selectedSlot.name} enviado(s) a la Terminal PC! Se aplicará al iniciar el juego.`);

                        } catch (err) {
                          console.error(err);
                          alert("❌ Error al enviar a la terminal. Intenta de nuevo.");
                        } finally {
                          setIsInjecting(false);
                        }
                      }}
                      disabled={isInjecting || !selectedSlot.id_interno_gba}
                      className="w-full py-5 bg-emerald-600 text-white rounded-3xl font-black uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-[0_20px_40px_rgba(5,150,105,0.25)] flex items-center justify-center gap-3 border-b-8 border-emerald-800 active:border-b-0 active:translate-y-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Terminal className={`w-6 h-6 ${isInjecting ? 'animate-spin' : 'group-hover:animate-pulse'}`} />
                      {isInjecting ? 'Enviando...' : 'Inyectar a Terminal PC'}
                    </button>
                    {!selectedSlot.id_interno_gba && (
                      <p className="text-center text-[10px] font-black text-red-500 uppercase">Falta ID Interno GBA en la BD</p>
                    )}
                    <p className="text-center text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Destino: PARTIDA_ACTIVA.SRM</p>
                  </div>
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-700">
                  <Info className="w-20 h-20 mb-6 opacity-20" />
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-center opacity-40">Selecciona un elemento<br/>para vincular</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
