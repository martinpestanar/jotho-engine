import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ action: string }> }
) {
  const { action } = await params
  const body = await req.json()
  const { userId, ...data } = body

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 })
  }

  try {
    switch (action) {
      case "leer_plan_vida": {
        const { data: plan, error } = await supabaseAdmin
          .from("perfil_vida")
          .select("*")
          .eq("usuario_id", userId)
          .single()
        
        if (error) throw error
        return NextResponse.json(plan)
      }

      case "consultar_recompensas": {
        const { rarity } = data
        let query = supabaseAdmin.from("master_loot").select("*")
        if (rarity) query = query.eq("rarity", rarity)
        
        const { data: rewards, error } = await query
        if (error) throw error
        return NextResponse.json(rewards)
      }

      case "entregar_loot": {
        const { item_id, cantidad = 1 } = data
        
        // Check if item already exists in user's inventory
        const { data: existing } = await supabaseAdmin
            .from("user_inventory")
            .select("*")
            .eq("user_id", userId)
            .eq("loot_id", item_id)
            .single()

        if (existing) {
            const { error } = await supabaseAdmin
                .from("user_inventory")
                .update({ quantity: existing.quantity + cantidad })
                .eq("id", existing.id)
            if (error) throw error
        } else {
            const { error } = await supabaseAdmin
                .from("user_inventory")
                .insert({ user_id: userId, loot_id: item_id, quantity: cantidad })
            if (error) throw error
        }
        
        return NextResponse.json({ success: true })
      }

      case "aplicar_penalidad": {
        const { tipo_penalidad, motivo } = data
        
        if (tipo_penalidad === "LEVE") {
            // Ether Battery -50%
            const { error } = await supabaseAdmin
                .from("user_status")
                .update({ ether_battery: 50 })
                .eq("user_id", userId)
            if (error) throw error
        } else if (tipo_penalidad === "MEDIA") {
            // Trading Lock 24h
            const lockUntil = new Date()
            lockUntil.setHours(lockUntil.getHours() + 24)
            const { error } = await supabaseAdmin
                .from("user_status")
                .update({ trading_locked_until: lockUntil.toISOString() })
                .eq("user_id", userId)
            if (error) throw error
        } else if (tipo_penalidad === "GRAVE") {
            // Pokemon to COMA
            // Pick a random pokemon from inventory and set it to COMA
            const { data: pokemon } = await supabaseAdmin
                .from("user_inventory")
                .select("id")
                .eq("user_id", userId)
                .is("status", "Normal")
                .limit(1)
            
            if (pokemon && pokemon.length > 0) {
                const { error } = await supabaseAdmin
                    .from("user_inventory")
                    .update({ status: "Coma" })
                    .eq("id", pokemon[0].id)
                if (error) throw error
            }
        }
        
        return NextResponse.json({ success: true, applied: tipo_penalidad })
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error: any) {
    console.error("Oracle API Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
