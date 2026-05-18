"use client"

import { useState, useEffect, useCallback, type FormEvent } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useHabitStore, type Habit } from "../store/useHabitStore"
import {
  Plus,
  Check,
  Star,
  Dumbbell,
  BookOpen,
  Bed,
  Droplet,
  Leaf,
  Brain,
  Sun,
  Moon,
  Zap,
  Code,
  Music,
  Heart,
  Trash2,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  star: Star,
  dumbbell: Dumbbell,
  book: BookOpen,
  bed: Bed,
  droplet: Droplet,
  leaf: Leaf,
  brain: Brain,
  sun: Sun,
  moon: Moon,
  zap: Zap,
  code: Code,
  music: Music,
  heart: Heart,
  sparkles: Sparkles,
}

const COLOR_MAP: Record<string, { bg: string; text: string; ring: string; dot: string }> = {
  amber: { bg: "bg-amber-950/40", text: "text-amber-400", ring: "ring-amber-500/30", dot: "bg-amber-400" },
  emerald: { bg: "bg-emerald-950/40", text: "text-emerald-400", ring: "ring-emerald-500/30", dot: "bg-emerald-400" },
  sky: { bg: "bg-sky-950/40", text: "text-sky-400", ring: "ring-sky-500/30", dot: "bg-sky-400" },
  violet: { bg: "bg-violet-950/40", text: "text-violet-400", ring: "ring-violet-500/30", dot: "bg-violet-400" },
  rose: { bg: "bg-rose-950/40", text: "text-rose-400", ring: "ring-rose-500/30", dot: "bg-rose-400" },
  teal: { bg: "bg-teal-950/40", text: "text-teal-400", ring: "ring-teal-500/30", dot: "bg-teal-400" },
}

const DEFAULT_HABITS: Habit[] = [
  { id: "1", name: "Morning Workout", description: "30 min exercise", frequency: "daily", pkdValue: 25, icon: "dumbbell", color: "amber", isActive: false },
  { id: "2", name: "Read 20 Pages", description: "Any book counts", frequency: "daily", pkdValue: 15, icon: "book", color: "sky", isActive: false },
  { id: "3", name: "Meditate", description: "10 min mindfulness", frequency: "daily", pkdValue: 20, icon: "brain", color: "violet", isActive: false },
  { id: "4", name: "Drink 2L Water", description: "Stay hydrated", frequency: "daily", pkdValue: 10, icon: "droplet", color: "teal", isActive: false },
  { id: "5", name: "Sleep 7+ Hours", description: "Quality rest", frequency: "daily", pkdValue: 30, icon: "moon", color: "violet", isActive: false },
]

