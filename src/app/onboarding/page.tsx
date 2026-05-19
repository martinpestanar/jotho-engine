"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sun, Sunset, Moon, Target, Sword, Shield, Sparkles,
  Heart, Rocket, Loader2, CheckCircle2, ChevronRight, ChevronLeft, AlertCircle,
  ScrollText, LayoutGrid, Compass, Trophy, Settings2, Plus, Trash2, Clock, 
  DollarSign, Briefcase, User, Brain, Flame, Zap
} from 'lucide-react';
import { supabase } from '@/shared/lib/supabase/client';
import { useAppStore } from '@/store/useAppStore';

// --- TIPOS ---
interface Skill {
  name: string;
  level: string;
  priority: string;
}

interface ScheduleBlock {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  activity_name: string;
  category: string;
}

interface DatosFormulario {
  nombre: string;
  edad: string;
  profesion: string;
  timezone: string;
  ingreso_actual: string;
  ingreso_meta_90d: string;
  ingreso_meta_1y: string;
  fuente_ingresos: string;
  skills: Skill[];
  metas_90d: string;
  metas_1y: string;
  metas_3y: string;
  motivaciones: string;
  nicho: string;
  pilares: string[];
  frecuencia: string;
  plataformas: string[];
  demonios_activos: string[];
  demonios_extra: string;
  bloques: ScheduleBlock[];
  enfoque_proyectos: string;
}

const bloquesPredefinidos: ScheduleBlock[] = [
  // MAÑANA
  { day_of_week: 1, start_time: '10:00', end_time: '11:00', activity_name: 'Despertar + Meditación/Estiramientos', category: '🌅 Mañana' },
  { day_of_week: 1, start_time: '11:00', end_time: '12:00', activity_name: 'Limpieza Habitación/Terraza', category: '🌅 Mañana' },
  { day_of_week: 1, start_time: '12:00', end_time: '12:45', activity_name: 'Ukelele / Indie Folk', category: '🌅 Mañana' },
  { day_of_week: 1, start_time: '12:45', end_time: '13:00', activity_name: 'Caminata hacia Oficina', category: '🌅 Mañana' },
  // BLOQUE 1
  { day_of_week: 1, start_time: '13:00', end_time: '14:00', activity_name: 'Sustento Inmediato (Corki/Green)', category: '💻 Bloque 1' },
  { day_of_week: 1, start_time: '14:00', end_time: '15:00', activity_name: 'Ventas Activas (Nilah IA)', category: '💻 Bloque 1' },
  { day_of_week: 1, start_time: '15:00', end_time: '16:00', activity_name: 'Posicionamiento (LinkedIn/GitHub)', category: '💻 Bloque 1' },
  { day_of_week: 1, start_time: '16:00', end_time: '17:00', activity_name: 'Desarrollo Técnico (n8n/IA)', category: '💻 Bloque 1' },
  // TARDE
  { day_of_week: 1, start_time: '17:00', end_time: '18:45', activity_name: 'Regreso + Plantas + Almuerzo/Cena', category: '🥗 Tarde' },
  { day_of_week: 1, start_time: '18:45', end_time: '19:00', activity_name: 'Regreso a Oficina', category: '🥗 Tarde' },
  // BLOQUE 2
  { day_of_week: 1, start_time: '19:00', end_time: '20:00', activity_name: 'Proyectos Profesionales / Nilah', category: '💻 Bloque 2' },
  { day_of_week: 1, start_time: '20:00', end_time: '21:30', activity_name: 'Inglés & Estudio Técnico', category: '💻 Bloque 2' },
  { day_of_week: 1, start_time: '21:30', end_time: '22:00', activity_name: 'Orden de Oficina + Plan Mañana', category: '💻 Bloque 2' },
  // NOCHE
  { day_of_week: 1, start_time: '22:00', end_time: '23:00', activity_name: 'Tiempo libre / Caminata Mamá', category: '🌙 Noche' },
  { day_of_week: 1, start_time: '23:00', end_time: '02:00', activity_name: 'Cine/Series con Mamá', category: '🌙 Noche' },
];

