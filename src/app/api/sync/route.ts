/**
 * Soul Sync API — patches a .sav file with pending rewards
 *
 * POST /api/sync
 * Body: FormData with "save" field (the .sav file)
 *       Optional: "userId" (string, for auth context)
 *
 * Returns: modified .sav file as application/octet-stream
 */

import { NextRequest, NextResponse } from "next/server"
import { patchMoney, patchFlag, readMoney, validateSaveFile } from "@/shared/lib/sav"

interface PendingReward {
  id: string
  reward_type: "pkd" | "flag_set" | "flag_clear"
  payload: { amount?: number; flag_id?: number }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const saveFile = formData.get("save") as File | null

    if (!saveFile) {
      return NextResponse.json({ error: "No save file provided" }, { status: 400 })
    }

    const buffer = await saveFile.arrayBuffer()
    const validation = validateSaveFile(buffer)

    if (!validation.valid) {
      return NextResponse.json(
        { error: "Invalid or corrupt .sav file" },
        { status: 400 }
      )
    }

    // Read current state
    const moneyInfo = readMoney(buffer)
    let currentMoney = moneyInfo?.money ?? 0

    // In production, fetch pending rewards from Supabase here
    // For now, accept rewards in the request body (via JSON or additional form fields)
    const rewardsJson = formData.get("rewards") as string | null
    let rewards: PendingReward[] = []

    if (rewardsJson) {
      try {
        rewards = JSON.parse(rewardsJson)
      } catch {
        return NextResponse.json({ error: "Invalid rewards JSON" }, { status: 400 })
      }
    }

    let patchedBuffer = buffer

    // Apply each reward
    for (const reward of rewards) {
      switch (reward.reward_type) {
        case "pkd": {
          const amount = reward.payload?.amount ?? 0
          currentMoney += amount
          const result = patchMoney(patchedBuffer, currentMoney)
          if (!result) {
            return NextResponse.json(
              { error: `Failed to patch money at reward ${reward.id}` },
              { status: 500 }
            )
          }
          patchedBuffer = result
          break
        }

        case "flag_set":
        case "flag_clear": {
          const flagId = reward.payload?.flag_id
          if (flagId === undefined || flagId === null) {
            return NextResponse.json(
              { error: `Missing flag_id in reward ${reward.id}` },
              { status: 400 }
            )
          }
          const result = patchFlag(
            patchedBuffer,
            flagId,
            reward.reward_type === "flag_set"
          )
          if (!result) {
            return NextResponse.json(
              { error: `Failed to patch flag ${flagId} at reward ${reward.id}` },
              { status: 500 }
            )
          }
          patchedBuffer = result
          break
        }
      }
    }

    // Return patched save file
    const finalMoney = readMoney(patchedBuffer)

    return new NextResponse(patchedBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": 'attachment; filename="pokemon.sav"',
        "X-PKD-Balance": String(finalMoney?.money ?? currentMoney),
        "X-Save-Valid": "true",
      },
    })
  } catch (err) {
    console.error("Sync error:", err)
    return NextResponse.json(
      { error: "Internal sync error" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/sync — read current save state
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const saveUrl = searchParams.get("url")

    if (!saveUrl) {
      return NextResponse.json({ error: "No save URL provided" }, { status: 400 })
    }

    const response = await fetch(saveUrl)
    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch save" }, { status: 502 })
    }

    const buffer = await response.arrayBuffer()
    const money = readMoney(buffer)

    // Read badge flags too
    const badgeFlags = []
    for (let i = 0x867; i <= 0x86E; i++) {
      // Johto badges
      const { readFlag } = await import("@/shared/lib/sav")
      const set = readFlag(buffer, i)
      badgeFlags.push({ id: i, set })
    }
    for (let i = 0x8E5; i <= 0x8EC; i++) {
      // Kanto badges
      const { readFlag } = await import("@/shared/lib/sav")
      const set = readFlag(buffer, i)
      badgeFlags.push({ id: i, set })
    }

    return NextResponse.json({
      money: money?.money ?? null,
      slot: money?.slot ?? null,
      badges: badgeFlags,
    })
  } catch (err) {
    console.error("Read error:", err)
    return NextResponse.json({ error: "Internal read error" }, { status: 500 })
  }
}
