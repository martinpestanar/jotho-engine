"use client"

import { create } from "zustand"
import { supabase } from "@/shared/lib/supabase/client"

interface Routine {
    mañana: string
    tarde: string
    noche: string
}

interface LifePlan {
    id: string
    usuario_id: string
    nombre_entrenador: string
    edad: number
    profesion_actual: string
    nivel_rigurosidad: string
    rutina_manana: string
    rutina_tarde: string
    rutina_noche: string
    meta_ingreso_mensual: number
    herramienta_primordial: string
    herramienta_secundaria: string
    meta_trimestral: string
    meta_anual: string
    motor_principal: string
    obstaculo_principal: string
    plan_vida_libre: string
    avatar_id: string
    fecha_ultima_actualizacion: string
    // Legacy fields for backward compatibility
    routine_base?: Routine
    quarterly_goals?: string[]
    annual_goals?: string[]
    financial_goal?: number
}

interface UserStatus {
    ether_battery: number
    trading_locked_until: string | null
    is_onboarding_completed: boolean
    last_pokemon_gift_at: string | null
}

interface PerfilVida {
    id: string
    nombre_entrenador: string
    edad: number
    profesion_actual: string
    nivel_rigurosidad: string
    rutina_manana: string
    rutina_tarde: string
    rutina_noche: string
    meta_ingreso_mensual: number
    herramienta_primordial: string
    herramienta_secundaria: string
    meta_trimestral: string
    meta_anual: string
    motor_principal: string
    obstaculo_principal: string
    plan_vida_libre: string
    avatar_id: string
}

interface LootItem {
    id: string
    name: string
    category: string
    rarity: string
    description: string
    image_url: string
    quantity: number
    status: string
    id_interno_gba?: number
    master_id?: string
}

interface OracleState {
    lifePlan: LifePlan | null
    userStatus: UserStatus | null
    perfilVida: PerfilVida | null
    inventory: LootItem[]
    pokedex: any[]
    isLoading: boolean

    fetchLifePlan: () => Promise<void>
    fetchUserStatus: () => Promise<void>
    fetchPerfilVida: () => Promise<void>
    fetchInventory: () => Promise<void>
    fetchPokedex: () => Promise<void>
    updateLifePlan: (plan: Partial<LifePlan>) => Promise<void>
    completeOnboarding: () => Promise<void>
}