const estadoInicial: DatosFormulario = {
  nombre: '',
  edad: '',
  profesion: '',
  timezone: 'America/Argentina/Buenos_Aires',
  ingreso_actual: '',
  ingreso_meta_90d: '',
  ingreso_meta_1y: '',
  fuente_ingresos: '',
  skills: [{ name: 'n8n', level: 'Intermedio', priority: 'Alta' }, { name: 'IA Generativa', level: 'Básico', priority: 'Alta' }],
  metas_90d: '',
  metas_1y: '',
  metas_3y: '',
  motivaciones: '',
  nicho: '',
  pilares: ['Automatización', 'IA', 'Productividad'],
  frecuencia: '3 veces por semana',
  plataformas: ['LinkedIn', 'YouTube', 'TikTok'],
  demonios_activos: ['pornografía', 'LoL excesivo'],
  demonios_extra: '',
  bloques: bloquesPredefinidos,
  enfoque_proyectos: '',
};

const variantesDeslizamiento = {
  entrar: (direccion: number) => ({ x: direccion > 0 ? 500 : -500, opacity: 0, scale: 0.95 }),
  centro: { x: 0, opacity: 1, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 30 } },
  salir: (direccion: number) => ({ x: direccion < 0 ? 500 : -500, opacity: 0, scale: 0.95, transition: { type: "spring" as const, stiffness: 300, damping: 30 } })
};

