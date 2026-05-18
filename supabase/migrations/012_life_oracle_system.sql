-- Migration: 012_life_oracle_system.sql
-- Description: Adds tables for Life Plan, Master Loot, User Inventory, and User Status.

-- 1. Create Tables

-- Life Plan: Stores the 90-day sync data
CREATE TABLE IF NOT EXISTS public.life_plan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    routine_base JSONB DEFAULT '{}'::jsonb,
    quarterly_goals JSONB DEFAULT '[]'::jsonb,
    annual_goals JSONB DEFAULT '[]'::jsonb,
    financial_goal NUMERIC DEFAULT 0,
    last_sync_at TIMESTAMPTZ DEFAULT now(),
    next_sync_available_at TIMESTAMPTZ DEFAULT (now() + interval '90 days'),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Master Loot: Catalog of all possible rewards
CREATE TABLE IF NOT EXISTS public.master_loot (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Objetos', 'Poké Balls', 'Bayas', 'Refugio Pokémon')),
    rarity TEXT NOT NULL CHECK (rarity IN ('Común', 'Raro', 'Épico', 'Legendario')),
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- User Inventory: User's specific items and caught pokemon
CREATE TABLE IF NOT EXISTS public.user_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    loot_id UUID REFERENCES public.master_loot(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'Normal' CHECK (status IN ('Normal', 'Coma')),
    acquired_at TIMESTAMPTZ DEFAULT now()
);

-- User Status: Real-time gameplay state
CREATE TABLE IF NOT EXISTS public.user_status (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    ether_battery INTEGER DEFAULT 100 CHECK (ether_battery >= 0 AND ether_battery <= 100),
    trading_locked_until TIMESTAMPTZ,
    is_onboarding_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable Row Level Security
ALTER TABLE public.life_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_loot ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_status ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies

-- Life Plan
CREATE POLICY "Users can view their own life plan" ON public.life_plan FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own life plan" ON public.life_plan FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own life plan" ON public.life_plan FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Master Loot (Publicly readable)
CREATE POLICY "Master loot is readable by all" ON public.master_loot FOR SELECT USING (true);

-- User Inventory
CREATE POLICY "Users can view their own inventory" ON public.user_inventory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own inventory" ON public.user_inventory FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own inventory" ON public.user_inventory FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User Status
CREATE POLICY "Users can view their own status" ON public.user_status FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own status" ON public.user_status FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own status" ON public.user_status FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Seed Master Loot Data
INSERT INTO public.master_loot (name, category, rarity, description, image_url) VALUES
('Poción', 'Objetos', 'Común', 'Restaura una pequeña cantidad de energía.', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/potion.png'),
('Poké Ball', 'Poké Balls', 'Común', 'Dispositivo para capturar Pokémon salvajes.', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png'),
('Baya Aranja', 'Bayas', 'Común', 'Baya que restaura un poco de salud.', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/oran-berry.png'),
('Super Ball', 'Poké Balls', 'Raro', 'Una Poké Ball de alto rendimiento.', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/great-ball.png'),
('Baya Cidra', 'Bayas', 'Raro', 'Baya que restaura una cantidad moderada de salud.', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/sitrus-berry.png'),
('Ultra Ball', 'Poké Balls', 'Épico', 'Una Poké Ball con una tasa de éxito muy alta.', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/ultra-ball.png'),
('Caramelo Raro', 'Objetos', 'Épico', 'Eleva el nivel de un Pokémon en 1.', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/rare-candy.png'),
('Master Ball', 'Poké Balls', 'Legendario', 'La Poké Ball definitiva. Captura sin fallar.', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/master-ball.png'),
('Pikachu (Shiny)', 'Refugio Pokémon', 'Épico', 'Un Pikachu con un color especial.', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/25.png'),
('Celebi', 'Refugio Pokémon', 'Legendario', 'El guardián del bosque de Johto.', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/251.png');

-- 5. Helper Function to handle status creation on profile create
CREATE OR REPLACE FUNCTION public.handle_new_user_status()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_status (user_id)
    VALUES (new.id);
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for public.profiles (assuming it exists and is linked to auth.users)
-- If profiles table exists, we link it there.
CREATE TRIGGER on_auth_user_created_status
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_status();
