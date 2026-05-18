-- ============================================================
-- Relax RLS for habits table — allow anon/device UUID use
-- Run in Supabase SQL Editor if habit CRUD is blocked by RLS
-- ============================================================

-- Replace old strict policies with relaxed ones
DROP POLICY IF EXISTS "Users can view own habits" ON public.habits;
CREATE POLICY "anon_select_habits" ON public.habits FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own habits" ON public.habits;
CREATE POLICY "anon_insert_habits" ON public.habits FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own habits" ON public.habits;
CREATE POLICY "anon_update_habits" ON public.habits FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can delete own habits" ON public.habits;
CREATE POLICY "anon_delete_habits" ON public.habits FOR DELETE USING (true);
