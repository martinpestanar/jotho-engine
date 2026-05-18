/**
 * useInjectionQueue.ts — Phase 4: PC Injection Queue Consumer
 *
 * Polls Supabase for pending injections (items & Pokémon) and applies them
 * to the current .srm buffer BEFORE uploading to cloud storage.
 *
 * Flow:
 *   1. Called from useCloudSave after download of .srm and BEFORE emulator starts.
 *   2. Fetches all 'pending' rows for current user.
 *   3. Applies each injection via the sav parser (injectPCItem / injectBoxPokemon).
 *   4. Returns the patched buffer.
 *   5. Marks applied rows as 'applied' (or 'failed' on error).
 *
 * 🚨 PROTECTION — Do NOT modify without reading SAVE_SYSTEM_SAFETY_RULES.md
 */

import { createClient } from '@/shared/lib/supabase/client'
import { injectPCItem, injectBoxPokemon } from '@/shared/lib/sav'
import type { BoxPokemonData } from '@/shared/lib/sav'

type InjectionRow = {
  id: string
  type: 'item' | 'pokemon'
  source: string
  source_note: string | null
  // item fields
  item_id: number | null
  item_quantity: number | null
  // pokemon fields
  species: number | null
  level: number | null
  nickname: string | null
  shiny: boolean
  nature: number
  iv_hp: number; iv_atk: number; iv_def: number
  iv_spa: number; iv_spd: number; iv_spe: number
  move1: number; move2: number; move3: number; move4: number
}

/**
 * Applies all pending injections for the current user to the save buffer.
 * @param buffer - Current .srm ArrayBuffer
 * @param userId - Current user's Supabase UUID
 * @param otId   - Player's u32 OT ID from the save (TID | SID<<16)
 * @param otName - Player's trainer name
 * @returns Patched buffer (may be same buffer if no injections pending)
 */
export async function applyPendingInjections(
  buffer: ArrayBuffer,
  userId: string,
  otId: number,
  otName: string,
): Promise<{ buffer: ArrayBuffer; appliedCount: number; errors: string[] }> {
  const supabase = createClient()
  const errors: string[] = []
  let appliedCount = 0
  let current = buffer

  // Fetch all pending rows for this user
  const { data: rows, error: fetchError } = await supabase
    .from('pending_injections')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (fetchError) {
    console.error('[InjectionQueue] Failed to fetch pending injections:', fetchError)
    return { buffer: current, appliedCount: 0, errors: [fetchError.message] }
  }

  if (!rows || rows.length === 0) {
    return { buffer: current, appliedCount: 0, errors: [] }
  }

  console.info(`[InjectionQueue] Processing ${rows.length} pending injection(s)`)

  for (const row of rows as InjectionRow[]) {
    try {
      let patched: ArrayBuffer | null = null

      if (row.type === 'item') {
        if (!row.item_id || !row.item_quantity) {
          throw new Error(`Item injection missing item_id or quantity (id=${row.id})`)
        }
        patched = injectPCItem(current, row.item_id, row.item_quantity)
        if (!patched) throw new Error(`injectPCItem returned null — PC may be full`)

      } else if (row.type === 'pokemon') {
        if (!row.species) throw new Error(`Pokemon injection missing species (id=${row.id})`)

        const pokemonData: BoxPokemonData = {
          species:  row.species,
          level:    row.level ?? 5,
          nature:   row.nature ?? 0,
          shiny:    row.shiny ?? false,
          otId,
          otName,
          nickname: row.nickname ?? '',
          ivHp:  row.iv_hp  ?? 15,
          ivAtk: row.iv_atk ?? 15,
          ivDef: row.iv_def ?? 15,
          ivSpa: row.iv_spa ?? 15,
          ivSpd: row.iv_spd ?? 15,
          ivSpe: row.iv_spe ?? 15,
          moves: [row.move1 ?? 0, row.move2 ?? 0, row.move3 ?? 0, row.move4 ?? 0],
        }
        patched = injectBoxPokemon(current, pokemonData)
        if (!patched) throw new Error(`injectBoxPokemon returned null — PC boxes may be full`)
      }

      if (patched) {
        current = patched
        appliedCount++
        // Mark as applied
        await supabase
          .from('pending_injections')
          .update({ status: 'applied', applied_at: new Date().toISOString() })
          .eq('id', row.id)
        console.info(`[InjectionQueue] ✅ Applied: ${row.type} (${row.source_note ?? row.source})`)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(msg)
      console.error(`[InjectionQueue] ❌ Failed injection id=${row.id}:`, msg)
      // Mark as failed so it doesn't loop forever
      await supabase
        .from('pending_injections')
        .update({ status: 'failed', error_msg: msg })
        .eq('id', row.id)
    }
  }

  return { buffer: current, appliedCount, errors }
}
