/**
 * GBA Pokémon Save File (.sav/.srm) Parser & Patcher
 *
 * Money is PLAINTEXT — XOR encryption fully disabled in the ROM:
 *   - money.c GetMoney(): return *moneyPtr;  (no XOR)
 *   - money.c SetMoney(): *moneyPtr = newValue;  (no XOR)
 *   - load_save.c: key rotation for money commented out
 *   - new_game.c: encryptionKey starts at 0
 *
 * Money field: u32 at offset 0x0490 inside SaveBlock1 (sector id=1)
 * MAX_MONEY: 9,999,999 (matches money.c #define MAX_MONEY)
 *
 * Flash layout: 32 sectors × 4,096 bytes = 131,072 bytes
 * Save slots: A (sectors 0-13), B (sectors 14-27)
 * Sector footer (12 bytes): id(u16) + checksum(u16) + signature(u32 0x08012025) + counter(u32)
 */

import { SECTOR_SIZE, SECTOR_DATA_SIZE, SECTOR_SIGNATURE, NUM_SECTORS, NUM_SECTORS_PER_SLOT } from "./SRAM_MAP"

const OFFSET_ID        = SECTOR_DATA_SIZE       // 4084
const OFFSET_CHECKSUM  = SECTOR_DATA_SIZE + 2   // 4086
const OFFSET_SIGNATURE = SECTOR_DATA_SIZE + 4   // 4088
const OFFSET_COUNTER   = SECTOR_DATA_SIZE + 8   // 4092

// Offset within SaveBlock1 chunk (sector id=1)
const SAVEBLOCK1_MONEY_OFFSET = 0x0490  // u32 — confirmed in global.h line 1036

// Game maximum — matches money.c #define MAX_MONEY 9999999
const MAX_MONEY = 9_999_999

// — helpers —

function readU16(buf: Uint8Array, offset: number): number {
  return buf[offset] | (buf[offset + 1] << 8)
}
function writeU16(buf: Uint8Array, offset: number, value: number): void {
  buf[offset] = value & 0xFF; buf[offset + 1] = (value >> 8) & 0xFF
}
function readU32(buf: Uint8Array, offset: number): number {
  return (buf[offset] | (buf[offset+1]<<8) | (buf[offset+2]<<16) | (buf[offset+3]<<24)) >>> 0
}
function writeU32(buf: Uint8Array, offset: number, value: number): void {
  buf[offset]=value&0xFF; buf[offset+1]=(value>>8)&0xFF; buf[offset+2]=(value>>16)&0xFF; buf[offset+3]=(value>>24)&0xFF
}
function getSectorData(buf: Uint8Array, physicalSector: number): Uint8Array {
  const start = physicalSector * SECTOR_SIZE
  return buf.slice(start, start + SECTOR_DATA_SIZE)
}
function calculateChecksum(data: Uint8Array): number {
  let sum = 0
  for (let i = 0; i < data.length / 4; i++) sum += readU32(data, i * 4)
  sum >>>= 0
  return ((sum >> 16) + (sum & 0xFFFF)) & 0xFFFF
}

interface SectorInfo { physicalSector: number; id: number; checksum: number; signature: number; counter: number; valid: boolean }
interface SaveSlot  { index: number; startSector: number; sectors: SectorInfo[]; counter: number; valid: boolean }

// — sector parsing —

function readSectorFooter(buf: Uint8Array, physicalSector: number): SectorInfo {
  const base = physicalSector * SECTOR_SIZE
  return {
    physicalSector, id: readU16(buf, base+OFFSET_ID), checksum: readU16(buf, base+OFFSET_CHECKSUM),
    signature: readU32(buf, base+OFFSET_SIGNATURE), counter: readU32(buf, base+OFFSET_COUNTER), valid: false,
  }
}

function parseSaveSlot(buf: Uint8Array, slotIndex: number): SaveSlot {
  const startSector = slotIndex * NUM_SECTORS_PER_SLOT
  const sectors: SectorInfo[] = []
  for (let i = 0; i < NUM_SECTORS_PER_SLOT; i++) {
    const info = readSectorFooter(buf, startSector + i)
    if (info.signature === SECTOR_SIGNATURE) info.valid = calculateChecksum(getSectorData(buf, info.physicalSector)) === info.checksum
    sectors.push(info)
  }
  const firstValid = sectors.findIndex(s => s.valid)
  return { index: slotIndex, startSector, sectors, counter: firstValid >= 0 ? sectors[firstValid].counter : 0, valid: sectors.every(s => s.valid) }
}