export const useOracleStore = create<OracleState>((set, get) => ({
    lifePlan: null,
    userStatus: null,
    perfilVida: null,
    inventory: [],
    pokedex: [],
    isLoading: false,

    fetchLifePlan: async () => {
        if (!supabase) return
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase.rpc('fn_leer_plan_vida', { 
            p_user_id: user.id 
        })

        if (!error && data && data.length > 0) {
            set({ lifePlan: data[0] })
        }
    },

    fetchUserStatus: async () => {
        if (!supabase) return
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
            .from("user_status")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle()

        if (!error && data) {
            set({ userStatus: data })
        }
    },

    fetchPerfilVida: async () => {
        if (!supabase) return
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
            .from("perfil_vida")
            .select("*")
            .eq("usuario_id", user.id)
            .maybeSingle()

        if (!error && data) {
            set({ perfilVida: data })
        }
    },

    fetchInventory: async () => {
        if (!supabase) return
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // 1. Fetch Meta Items (user_inventory)
        const { data: itemsData, error: itemsError } = await supabase
            .from("user_inventory")
            .select(`
                id,
                quantity,
                status,
                master_loot (
                    id, name, category, rarity, description, image_url, id_interno_gba
                )
            `)
            .eq("user_id", user.id)

        let formattedItems: any[] = []
        if (!itemsError && itemsData) {
            formattedItems = itemsData.map((item: any) => ({
                ...item.master_loot,
                id: `loot-${item.id}`,
                quantity: item.quantity,
                status: item.status,
                id_interno_gba: item.master_loot.id_interno_gba,
                master_id: item.master_loot.id
            }))
        }

        // 2. Fetch Game Items (inventario_usuario)
        const { data: gameItemsData, error: gameItemsError } = await supabase
            .from("inventario_usuario")
            .select(`
                id,
                cantidad,
                master_objetos (
                    id, id_interno_gba, nombre_es, categoria, descripcion_es, sprite_url
                )
            `)
            .eq("usuario_id", user.id)

        let formattedGameItems: any[] = []
        if (!gameItemsError && gameItemsData) {
            formattedGameItems = gameItemsData.map((item: any) => {
                // Map DB category to UI category
                let uiCategory = "Objetos"
                if (item.master_objetos.categoria === "Poké Ball") uiCategory = "Poké Balls"
                if (item.master_objetos.categoria === "Bayas") uiCategory = "Bayas"

                return {
                    id: `game-${item.id}`,
                    name: item.master_objetos.nombre_es,
                    category: uiCategory,
                    rarity: "Común",
                    description: item.master_objetos.descripcion_es,
                    image_url: item.master_objetos.sprite_url,
                    quantity: item.cantidad,
                    status: "Normal",
                    master_id: item.master_objetos.id,
                    id_interno_gba: item.master_objetos.id_interno_gba
                }
            })
        }

        // 3. Fetch Pokemon (equipo_pokemon_usuario)
        const { data: pokemonData, error: pokemonError } = await supabase
            .from("equipo_pokemon_usuario")
            .select(`
                id,
                pokemon_id,
                es_shiny,
                master_pokemon (
                    id,
                    id_interno_gba,
                    nombre_es,
                    sprite_url,
                    descripcion_pokedex,
                    habitat,
                    anime_lore,
                    curiosities,
                    base_stats
                )
            `)
            .eq("usuario_id", user.id)

        let formattedPokemon: any[] = []
        if (!pokemonError && pokemonData) {
            formattedPokemon = pokemonData.map((p: any) => {
                const isShiny = p.es_shiny;
                const pokemonName = p.master_pokemon.nombre_es.toLowerCase().replace(/[^a-z0-9]/g, '');
                
                const sprite = isShiny 
                    ? `https://play.pokemonshowdown.com/sprites/gen5ani-shiny/${pokemonName}.gif`
                    : `https://play.pokemonshowdown.com/sprites/gen5ani/${pokemonName}.gif`;
                
                return {
                    id: `pokemon-${p.id}`,
                    name: p.master_pokemon.nombre_es + (isShiny ? " ⭐" : ""),
                    category: "Refugio Pokémon",
                    rarity: isShiny ? "Legendario" : "Raro",
                    description: p.master_pokemon.descripcion_pokedex || "Un compañero Pokémon leal.",
                    image_url: sprite,
                    quantity: 1,
                    status: "Compañero",
                    habitat: p.master_pokemon.habitat,
                    anime_lore: p.master_pokemon.anime_lore,
                    curiosities: p.master_pokemon.curiosities,
                    base_stats: p.master_pokemon.base_stats,
                    master_id: p.master_pokemon.id,
                    id_interno_gba: p.master_pokemon.id_interno_gba,
                    shiny: isShiny
                }
            })
        }

        set({ inventory: [...formattedItems, ...formattedGameItems, ...formattedPokemon] })
    },

    updateLifePlan: async (plan) => {
        if (!supabase) return
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { error } = await (supabase.from("life_plan") as any)
            .upsert({ ...plan, user_id: user.id })

        if (!error) {
            await get().fetchLifePlan()
        }
    },

    fetchPokedex: async () => {
        set({ isLoading: true })
        try {
            if (!supabase) return
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // 1. Obtener TODO el catálogo maestro
            const { data: allPokemon, error: masterError } = await supabase
                .from("master_pokemon")
                .select("*")
                .order("id_interno_gba", { ascending: true })

            // 2. Obtener IDs de Pokémon capturados por el usuario
            const { data: caughtData, error: caughtError } = await supabase
                .from("equipo_pokemon_usuario")
                .select("pokemon_id")
                .eq("usuario_id", user.id)

            if (allPokemon) {
                const caughtIds = new Set(caughtData?.map(c => c.pokemon_id) || [])
                
                const formattedPokedex = allPokemon.map(p => {
                    const isCaught = caughtIds.has(p.id)
                    const pokemonName = p.nombre_es.toLowerCase().replace(/[^a-z0-9]/g, '')
                    
                    return {
                        ...p,
                        isCaught,
                        image_url: `https://play.pokemonshowdown.com/sprites/gen5ani/${pokemonName}.gif`,
                        description: p.descripcion_pokedex
                    }
                })
                
                set({ pokedex: formattedPokedex })
            }
        } finally {
            set({ isLoading: false })
        }
    },

    completeOnboarding: async () => {
        if (!supabase) return
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { error } = await (supabase.from("user_status") as any)
            .update({ is_onboarding_completed: true })
            .eq("user_id", user.id)

        if (!error) {
            set((s) => ({ userStatus: s.userStatus ? { ...s.userStatus, is_onboarding_completed: true } : null }))
        }
    }
}))

