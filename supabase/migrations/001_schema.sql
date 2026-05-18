-- ============================================================
-- Pokémon Johto LifeSync — Supabase Schema v1
-- Run this in the Supabase SQL Editor (or via migration)
-- ============================================================

-- 1. PROFILES: extended user data linked to auth.users
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT NOT NULL DEFAULT '',
  pkd_balance   INTEGER NOT NULL DEFAULT 100,    -- starting PKD
  badges        SMALLINT NOT NULL DEFAULT 0,     -- 0-16 badges
  current_save_url TEXT,                         -- URL to latest .sav in Storage
  game_flags     JSONB DEFAULT '{}',             -- sync'd flags as {flag_id: true/false}
  game_vars      JSONB DEFAULT '{}',             -- sync'd vars as {var_id: value}
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. HABITS: habit templates (global, not per-user yet)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.habits (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT DEFAULT '',
  frequency     TEXT NOT NULL DEFAULT 'daily',   -- daily | weekly | custom
  pkd_value     INTEGER NOT NULL DEFAULT 10,     -- PKD earned per completion
  icon          TEXT DEFAULT 'star',             -- lucide icon name
  color         TEXT DEFAULT 'amber',            -- tailwind color
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. HABIT_LOGS: each habit completion event
-- ============================================================
CREATE TABLE IF NOT EXISTS public.habit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id      UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  pkd_earned    INTEGER NOT NULL,                -- how much PKD this completion gave
  completed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes         TEXT DEFAULT ''
);

-- 4. REWARD_QUEUE: pending rewards to sync to .sav
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reward_queue (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_type   TEXT NOT NULL,                   -- pkd | flag_set | flag_clear | item
  payload       JSONB NOT NULL,                  -- { amount: 50 } or { flag_id: 0x867 }
  is_claimed    BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  claimed_at    TIMESTAMPTZ
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_habits_user       ON public.habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_user   ON public.habit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_date   ON public.habit_logs(completed_at);
CREATE INDEX IF NOT EXISTS idx_reward_queue_user ON public.reward_queue(user_id, is_claimed);

-- ============================================================
-- HELPER FUNCTION: update profile timestamp
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated ON public.profiles;
CREATE TRIGGER trg_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Profiles: user can only read/write their own
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Habits: user owns their habits
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own habits"
  ON public.habits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own habits"
  ON public.habits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habits"
  ON public.habits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own habits"
  ON public.habits FOR DELETE
  USING (auth.uid() = user_id);

-- Habit logs
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own logs"
  ON public.habit_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logs"
  ON public.habit_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Reward queue
ALTER TABLE public.reward_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rewards"
  ON public.reward_queue FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rewards"
  ON public.reward_queue FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rewards"
  ON public.reward_queue FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================
-- STORAGE BUCKETS (run separately in Supabase Dashboard)
-- ============================================================
-- Create a bucket named 'save-states' for .sav files
-- INSERT INTO storage.buckets (id, name, public) VALUES ('save-states', 'save-states', false);
--
-- RLS for storage:
-- CREATE POLICY "Users can access own saves"
--   ON storage.objects FOR ALL
--   USING (auth.uid()::text = (storage.foldername(name))[1]);