function findBestSlot(buf: Uint8Array): SaveSlot | null {
  const a = parseSaveSlot(buf, 0), b = parseSaveSlot(buf, 1)
  if (a.valid && b.valid) {
    if (a.counter === 0xFFFFFFFF && b.counter === 0) return b
    if (a.counter === 0 && b.counter === 0xFFFFFFFF) return a
    return a.counter >= b.counter ? a : b
  }
  return a.valid ? a : b.valid ? b : null
}

// — Diagnostic —

/** Dump sector table for debugging */
export function diagnoseSaveFile(buffer: ArrayBuffer): string {
  try {
    const buf = new Uint8Array(buffer)
    if (buf.length < NUM_SECTORS * SECTOR_SIZE) return `❌ Buffer demasiado pequeño: ${buf.length} bytes (se requieren ${NUM_SECTORS * SECTOR_SIZE})`

    const lines: string[] = [`📊 Save Diagnóstico — ${buf.length} bytes`]
    for (let slot = 0; slot < 2; slot++) {
      const s = parseSaveSlot(buf, slot)
      lines.push(`\nSlot ${slot === 0 ? "A" : "B"} (sectores ${s.startSector}-${s.startSector + NUM_SECTORS_PER_SLOT - 1}) — válido: ${s.valid} — counter: ${s.counter}`)
      for (const sec of s.sectors) {
        lines.push(`  Sector físico ${sec.physicalSector}: id=${sec.id} sig=0x${sec.signature.toString(16)} ✓=${sec.valid}`)
      }
    }
    const slot = findBestSlot(buf)
    if (slot) {
      const moneyInfo = readMoney(buffer)
      lines.push(`\n✅ Slot activo: ${slot.index === 0 ? "A" : "B"} — PKD leído: ${moneyInfo?.money?.toLocaleString() ?? "N/A"}`)
    } else {
      lines.push(`\n❌ No se encontró slot válido`)
    }
    return lines.join("\n")
  } catch (e) {
    return `❌ Error al diagnosticar: ${(e as Error).message}`
  }
}

// — public API —

/**
 * Read money from the active slot. PLAINTEXT — no XOR.
 * Returns null if no valid slot found.
 */
export function readMoney(buffer: ArrayBuffer): { money: number; slot: number } | null {
  const buf = new Uint8Array(buffer)
  if (buf.length < NUM_SECTORS * SECTOR_SIZE) return null
  const slot = findBestSlot(buf)
  if (!slot) return null
  const sector = slot.sectors.find(s => s.id === 1 && s.valid)
  if (!sector) return null

  const money = readU32(buf, sector.physicalSector * SECTOR_SIZE + SAVEBLOCK1_MONEY_OFFSET)

  // Sanity check — if result exceeds game max, the save is likely corrupt
  if (money > MAX_MONEY) {
    console.warn(`readMoney: valor (${money.toLocaleString()}) excede MAX_MONEY (${MAX_MONEY.toLocaleString()}) — posible corrupción`)
    return { money: 0, slot: slot.index }
  }

  return { money, slot: slot.index }
}

/**
 * Patch money in the save file. PLAINTEXT — no XOR.
 * Clamps to MAX_MONEY (9,999,999). Recalculates sector checksum.
 * Returns null on failure — NEVER returns unpatched buffer.
 */
export function patchMoney(buffer: ArrayBuffer, newMoney: number): ArrayBuffer | null {
  const buf = new Uint8Array(buffer.slice(0))
  if (buf.length < NUM_SECTORS * SECTOR_SIZE) {
    console.error(`patchMoney: buffer inválido (${buf.length} bytes < ${NUM_SECTORS * SECTOR_SIZE})`)
    return null
  }

  // Clamp to game max
  const clampedMoney = Math.min(Math.max(0, Math.floor(newMoney)), MAX_MONEY)
  if (clampedMoney !== newMoney) {
    console.warn(`patchMoney: valor clampeado ${newMoney.toLocaleString()} → ${clampedMoney.toLocaleString()} (MAX_MONEY=${MAX_MONEY.toLocaleString()})`)
  }

  const slot = findBestSlot(buf)
  if (!slot) {
    console.error("patchMoney: no se encontró slot válido en el save")
    return null
  }

  const sector = slot.sectors.find(s => s.id === 1 && s.valid)
  if (!sector) {
    console.error(
      `patchMoney: sector SaveBlock1 (id=1) no encontrado o inválido.\n` +
      `Sectores del slot ${slot.index}: ${slot.sectors.map(s => `id=${s.id},valid=${s.valid}`).join(" | ")}`
    )
    return null
  }

  const base = sector.physicalSector * SECTOR_SIZE
  const oldMoney = readU32(buf, base + SAVEBLOCK1_MONEY_OFFSET)

  // Write plaintext money value
  writeU32(buf, base + SAVEBLOCK1_MONEY_OFFSET, clampedMoney)

  // Recalculate checksum
  const data = getSectorData(buf, sector.physicalSector)
  writeU16(buf, base + OFFSET_CHECKSUM, calculateChecksum(data))

  console.info(
    `patchMoney: ${oldMoney.toLocaleString()} → ${clampedMoney.toLocaleString()} ` +
    `(plaintext, sector ${sector.physicalSector}, slot ${slot.index === 0 ? "A" : "B"})`
  )
  return buf.buffer
}