export default function OnboardingCompleto() {
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get('edit') === 'true';
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [pasoActual, setPasoActual] = useState(1);
  const [direccion, setDireccion] = useState(1);
  const [datos, setDatos] = useState<DatosFormulario>(estadoInicial);
  const [estaCargando, setEstaCargando] = useState(false);
  const [estaCompletado, setEstaCompletado] = useState(false);
  const [errorMensaje, setErrorMensaje] = useState('');
  const { completeOnboarding } = useAppStore();

  const guardandoRef = useRef(false);
  const [isSaving, setIsSaving] = useState(false);

  const totalPasos = 5;

  useEffect(() => {
    const cargarPlan = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Cargar Paso Actual, Life Plan y Bloques (Solo Lunes como plantilla maestra)
      const [statusRes, lpRes, blkRes] = await Promise.all([
        supabase.from('user_status').select('onboarding_step').eq('user_id', user.id).maybeSingle(),
        supabase.from('life_plan').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('schedule_blocks').select('*').eq('user_id', user.id).eq('day_of_week', 1).order('start_time', { ascending: true })
      ]);

      if (statusRes.data?.onboarding_step) {
        setPasoActual(statusRes.data.onboarding_step);
      }

      if (lpRes.data) {
        const lp = lpRes.data;
        setDatos(prev => ({
          ...prev,
          nombre: lp.identity_info?.nombre || '',
          edad: lp.identity_info?.edad?.toString() || '',
          profesion: lp.identity_info?.profesion || '',
          timezone: lp.timezone || prev.timezone,
          ingreso_actual: lp.financial_info?.ingreso_actual?.toString() || '',
          ingreso_meta_90d: lp.financial_info?.ingreso_meta_90d?.toString() || '',
          ingreso_meta_1y: lp.financial_info?.ingreso_meta_1y?.toString() || '',
          fuente_ingresos: lp.financial_info?.fuente || '',
          skills: lp.skills_mastery || prev.skills,
          metas_90d: lp.quarterly_goals?.texto || '',
          metas_1y: lp.annual_goals?.texto || '',
          metas_3y: lp.long_term_goals?.texto || '',
          motivaciones: lp.motivations_long || '',
          nicho: lp.brand_strategy?.nicho || '',
          pilares: lp.content_pillars && lp.content_pillars.length > 0 ? lp.content_pillars : prev.pilares,
          frecuencia: lp.brand_strategy?.frecuencia || '',
          plataformas: lp.social_platforms && lp.social_platforms.length > 0 ? lp.social_platforms : prev.plataformas,
          demonios_activos: lp.demon_config?.activos || prev.demonios_activos,
          demonios_extra: lp.demon_config?.extra || '',
          bloques: blkRes.data && blkRes.data.length > 0 ? blkRes.data : prev.bloques,
          enfoque_proyectos: lp.brand_strategy?.enfoque_proyectos || '',
        }));
      }
    };
    cargarPlan();
  }, []);

  const persistirProgreso = async (siguientePaso: number) => {
    if (guardandoRef.current) {
      console.warn("Guardado ya en progreso, ignorando llamada duplicada");
      return;
    }
    guardandoRef.current = true;
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Validar números para evitar NaN (causa error 400)
      const edadNum = parseInt(datos.edad) || 0;
      const ingresoActual = parseFloat(datos.ingreso_actual) || 0;
      const ingreso90d = parseFloat(datos.ingreso_meta_90d) || 0;
      const ingreso1y = parseFloat(datos.ingreso_meta_1y) || 0;

      // Guardar estado actual del Plan
      const { error: lpError } = await supabase.from('life_plan').upsert({
        user_id: user.id,
        identity_info: { nombre: datos.nombre, edad: edadNum, profesion: datos.profesion },
        timezone: datos.timezone,
        financial_info: { 
          ingreso_actual: ingresoActual, 
          ingreso_meta_90d: ingreso90d, 
          ingreso_meta_1y: ingreso1y, 
          fuente: datos.fuente_ingresos 
        },
        skills_mastery: datos.skills,
        quarterly_goals: { texto: datos.metas_90d },
        annual_goals: { texto: datos.metas_1y },
        long_term_goals: { texto: datos.metas_3y },
        motivations_long: datos.motivaciones,
        brand_strategy: { 
          nicho: datos.nicho, 
          frecuencia: datos.frecuencia, 
          enfoque_proyectos: datos.enfoque_proyectos 
        },
        content_pillars: datos.pilares,
        social_platforms: datos.plataformas,
        demon_config: { activos: datos.demonios_activos, extra: datos.demonios_extra }
      }, { onConflict: 'user_id' });

      if (lpError) console.error("Error guardando life_plan:", lpError);

      // Guardar bloques: Automatizar de Lunes a Viernes (1-5) y Weekend (6,0)
      await supabase.from('schedule_blocks').delete().eq('user_id', user.id);
      if (datos.bloques.length > 0) {
        const allWeekBlocks: any[] = [];
        
        // Guardar bloques para todos los días de la semana (0 a 6) de forma completa
        [0, 1, 2, 3, 4, 5, 6].forEach(day => {
          datos.bloques.forEach(b => {
            allWeekBlocks.push({
              user_id: user.id,
              day_of_week: day,
              start_time: b.start_time,
              end_time: b.end_time,
              activity_name: b.activity_name,
              category: b.category
            });
          });
        });
        await supabase.from('schedule_blocks').insert(allWeekBlocks);
      }

      // Actualizar paso en user_status
      await supabase.from('user_status').update({ onboarding_step: siguientePaso }).eq('user_id', user.id);
    } catch (err) {
      console.error("Error persistiendo progreso:", err);
    } finally {
      guardandoRef.current = false;
      setIsSaving(false);
    }
  };

  const avanzarPaso = async () => {
    if (isSaving || estaCargando) return;
    if (pasoActual < totalPasos) {
      const proximo = pasoActual + 1;
      setDireccion(1);
      setPasoActual(proximo);
      await persistirProgreso(proximo);
    }
  };

  const retrocederPaso = async () => {
    if (isSaving || estaCargando) return;
    if (pasoActual > 1) {
      const anterior = pasoActual - 1;
      setDireccion(-1);
      setPasoActual(anterior);
      await persistirProgreso(anterior);
    }
  };

  const actualizarDatos = (updates: Partial<DatosFormulario>) => {
    setDatos(prev => ({ ...prev, ...updates }));
  };

  const sincronizar = async () => {
    if (isSaving || estaCargando) return;
    setEstaCargando(true);
    setErrorMensaje('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No hay usuario.");

      // 1. Realizar el último guardado de todos los datos
      await persistirProgreso(pasoActual);

      // 2. Marcar onboarding como completado
      const { error: statusError } = await supabase.from('user_status').update({ 
        is_onboarding_completed: true 
      }).eq('user_id', user.id);

      if (statusError) throw statusError;

      completeOnboarding();
      setEstaCompletado(true);
    } catch (err: any) {
      console.error("Error en sincronización final:", err);
      setErrorMensaje(err.message);
    } finally {
      setEstaCargando(false);
    }
  };

  if (estaCompletado) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-8 ${theme === "dark" ? "bg-[#0B0F1A] text-white" : "bg-[#F8FAFC]"}`}>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`max-w-xl w-full p-12 rounded-[3rem] border text-center space-y-8 ${theme === "dark" ? "bg-[#0F172A] border-white/10" : "bg-white border-slate-200"}`}>
          <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/40">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
          <div className="space-y-4">
            <h1 className="text-5xl font-black italic uppercase leading-none">¡Ritual Completado!</h1>
            <p className="text-slate-500 font-medium">Tu Plan de Vida ha sido sellado en la base de datos. El Oráculo ahora tiene todo lo necesario para guiarte.</p>
          </div>
          <div className="flex flex-col gap-4">
            <button 
              onClick={() => window.location.href = '/'}
              className="w-full py-5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:scale-[1.02] transition-transform"
            >
              Ir al Oráculo
            </button>
            <button 
              onClick={() => window.location.href = '/dashboard'}
              className="w-full py-5 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-red-500/20 hover:scale-[1.02] transition-transform"
            >
              Ir a Johto (Pokémon)
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 md:p-8 font-sans ${theme === "dark" ? "bg-[#0B0F1A] text-slate-200" : "bg-[#F8FAFC] text-slate-800"}`}>
      <div className={`w-full max-w-6xl rounded-3xl shadow-2xl border transition-all overflow-hidden flex flex-col min-h-[85vh] relative z-10 ${theme === "dark" ? "bg-[#0F172A] border-white/10" : "bg-white border-slate-200"}`}>
        
        {/* Header con Progreso */}
        <div className="px-12 pt-12 pb-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <ScrollText className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-[1000] uppercase tracking-tighter italic">Plan de Vida</h1>
            </div>
            <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${theme === "dark" ? "bg-white/5 text-cyan-400" : "bg-cyan-50 text-cyan-600"}`}>
              Fase {pasoActual} de {totalPasos}
            </div>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex gap-1">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className={`h-full flex-1 transition-all duration-700 ${i <= pasoActual ? 'bg-cyan-500' : 'bg-white/5'}`} />
            ))}
          </div>
        </div>

        {/* Contenido Dinámico */}
        <div className="flex-1 px-12 py-4 overflow-y-auto max-h-[60vh]">
          <AnimatePresence mode="wait" custom={direccion}>
            <motion.div key={pasoActual} custom={direccion} variants={variantesDeslizamiento} initial="entrar" animate="centro" exit="salir">
              {pasoActual === 1 && <SeccionIdentidad datos={datos} setDatos={actualizarDatos} theme={theme} />}
              {pasoActual === 2 && <SeccionHorarios datos={datos} setDatos={actualizarDatos} theme={theme} />}
              {pasoActual === 3 && <SeccionArsenal datos={datos} setDatos={actualizarDatos} theme={theme} />}
              {pasoActual === 4 && <SeccionMetasYMarca datos={datos} setDatos={actualizarDatos} theme={theme} />}
              {pasoActual === 5 && <SeccionDemonios datos={datos} setDatos={actualizarDatos} theme={theme} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Navegación */}
        <div className={`p-10 border-t flex justify-between items-center ${theme === "dark" ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-100"}`}>
          <button 
            onClick={retrocederPaso} 
            disabled={isSaving || estaCargando} 
            className={`px-8 py-4 font-black uppercase tracking-widest text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed ${pasoActual === 1 ? 'invisible' : ''}`}
          >
            Atrás
          </button>
          
          {pasoActual < totalPasos ? (
            <button 
              onClick={avanzarPaso} 
              disabled={isSaving || estaCargando} 
              className="px-10 py-5 bg-cyan-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSaving && <Loader2 className="animate-spin mr-2 text-white" />}
              {isSaving ? 'Guardando...' : 'Siguiente'}
            </button>
          ) : (
            <button 
              onClick={sincronizar} 
              disabled={estaCargando || isSaving} 
              className="px-12 py-5 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {estaCargando || isSaving ? <Loader2 className="animate-spin mr-2 text-white" /> : <Rocket className="mr-2 text-white" />}
              {estaCargando || isSaving ? 'Guardando...' : (isEditMode ? 'Actualizar' : 'Finalizar Ritual')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// --- SUBCOMPONENTES ---

function SeccionIdentidad({ datos, setDatos, theme }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
      <div className="space-y-4 md:col-span-2">
        <h2 className="text-4xl font-black italic uppercase leading-none">Identidad y El Gran Porqué</h2>
        <p className="text-slate-500 text-sm">Define quién eres y qué fuego te impulsa a levantarte cada día.</p>
      </div>

      <div className="space-y-8">
        <Input label="Nombre de Guerrero" placeholder="Ej. Martin" value={datos.nombre} onChange={(v: any) => setDatos({ nombre: v })} icon={<User />} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Edad" type="number" value={datos.edad} onChange={(v: any) => setDatos({ edad: v })} />
          <Input label="Zona Horaria" value={datos.timezone} onChange={(v: any) => setDatos({ timezone: v })} />
        </div>
        <Input label="Profesión / Especialidad" value={datos.profesion} onChange={(v: any) => setDatos({ profesion: v })} icon={<Briefcase />} />
        
        <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl space-y-4">
          <h3 className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">Estado Financiero Actual</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Ingreso Actual (USD)" type="number" value={datos.ingreso_actual} onChange={(v: any) => setDatos({ ingreso_actual: v })} icon={<DollarSign />} />
            <Input label="Meta 90d (USD)" type="number" value={datos.ingreso_meta_90d} onChange={(v: any) => setDatos({ ingreso_meta_90d: v })} icon={<Target />} />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Textarea 
          label="El Manifiesto del Guerrero (Tu Gran Porqué)" 
          placeholder="Escribe aquí la razón profunda por la que haces todo esto... (Ej. Mi familia, mi libertad, mi legado)"
          value={datos.motivaciones} 
          onChange={(v: any) => setDatos({ motivaciones: v })} 
        />
        <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
          <p className="text-xs text-slate-500 italic leading-relaxed">
            "Cuando el 'Por qué' es lo suficientemente fuerte, el 'Cómo' se vuelve irrelevante." 
            Este manifiesto será lo que el Oráculo te recordará en tus momentos de mayor debilidad.
          </p>
        </div>
      </div>
    </div>
  );
}


function SeccionHorarios({ datos, setDatos, theme }: any) {
  const addBlock = (cat: string) => setDatos({ bloques: [...datos.bloques, { day_of_week: 1, start_time: '09:00', end_time: '11:00', activity_name: '', category: cat }] });
  const removeBlock = (index: number) => setDatos({ bloques: datos.bloques.filter((_: any, i: number) => i !== index) });

  const categorias = ['🌅 Mañana', '💻 Bloque 1', '🥗 Tarde', '💻 Bloque 2', '🌙 Noche'];

  return (
    <div className="space-y-12">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-5xl font-black italic uppercase leading-none">Horarios Maestros</h2>
          <p className="text-slate-500 mt-4 font-medium">Diseña tu rutina de alto rendimiento. El Oráculo vigila cada minuto.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-12">
        {categorias.map(cat => (
          <div key={cat} className="space-y-6">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <h3 className="text-xl font-black text-cyan-400 uppercase tracking-tighter italic">{cat}</h3>
              <button onClick={() => addBlock(cat)} className="p-2 bg-white/5 hover:bg-cyan-500/20 text-cyan-500 rounded-lg transition-all"><Plus className="w-4 h-4" /></button>
            </div>
            
            <div className="space-y-4">
              {datos.bloques.filter((b: any) => b.category === cat).map((b: any, realIndex: number) => {
                const index = datos.bloques.indexOf(b);
                return (
                  <div key={index} className={`flex flex-wrap md:flex-nowrap gap-4 p-5 rounded-2xl border transition-all ${theme === 'dark' ? 'bg-white/5 border-white/5 focus-within:border-cyan-500/30' : 'bg-slate-50 border-slate-100 focus-within:border-cyan-200'}`}>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <input type="time" value={b.start_time} onChange={e => {
                        const blks = [...datos.bloques]; blks[index].start_time = e.target.value; setDatos({ bloques: blks });
                      }} className="bg-transparent border-none outline-none font-bold text-sm" />
                      <span className="text-slate-600">-</span>
                      <input type="time" value={b.end_time} onChange={e => {
                        const blks = [...datos.bloques]; blks[index].end_time = e.target.value; setDatos({ bloques: blks });
                      }} className="bg-transparent border-none outline-none font-bold text-sm" />
                    </div>
                    
                    <input 
                      type="text" 
                      placeholder="Nombre de la actividad..." 
                      value={b.activity_name} 
                      onChange={e => {
                        const blks = [...datos.bloques]; blks[index].activity_name = e.target.value; setDatos({ bloques: blks });
                      }} 
                      className="flex-1 bg-transparent border-none outline-none font-black text-lg placeholder:text-slate-700" 
                    />

                    <button onClick={() => removeBlock(index)} className="text-slate-700 hover:text-rose-500 transition-colors"><Trash2 className="w-5 h-5" /></button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Reglas de Oro */}
      <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-500/10 space-y-4">
        <h3 className="text-amber-500 font-black uppercase tracking-[0.2em] text-xs flex items-center gap-2">
          <Zap className="w-4 h-4" /> Reglas de Oro para la Felicidad
        </h3>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <li className="flex gap-3">
            <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 shrink-0" />
            <p className="text-sm text-slate-400 font-medium"><b>Estudio sin PC:</b> Usa el celular para Duolingo o leer en la terraza. Cambiar de postura libera al cerebro.</p>
          </li>
          <li className="flex gap-3">
            <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 shrink-0" />
            <p className="text-sm text-slate-400 font-medium"><b>Domingo Sagrado:</b> Cero oficina. Conecta con tu ukelele, tus plantas y tu familia.</p>
          </li>
          <li className="flex gap-3">
            <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 shrink-0" />
            <p className="text-sm text-slate-400 font-medium"><b>Eficiencia &gt; Horas:</b> Si terminas tus ventas antes de las 10 PM, ¡apaga la PC y vete! Premia tu velocidad.</p>
          </li>
        </ul>
      </div>
    </div>
  );
}


function SeccionArsenal({ datos, setDatos, theme }: any) {
  const addSkill = () => setDatos({ skills: [...datos.skills, { name: '', level: 'Intermedio', priority: 'Media' }] });
  const removeSkill = (index: number) => setDatos({ skills: datos.skills.filter((_: any, i: number) => i !== index) });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-black italic uppercase">Habilidades (Arsenal)</h2>
          <p className="text-slate-500 text-sm mt-2">Define tus herramientas de poder y qué tanto quieres enfocarte en ellas.</p>
        </div>
        <button onClick={addSkill} className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl hover:bg-cyan-500 hover:text-white transition-all"><Plus /></button>
      </div>

      <div className="space-y-4">
        {datos.skills.map((s: any, i: number) => (
          <div key={i} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-6 bg-white/5 rounded-3xl border border-white/5 items-center relative group">
            <div className="md:col-span-5 space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-600 tracking-widest ml-1">Nombre de la Habilidad</label>
              <input 
                placeholder="Ej. n8n, Inglés, IA..." 
                value={s.name} 
                onChange={e => {
                  const ss = [...datos.skills]; ss[i].name = e.target.value; setDatos({ skills: ss });
                }} 
                className="w-full bg-transparent border-none outline-none font-bold text-lg placeholder:text-slate-700" 
              />
            </div>

            <div className="md:col-span-3 space-y-1">
              <label className="text-[9px] font-black uppercase text-emerald-500/50 tracking-widest ml-1">Nivel (Maestría)</label>
              <select 
                value={s.level} 
                onChange={e => {
                  const ss = [...datos.skills]; ss[i].level = e.target.value; setDatos({ skills: ss });
                }} 
                className="w-full bg-transparent font-bold text-emerald-400 outline-none cursor-pointer"
              >
                <option className="bg-[#0F172A]">Básico</option>
                <option className="bg-[#0F172A]">Intermedio</option>
                <option className="bg-[#0F172A]">Avanzado</option>
              </select>
            </div>

            <div className="md:col-span-3 space-y-1">
              <label className="text-[9px] font-black uppercase text-amber-500/50 tracking-widest ml-1">Prioridad (Enfoque)</label>
              <select 
                value={s.priority} 
                onChange={e => {
                  const ss = [...datos.skills]; ss[i].priority = e.target.value; setDatos({ skills: ss });
                }} 
                className="w-full bg-transparent font-bold text-amber-400 outline-none cursor-pointer"
              >
                <option className="bg-[#0F172A]">Baja</option>
                <option className="bg-[#0F172A]">Media</option>
                <option className="bg-[#0F172A]">Alta</option>
              </select>
            </div>

            <div className="md:col-span-1 flex justify-end">
              <button onClick={() => removeSkill(i)} className="text-slate-700 hover:text-rose-500 transition-colors p-2">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


function SeccionMetasYMarca({ datos, setDatos, theme }: any) {
  const [nuevoPilar, setNuevoPilar] = useState('');

  const PILARES_SUGERIDOS = [
    "n8n & Automatizaciones",
    "Desarrollo de IA (Vibe Coding)",
    "PostgreSQL & Supabase",
    "Indie Hacking & SaaS",
    "Hábitos y Productividad",
    "Desarrollo Frontend (Next.js)",
    "Growth & Marca Personal"
  ];

  const PLATAFORMAS_SUGERIDAS = [
    "YouTube",
    "LinkedIn",
    "TikTok",
    "Instagram",
    "GitHub",
    "Twitter / X"
  ];

  const togglePlataforma = (plat: string) => {
    const active = datos.plataformas.includes(plat)
      ? datos.plataformas.filter((p: string) => p !== plat)
      : [...datos.plataformas, plat];
    setDatos({ plataformas: active });
  };

  const addPilar = (pilar: string) => {
    const trimmed = pilar.trim();
    if (trimmed && !datos.pilares.includes(trimmed)) {
      setDatos({ pilares: [...datos.pilares, trimmed] });
    }
  };

  const removePilar = (pilar: string) => {
    setDatos({ pilares: datos.pilares.filter((p: string) => p !== pilar) });
  };

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-4xl font-black italic uppercase leading-none">Marca y Visión de Futuro</h2>
        <p className="text-slate-500 text-sm mt-2">Cómo te ve el mundo y hacia dónde te diriges.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Textarea label="Metas 90 Días (Corto Plazo)" value={datos.metas_90d} onChange={(v: any) => setDatos({ metas_90d: v })} />
        <Textarea label="Metas 1 Año (Medio Plazo)" value={datos.metas_1y} onChange={(v: any) => setDatos({ metas_1y: v })} />
        <Textarea label="Metas 3 Años (Visión Legendaria)" value={datos.metas_3y} onChange={(v: any) => setDatos({ metas_3y: v })} />
      </div>

      {/* Grid de Marca Personal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 bg-white/5 rounded-[2.5rem] border border-white/5">
        
        {/* Columna Izquierda: Nicho y Plataformas */}
        <div className="space-y-6">
          <Input 
            label="Nicho / Estrategia (¿A quién hablas?)" 
            placeholder="Ej. Automatización IA para Dueños de Agencia"
            value={datos.nicho} 
            onChange={(v: any) => setDatos({ nicho: v })} 
          />

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] ml-2">Plataformas de Publicación</label>
            <div className="flex flex-wrap gap-2">
              {PLATAFORMAS_SUGERIDAS.map(plat => {
                const isActive = datos.plataformas.includes(plat);
                return (
                  <button
                    key={plat}
                    type="button"
                    onClick={() => togglePlataforma(plat)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                      isActive 
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 font-extrabold shadow-sm' 
                        : 'bg-white/5 border-white/5 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {plat}
                  </button>
                );
              })}
            </div>
          </div>

          <Input 
            label="Frecuencia de Publicación (Compromiso)" 
            placeholder="Ej. 3 veces por semana (Lun-Mie-Vie)"
            value={datos.frecuencia} 
            onChange={(v: any) => setDatos({ frecuencia: v })} 
          />
        </div>

        {/* Columna Derecha: Pilares de Contenido */}
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] ml-2">Tus Pilares de Contenido</label>
            
            {/* Input Personalizado */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Añadir pilar personalizado..."
                value={nuevoPilar}
                onChange={e => setNuevoPilar(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (nuevoPilar.trim()) {
                      addPilar(nuevoPilar);
                      setNuevoPilar('');
                    }
                  }
                }}
                className="flex-1 px-5 py-3 bg-white/5 border border-white/5 rounded-xl outline-none focus:border-cyan-500/30 text-sm font-semibold"
              />
              <button
                type="button"
                onClick={() => {
                  if (nuevoPilar.trim()) {
                    addPilar(nuevoPilar);
                    setNuevoPilar('');
                  }
                }}
                className="px-4 bg-cyan-500 text-white rounded-xl font-bold text-xs uppercase hover:bg-cyan-600 transition-colors"
              >
                Añadir
              </button>
            </div>

            {/* Listado de Pilares Activos */}
            <div className="flex flex-wrap gap-2 min-h-[40px] p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
              {datos.pilares.length === 0 ? (
                <span className="text-xs text-slate-600 italic">No hay pilares agregados. Selecciona abajo o escribe uno.</span>
              ) : (
                datos.pilares.map((pilar: string) => (
                  <span
                    key={pilar}
                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-lg text-xs font-black"
                  >
                    {pilar}
                    <button
                      type="button"
                      onClick={() => removePilar(pilar)}
                      className="ml-1 text-slate-500 hover:text-rose-400 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Sugerencias Rápidas */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-black uppercase text-slate-600 tracking-wider ml-1">Sugerencias Rápidas:</span>
              <div className="flex flex-wrap gap-1.5">
                {PILARES_SUGERIDOS.filter(p => !datos.pilares.includes(p)).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => addPilar(p)}
                    className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-[10px] text-slate-400 hover:text-slate-300 rounded-lg border border-white/5 transition-all"
                  >
                    + {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sección Enfoque de Proyectos/Retos - Expansión Completa */}
        <div className="md:col-span-2 space-y-3 pt-4 border-t border-white/5">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-cyan-400 tracking-[0.3em] ml-2 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> Enfoque de Proyectos & Retos de Marca
            </label>
            <p className="text-[11px] text-slate-500 ml-2">Explica al Oráculo detalladamente qué tipo de automatizaciones, código o experimentos deseas construir en tus campañas de 48 horas para que se alinee perfectamente con tus pilares.</p>
          </div>
          <textarea
            value={datos.enfoque_proyectos}
            onChange={e => setDatos({ enfoque_proyectos: e.target.value })}
            placeholder="Ej. Quiero grabarme creando automatizaciones reales en n8n aplicadas a casos de negocios (como agencias, e-commerce, o marketing), explicando de forma transparente mi lógica, errores comunes, y compartiendo el JSON del workflow para aportar valor brutal a mi comunidad..."
            className="w-full px-6 py-4 bg-white/5 border border-white/5 rounded-2xl outline-none focus:border-cyan-500/30 text-sm font-medium min-h-[100px] resize-none text-slate-200"
          />
        </div>

        {/* Calibración Visual Zen-Tech */}
        {datos.nicho && (
          <div className="md:col-span-2 p-5 bg-gradient-to-r from-cyan-500/5 to-indigo-500/5 border border-cyan-500/10 rounded-[1.5rem] flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0 border border-cyan-500/20 text-cyan-400">
              <Target className="w-5 h-5 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase tracking-wider text-cyan-400">Alineación del Oráculo Lista</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                El chatbot del Oráculo leerá este contexto y forjará retos de marca para <span className="text-slate-300 font-semibold">{datos.plataformas.join(', ') || 'tus plataformas'}</span> enfocados en tu nicho <span className="text-slate-300 font-semibold">"{datos.nicho}"</span> y guiados por tus pilares <span className="text-slate-300 font-semibold">({datos.pilares.join(', ') || 'sin definir'})</span>.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}


function SeccionDemonios({ datos, setDatos, theme }: any) {
  const toggleDemon = (d: string) => {
    const act = datos.demonios_activos.includes(d) 
      ? datos.demonios_activos.filter((x: any) => x !== d)
      : [...datos.demonios_activos, d];
    setDatos({ demonios_activos: act });
  };

  return (
    <div className="space-y-8">
      <h2 className="text-4xl font-black italic uppercase">Demonios y Voto</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {['pornografía', 'LoL excesivo', 'procrastinación', 'azúcar'].map(d => (
          <button key={d} onClick={() => toggleDemon(d)} className={`p-6 rounded-3xl border-2 transition-all font-bold uppercase text-xs tracking-widest ${datos.demonios_activos.includes(d) ? 'bg-rose-500/20 border-rose-500 text-rose-400' : 'bg-white/5 border-white/5 text-slate-500'}`}>
            {d}
          </button>
        ))}
      </div>
    </div>
  );
}


// --- UI HELPERS ---
function Input({ label, value, onChange, type = "text", icon }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] ml-2">{label}</label>
      <div className="relative">
        {icon && <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500">{icon}</div>}
        <input type={type} value={value} onChange={e => onChange(e.target.value)} className={`w-full ${icon ? 'pl-16' : 'px-8'} py-5 bg-white/5 border border-white/5 rounded-2xl outline-none focus:border-cyan-500/30 font-bold transition-all`} />
      </div>
    </div>
  );
}

function Textarea({ label, value, onChange }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] ml-2">{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} className="w-full px-8 py-6 bg-white/5 border border-white/5 rounded-3xl outline-none focus:border-cyan-500/30 font-medium min-h-[120px] resize-none" />
    </div>
  );
}
