"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, Circle, Clock, Sun, Laptop, Coffee, 
  Moon, Sparkles, Trophy, Zap, AlertCircle 
} from 'lucide-react';
import { supabase } from '@/shared/lib/supabase/client';

const getLocalDateString = (d: Date = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface Block {
  id: string;
  activity_name: string;
  start_time: string;
  end_time: string;
  category: string;
  day_of_week: number;
}

interface Checkin {
  block_id: string;
  is_completed: boolean;
}

export default function RoutineTracker() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [checkins, setCheckins] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [isWeekend, setIsWeekend] = useState(false);

  const fetchRoutine = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date();
      const dayIndex = today.getDay(); // 0-6
      setIsWeekend(dayIndex === 0 || dayIndex === 6);
      
      const dateStr = getLocalDateString(today);

      // 1. Cargar bloques de hoy
      const { data: blocksData } = await supabase
        .from('schedule_blocks')
        .select('*')
        .eq('user_id', user.id)
        .eq('day_of_week', dayIndex)
        .order('start_time', { ascending: true });

      // 2. Cargar checkins de hoy
      const { data: checkinsData } = await supabase
        .from('schedule_checkins')
        .select('block_id, is_completed')
        .eq('user_id', user.id)
        .eq('date', dateStr);

      if (blocksData) setBlocks(blocksData);
      
      const checkinMap: Record<string, boolean> = {};
      checkinsData?.forEach(c => {
        checkinMap[c.block_id] = c.is_completed;
      });
      setCheckins(checkinMap);
    } catch (err) {
      console.error("Error loading routine:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutine();
  }, []);

  const toggleCheckin = async (blockId: string) => {
    const isDone = !checkins[blockId];
    
    // Optimistic update
    setCheckins(prev => ({ ...prev, [blockId]: isDone }));

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const dateStr = getLocalDateString();

    if (isDone) {
      await supabase.from('schedule_checkins').upsert({
        user_id: user.id,
        date: dateStr,
        block_id: blockId,
        is_completed: true,
        completed_at: new Date().toISOString()
      }, { onConflict: 'user_id,date,block_id' });
    } else {
      await supabase.from('schedule_checkins')
        .delete()
        .eq('user_id', user.id)
        .eq('date', dateStr)
        .eq('block_id', blockId);
    }
  };

  const total = blocks.length;
  const completedCount = Object.values(checkins).filter(Boolean).length;
  const percentage = total > 0 ? Math.round((completedCount / total) * 100) : 0;
  
  const target = isWeekend ? 40 : 80;
  const hasWonDay = percentage >= target;

  if (loading) return (
    <div className="h-48 bg-white/50 backdrop-blur-md rounded-[2.5rem] flex items-center justify-center border border-white">
      <Zap className="w-6 h-6 text-cyan-500 animate-pulse" />
    </div>
  );

  if (blocks.length === 0) return null;

  return (
    <div className={`relative overflow-hidden transition-all duration-700 ${hasWonDay ? 'ring-2 ring-emerald-500/20' : ''}`}>
      <div className={`bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 space-y-6 ${isWeekend ? 'bg-gradient-to-br from-white to-amber-50/30' : ''}`}>
        
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter italic">
                {isWeekend ? 'Senda de Conexión' : 'Senda del Guerrero'}
              </h3>
              {hasWonDay && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-emerald-500 p-1 rounded-full shadow-lg shadow-emerald-500/30">
                  <Trophy className="w-3 h-3 text-white" />
                </motion.div>
              )}
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {isWeekend ? 'Día de Recarga (Meta: 40%)' : 'Modo Enfoque (Meta: 80%)'}
            </p>
          </div>
          <div className="text-right">
            <span className={`text-3xl font-black italic ${hasWonDay ? 'text-emerald-500' : 'text-slate-800'}`}>
              {percentage}%
            </span>
          </div>
        </div>

        {/* Progress Bar with Marker */}
        <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
          <motion.div 
            className={`h-full transition-colors duration-500 ${hasWonDay ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-gradient-to-r from-cyan-400 to-indigo-500'}`}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
          />
          {/* Target Marker */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-slate-300 z-10" 
            style={{ left: `${target}%` }}
          />
        </div>

        {hasWonDay && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3"
          >
            <Sparkles className="w-5 h-5 text-emerald-500" />
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-tight">
              {isWeekend ? '¡Conexión total! Disfruta tu tiempo.' : '¡Victoria Sellada! Eres imparable hoy.'}
            </p>
          </motion.div>
        )}

        {/* Blocks List */}
        <div className="grid gap-3">
          {blocks.map((block) => {
            const isDone = checkins[block.id];
            return (
              <motion.button
                key={block.id}
                onClick={() => toggleCheckin(block.id)}
                whileHover={{ x: 4 }}
                className={`group flex items-center justify-between p-5 rounded-2xl border transition-all ${
                  isDone 
                    ? 'bg-emerald-50/50 border-emerald-100' 
                    : 'bg-white border-slate-100 hover:border-cyan-200 shadow-sm hover:shadow-md'
                }`}
              >
                <div className="flex items-center gap-4 text-left">
                  <div className={`p-3 rounded-xl transition-colors ${
                    isDone ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-cyan-50 group-hover:text-cyan-500'
                  }`}>
                    {getCategoryIcon(block.category)}
                  </div>
                  <div>
                    <h4 className={`text-sm font-black uppercase tracking-tight leading-none ${isDone ? 'text-emerald-700 line-through opacity-60' : 'text-slate-800'}`}>
                      {block.activity_name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-400 tabular-nums">
                        {block.start_time.slice(0,5)} - {block.end_time.slice(0,5)}
                      </span>
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1">
                         • {block.category}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="ml-4">
                  {isDone ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  ) : (
                    <Circle className="w-6 h-6 text-slate-200 group-hover:text-cyan-200" />
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function getCategoryIcon(category: string) {
  if (category.includes('Mañana')) return <Sun className="w-4 h-4" />;
  if (category.includes('Bloque') || category.includes('Trabajo')) return <Laptop className="w-4 h-4" />;
  if (category.includes('Tarde')) return <Coffee className="w-4 h-4" />;
  if (category.includes('Noche')) return <Moon className="w-4 h-4" />;
  return <Sparkles className="w-4 h-4" />;
}