/** Validate a buffer looks like a valid GBA save. */
export function validateSaveFile(buffer: ArrayBuffer): { valid: boolean; slot: number } {
  try {
    const buf = new Uint8Array(buffer)
    if (buf.length < NUM_SECTORS * SECTOR_SIZE) return { valid: false, slot: -1 }
    const slot = findBestSlot(buf)
    return slot ? { valid: true, slot: slot.index } : { valid: false, slot: -1 }
  } catch { return { valid: false, slot: -1 } }
}

/** Read a flag (1 bit) at SaveBlock1 offset 0x1270 + flagId/8. */
export function readFlag(buffer: ArrayBuffer, flagId: number): boolean | null {
  const buf = new Uint8Array(buffer)
  if (buf.length < NUM_SECTORS * SECTOR_SIZE) return null
  const slot = findBestSlot(buf)
  if (!slot) return null
  for (const s of slot.sectors) {
    if (!s.valid || s.id < 1 || s.id > 4) continue
    const chunkStart = (s.id - 1) * SECTOR_DATA_SIZE
    const flagOff = 0x1270 + Math.floor(flagId / 8)
    if (flagOff < chunkStart || flagOff >= chunkStart + SECTOR_DATA_SIZE) continue
    const byte = buf[s.physicalSector * SECTOR_SIZE + (flagOff - chunkStart)]
    return ((byte >> (flagId % 8)) & 1) === 1
  }
  return null
}

/** Set or clear a flag in the save file. */
export function patchFlag(buffer: ArrayBuffer, flagId: number, set: boolean): ArrayBuffer | null {
  const buf = new Uint8Array(buffer.slice(0))
  if (buf.length < NUM_SECTORS * SECTOR_SIZE) return null
  const slot = findBestSlot(buf)
  if (!slot) return null
  const flagByteOff = 0x1270 + Math.floor(flagId / 8)
  for (const sec of slot.sectors) {
    if (!sec.valid || sec.id < 1 || sec.id > 4) continue
    const chunkStart = (sec.id - 1) * SECTOR_DATA_SIZE
    if (flagByteOff < chunkStart || flagByteOff >= chunkStart + SECTOR_DATA_SIZE) continue
    const off = sec.physicalSector * SECTOR_SIZE + (flagByteOff - chunkStart)
    if (set) buf[off] |= (1 << (flagId % 8)); else buf[off] &= ~(1 << (flagId % 8))
    const data = getSectorData(buf, sec.physicalSector)
    writeU16(buf, sec.physicalSector * SECTOR_SIZE + OFFSET_CHECKSUM, calculateChecksum(data))
    return buf.buffer
  }
  return null
}

/** Set a 16-bit variable in the save file (0x139C is VARS offset in SaveBlock1). */
export function patchVar(buffer: ArrayBuffer, varIndex: number, value: number): ArrayBuffer | null {
  const buf = new Uint8Array(buffer.slice(0))
  if (buf.length < NUM_SECTORS * SECTOR_SIZE) return null
  const slot = findBestSlot(buf)
  if (!slot) return null
  const varByteOff = 0x139C + (varIndex * 2)
  for (const sec of slot.sectors) {
    if (!sec.valid || sec.id < 1 || sec.id > 4) continue
    const chunkStart = (sec.id - 1) * SECTOR_DATA_SIZE
    if (varByteOff < chunkStart || varByteOff + 1 >= chunkStart + SECTOR_DATA_SIZE) continue
    const off = sec.physicalSector * SECTOR_SIZE + (varByteOff - chunkStart)
    
    // Write little-endian u16
    buf[off] = value & 0xFF
    buf[off + 1] = (value >> 8) & 0xFF
    
    const data = getSectorData(buf, sec.physicalSector)
    writeU16(buf, sec.physicalSector * SECTOR_SIZE + OFFSET_CHECKSUM, calculateChecksum(data))
    return buf.buffer
  }
  return null
}