export default function HabitTracker() {
  const {
    habits,
    balance,
    pendingRewards,
    userId,
    addHabit,
    toggleHabit,
    setHabits,
    loadHabitsFromCloud,
  } = useHabitStore()

  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState("")
  const [newPkd, setNewPkd] = useState(10)
  const [newIcon, setNewIcon] = useState("star")
  const [newColor, setNewColor] = useState("amber")
  const [seeded, setSeeded] = useState(false)

  // Load habits from cloud on mount, fall back to defaults
  useEffect(() => {
    if (!userId || seeded) return

    async function init() {
      await loadHabitsFromCloud()
      const current = useHabitStore.getState().habits
      if (current.length === 0) {
        setHabits(DEFAULT_HABITS)
      }
      setSeeded(true)
    }
    init()
  }, [userId, seeded, loadHabitsFromCloud, setHabits])

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault()
      if (!newName.trim()) return
      addHabit({
        id: crypto.randomUUID(),
        name: newName.trim(),
        description: "",
        frequency: "daily",
        pkdValue: newPkd,
        icon: newIcon,
        color: newColor,
        isActive: false,
      })
      setNewName("")
      setNewPkd(10)
      setShowAdd(false)
    },
    [newName, newPkd, newIcon, newColor, addHabit]
  )

  const completedCount = habits.filter((h) => !h.isActive).length
  const activeHabits = habits.filter((h) => h.isActive)

  return (
    <div className="w-full max-w-md mx-auto">
      <motion.div
        className="relative overflow-hidden rounded-2xl bg-zinc-900/80 border border-zinc-800/50 p-6 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-full blur-2xl" />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-1">PKD Balance</p>
            <p className="text-3xl font-bold text-amber-400 font-mono tabular-nums">{balance.toLocaleString()}</p>
            <p className="text-xs text-zinc-500 mt-1">{completedCount} / {habits.length} habits today</p>
          </div>
          <motion.div
            className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="w-6 h-6 text-amber-400" />
          </motion.div>
        </div>
        {pendingRewards > 0 && (
          <motion.div className="mt-4 flex items-center gap-2 text-xs text-amber-400/80 font-mono" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Zap className="w-3 h-3" /> {pendingRewards} reward{pendingRewards > 1 ? "s" : ""} pending sync
          </motion.div>
        )}
      </motion.div>

      <div className="space-y-2 mb-4">
        <AnimatePresence>
          {activeHabits.map((habit) => {
            const Icon = ICON_MAP[habit.icon] ?? Star
            const colors = COLOR_MAP[habit.color] ?? COLOR_MAP.amber
            return (
              <motion.button
                key={habit.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                onClick={() => toggleHabit(habit.id)}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 text-left group",
                  colors.bg, colors.ring, "border-zinc-800/50 hover:border-zinc-700/50"
                )}
              >
                <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors", `border-${habit.color}-500/40`)}>
                  <motion.div className={cn("w-2.5 h-2.5 rounded-full", colors.dot)} initial={false} animate={{ scale: 0 }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-200 truncate">{habit.name}</p>
                  <p className="text-xs text-zinc-500">+{habit.pkdValue} PKD</p>
                </div>
                <Icon className={cn("w-4 h-4 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity", colors.text)} />
              </motion.button>
            )
          })}
        </AnimatePresence>
      </div>

      {completedCount > 0 && (
        <div className="mb-4">
          <p className="text-xs text-zinc-600 font-mono uppercase tracking-wider mb-2 px-1">Completed</p>
          <div className="space-y-1">
            {habits.filter((h) => !h.isActive).map((habit) => {
              const Icon = ICON_MAP[habit.icon] ?? Star
              const colors = COLOR_MAP[habit.color] ?? COLOR_MAP.amber
              return (
                <div key={habit.id} className="flex items-center gap-3 px-4 py-2 rounded-lg opacity-40">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-sm text-zinc-400 truncate flex-1 line-through">{habit.name}</span>
                  <Icon className={cn("w-3.5 h-3.5 shrink-0", colors.text)} />
                </div>
              )
            })}
          </div>
        </div>
      )}

      <AnimatePresence>
        {showAdd && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="overflow-hidden mb-3"
          >
            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
              <input type="text" placeholder="Habit name..." value={newName} onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-amber-500/50" autoFocus />
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-zinc-500 mb-1 block">PKD Value</label>
                  <input type="number" value={newPkd} onChange={(e) => setNewPkd(Number(e.target.value))} min={1} max={100}
                    className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-amber-500/50" />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Color</label>
                  <div className="flex gap-1.5">
                    {Object.keys(COLOR_MAP).slice(0, 4).map((c) => (
                      <button key={c} type="button" onClick={() => setNewColor(c)}
                        className={cn("w-7 h-7 rounded-full border-2 transition-all", newColor === c ? "border-white scale-110" : "border-transparent", COLOR_MAP[c]?.dot)} />
                    ))}
                  </div>
                </div>
              </div>
              <button type="submit" className="w-full py-2 rounded-lg bg-amber-500/20 text-amber-400 text-sm font-medium hover:bg-amber-500/30 transition-colors">
                Add Habit
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <button onClick={() => setShowAdd(!showAdd)}
        className={cn("w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed transition-all text-sm",
          showAdd ? "border-zinc-700 text-zinc-500" : "border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700")}>
        <Plus className="w-4 h-4" /> {showAdd ? "Cancel" : "New Habit"}
      </button>
    </div>
  )
}