/** 
 * Inject an item into the PC Item Storage. 
 * Offset 0x0498 inside SaveBlock1. 50 slots of 4 bytes (u16 itemId, u16 quantity).
 * Capped at 999 items per slot.
 */
export function injectPCItem(buffer: ArrayBuffer, itemId: number, quantity: number): ArrayBuffer | null {
  const buf = new Uint8Array(buffer.slice(0))
  if (buf.length < NUM_SECTORS * SECTOR_SIZE) return null
  const slot = findBestSlot(buf)
  if (!slot) return null
  
  const pcItemsByteOff = 0x0498 // SAVEBLOCK1.PC_ITEMS
  const PC_ITEMS_MAX = 50
  const ITEMSLOT_SIZE = 4
  
  for (const sec of slot.sectors) {
    if (!sec.valid || sec.id < 1 || sec.id > 4) continue
    const chunkStart = (sec.id - 1) * SECTOR_DATA_SIZE
    
    // PC_ITEMS is 0x0498 to 0x0560. Fits entirely in chunk 0 (sector id 1) which is 0x0000 to 0x0FF4
    if (pcItemsByteOff < chunkStart || pcItemsByteOff + (PC_ITEMS_MAX * ITEMSLOT_SIZE) >= chunkStart + SECTOR_DATA_SIZE) continue
    
    const baseOff = sec.physicalSector * SECTOR_SIZE + (pcItemsByteOff - chunkStart)
    
    let targetSlotOff = -1
    let emptySlotOff = -1
    let currentQuantity = 0
    
    // Scan the 50 slots
    for (let i = 0; i < PC_ITEMS_MAX; i++) {
      const slotOff = baseOff + (i * ITEMSLOT_SIZE)
      const currentId = buf[slotOff] | (buf[slotOff + 1] << 8)
      const currentQty = buf[slotOff + 2] | (buf[slotOff + 3] << 8)
      
      if (currentId === itemId && currentQty < 999) {
        targetSlotOff = slotOff
        currentQuantity = currentQty
        break // Found matching item with space
      } else if (currentId === 0 && emptySlotOff === -1) {
        emptySlotOff = slotOff // Found first empty slot
      }
    }
    
    if (targetSlotOff === -1) {
      if (emptySlotOff !== -1) {
        targetSlotOff = emptySlotOff
        currentQuantity = 0
      } else {
        console.warn("injectPCItem: PC Item Storage is full.")
        return null // No space
      }
    }
    
    const newQuantity = Math.min(currentQuantity + quantity, 999)
    
    // Write itemId
    buf[targetSlotOff] = itemId & 0xFF
    buf[targetSlotOff + 1] = (itemId >> 8) & 0xFF
    // Write quantity
    buf[targetSlotOff + 2] = newQuantity & 0xFF
    buf[targetSlotOff + 3] = (newQuantity >> 8) & 0xFF
    
    const data = getSectorData(buf, sec.physicalSector)
    writeU16(buf, sec.physicalSector * SECTOR_SIZE + OFFSET_CHECKSUM, calculateChecksum(data))
    
    console.info(`injectPCItem: injected ${quantity} of itemId ${itemId}. Total in slot: ${newQuantity}`)
    return buf.buffer
  }
  return null
}

/**
 * Inject a BoxPokemon into Bill's PC.
 * Scans sectors id=5-13 (PokemonStorage) for the first empty slot (personality===0).
 * Writes 80 bytes and recalculates the sector checksum.
 */
export function injectBoxPokemon(buffer: ArrayBuffer, pokemonData: import("./boxmon").BoxPokemonData): ArrayBuffer | null {
  const buf = new Uint8Array(buffer.slice(0))
  if (buf.length < NUM_SECTORS * SECTOR_SIZE) return null
  const slot = findBestSlot(buf)
  if (!slot) return null

  const { buildBoxPokemon } = require("./boxmon")
  const monBytes = buildBoxPokemon(pokemonData)

  const PC_SECTOR_START_ID = 5
  const PC_SECTOR_END_ID   = 13
  const BOX_MON_SIZE       = 80

  // Scan PC sectors for first empty slot (personality u32 === 0)
  for (const sec of slot.sectors) {
    if (!sec.valid) continue
    if (sec.id < PC_SECTOR_START_ID || sec.id > PC_SECTOR_END_ID) continue

    const secBase = sec.physicalSector * SECTOR_SIZE
    const sectorLocalOff = 0  // PokemonStorage data starts at byte 0 within each sector

    // How many BoxPokemon fit in this sector's data area?
    const monsInSector = Math.floor(SECTOR_DATA_SIZE / BOX_MON_SIZE)

    for (let i = 0; i < monsInSector; i++) {
      const monOff = secBase + sectorLocalOff + i * BOX_MON_SIZE
      // Check if slot is empty: personality (u32 at offset 0) === 0
      const personality = readU32(buf, monOff)
      if (personality !== 0) continue  // slot occupied

      // Found empty slot — write the Pokémon
      buf.set(monBytes, monOff)

      // Recalculate this sector's checksum
      writeU16(buf, secBase + OFFSET_CHECKSUM,
        calculateChecksum(getSectorData(buf, sec.physicalSector)))

      console.info(`injectBoxPokemon: species=${pokemonData.species} → sector ${sec.physicalSector}, slot ${i}`)
      return buf.buffer
    }
  }

  console.warn('injectBoxPokemon: all PC boxes are full')
  return null
}

/** 
 * Extract Player OT Name and OT ID from SaveBlock2 
 * Returns null if save is invalid.
 */
export function readPlayerInfo(buffer: ArrayBuffer): { otName: string, otId: number } | null {
  const buf = new Uint8Array(buffer)
  if (buf.length < NUM_SECTORS * SECTOR_SIZE) return null
  const slot = findBestSlot(buf)
  if (!slot) return null

  // SaveBlock2 is in sector id=0
  const sector = slot.sectors.find(s => s.id === 0 && s.valid)
  if (!sector) return null

  const base = sector.physicalSector * SECTOR_SIZE

  // TRAINER_ID is at offset 0x000A within SaveBlock2 (u32)
  const otId = readU32(buf, base + 0x000A)

  // PLAYER_NAME is at offset 0x0000 (8 bytes max)
  // We don't have a full decoder, so we just use a placeholder if we can't read it easily.
  // The simplest is to map the GBA bytes back, but for Phase 4 a default name is acceptable
  // if we don't want to bring the full decoding table.
  // Let's just use "ORACLE" for injected Pokémon, or if we want we can implement a basic reverse map.
  
  // For now we'll just return "ORACLE" to identify gifted mons, but use the real OT ID 
  // so they obey the player. Wait, if OT ID matches but OT Name differs, it's still treated as traded!
  // It's safer to use a dummy ID like 0 and "ORACLE", OR try to read the name.
  
  // Let's implement a tiny reverse map for the English letters
  const reverseMap: Record<number, string> = {
    0xBB: 'A', 0xBC: 'B', 0xBD: 'C', 0xBE: 'D', 0xBF: 'E', 0xC0: 'F', 0xC1: 'G', 0xC2: 'H', 0xC3: 'I', 0xC4: 'J',
    0xC5: 'K', 0xC6: 'L', 0xC7: 'M', 0xC8: 'N', 0xC9: 'O', 0xCA: 'P', 0xCB: 'Q', 0xCC: 'R', 0xCD: 'S', 0xCE: 'T',
    0xCF: 'U', 0xD0: 'V', 0xD1: 'W', 0xD2: 'X', 0xD3: 'Y', 0xD4: 'Z',
    0xD5: 'a', 0xD6: 'b', 0xD7: 'c', 0xD8: 'd', 0xD9: 'e', 0xDA: 'f', 0xDB: 'g', 0xDC: 'h', 0xDD: 'i', 0xDE: 'j',
    0xDF: 'k', 0xE0: 'l', 0xE1: 'm', 0xE2: 'n', 0xE3: 'o', 0xE4: 'p', 0xE5: 'q', 0xE6: 'r', 0xE7: 's', 0xE8: 't',
    0xE9: 'u', 0xEA: 'v', 0xEB: 'w', 0xEC: 'x', 0xED: 'y', 0xEE: 'z',
    0x00: ' ', 0xFF: ''
  }
  let otName = ""
  for (let i = 0; i < 7; i++) {
    const b = buf[base + i]
    if (b === 0xFF) break
    otName += reverseMap[b] || '?'
  }

  return { otName: otName || "PLAYER", otId }
}
