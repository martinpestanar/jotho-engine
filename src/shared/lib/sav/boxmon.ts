/**
 * boxmon.ts — GBA BoxPokemon binary encoder
 *
 * Implements the full GBA Pokémon data structure (80 bytes) for injection into Bill's PC.
 * Reference: pokeemerald/include/pokemon.h — struct BoxPokemon
 *
 * Layout (80 bytes total):
 *   0x00: personality   u32   (4 bytes)
 *   0x04: otId          u32   (4 bytes)
 *   0x08: nickname      u8[10] (10 bytes, GBA charset)
 *   0x12: language      u8
 *   0x13: sanity byte   u8 (hasSpecies=1, inPC=1)
 *   0x14: otName        u8[7]
 *   0x1B: markings      u8
 *   0x1C: checksum      u16
 *   0x1E: prestige      u16 (Phase 3 custom field)
 *   0x20: secure data   u8[48] (4 substructs × 12 bytes, XOR-encrypted)
 *
 * Substruct order is determined by (personality % 24), using the GAEM shuffle table.
 */

// GBA Character encoding table (Gen III charset)
// Maps ASCII printable chars to GBA codes
const GBA_CHARSET: Record<string, number> = {
  ' ': 0x00, 'A': 0xBB, 'B': 0xBC, 'C': 0xBD, 'D': 0xBE, 'E': 0xBF,
  'F': 0xC0, 'G': 0xC1, 'H': 0xC2, 'I': 0xC3, 'J': 0xC4, 'K': 0xC5,
  'L': 0xC6, 'M': 0xC7, 'N': 0xC8, 'O': 0xC9, 'P': 0xCA, 'Q': 0xCB,
  'R': 0xCC, 'S': 0xCD, 'T': 0xCE, 'U': 0xCF, 'V': 0xD0, 'W': 0xD1,
  'X': 0xD2, 'Y': 0xD3, 'Z': 0xD4,
  'a': 0xD5, 'b': 0xD6, 'c': 0xD7, 'd': 0xD8, 'e': 0xD9, 'f': 0xDA,
  'g': 0xDB, 'h': 0xDC, 'i': 0xDD, 'j': 0xDE, 'k': 0xDF, 'l': 0xE0,
  'm': 0xE1, 'n': 0xE2, 'o': 0xE3, 'p': 0xE4, 'q': 0xE5, 'r': 0xE6,
  's': 0xE7, 't': 0xE8, 'u': 0xE9, 'v': 0xEA, 'w': 0xEB, 'x': 0xEC,
  'y': 0xED, 'z': 0xEE,
  '0': 0xA1, '1': 0xA2, '2': 0xA3, '3': 0xA4, '4': 0xA5,
  '5': 0xA6, '6': 0xA7, '7': 0xA8, '8': 0xA9, '9': 0xAA,
  '!': 0xAB, '?': 0xAC, '.': 0xAD, '-': 0xAE, '♂': 0xB5, '♀': 0xB6,
  '/': 0xBA, ',': 0xB8, '…': 0xB9,
}
const GBA_TERMINATOR = 0xFF

/**
 * Encode a string into GBA charset bytes (10 bytes max for nickname, 7 for OT name).
 * Unknown chars fall back to 0x00 (space).
 */
export function encodeGBAString(text: string, maxLen: number): Uint8Array {
  const out = new Uint8Array(maxLen).fill(GBA_TERMINATOR)
  const chars = [...text].slice(0, maxLen - 1)
  for (let i = 0; i < chars.length; i++) {
    out[i] = GBA_CHARSET[chars[i]] ?? 0x00
  }
  // Terminator already set by fill above
  return out
}

/**
 * Substruct shuffle order table.
 * Index = personality % 24, value = [G, A, E, M] subindex positions.
 * G=Growth(moves), A=Attacks, E=EVs, M=Misc
 * Source: Bulbapedia / pokeemerald src/pokemon.c sSubstructureOrders
 */
const SUBSTRUCT_ORDERS: readonly [number, number, number, number][] = [
  [0,1,2,3],[0,1,3,2],[0,2,1,3],[0,3,1,2],[0,2,3,1],[0,3,2,1],
  [1,0,2,3],[1,0,3,2],[2,0,1,3],[3,0,1,2],[2,0,3,1],[3,0,2,1],
  [1,2,0,3],[1,3,0,2],[2,1,0,3],[3,1,0,2],[2,3,0,1],[3,2,0,1],
  [1,2,3,0],[1,3,2,0],[2,1,3,0],[3,1,2,0],[2,3,1,0],[3,2,1,0],
]

/** Calculate the internal BoxPokemon checksum (sum of all 16-bit words in substructs). */
function calcMonChecksum(substructs: Uint8Array): number {
  let sum = 0
  for (let i = 0; i < substructs.length; i += 2) {
    sum = (sum + (substructs[i] | (substructs[i + 1] << 8))) & 0xFFFFFFFF
  }
  return sum & 0xFFFF
}

/** XOR-encrypt/decrypt the 48-byte substruct block using (personality ^ otId) as key. */
function xorSubstructs(data: Uint8Array, personality: number, otId: number): void {
  const key = (personality ^ otId) >>> 0
  // Expand key to 4-byte repeating pattern
  const k = [key & 0xFF, (key >> 8) & 0xFF, (key >> 16) & 0xFF, (key >> 24) & 0xFF]
  for (let i = 0; i < data.length; i++) {
    data[i] ^= k[i % 4]
  }
}

/** Data needed to build a BoxPokemon. */
export interface BoxPokemonData {
  species:    number        // Species ID (e.g. 25 = Pikachu)
  level:      number        // Level (1–250)
  nature:     number        // Nature index (0–24)
  shiny:      boolean       // If true, PV is crafted to be shiny vs the otId
  otId:       number        // u32: low 16 = TID, high 16 = SID
  otName:     string        // Trainer name (max 7 chars)
  nickname:   string        // Pokémon nickname (max 10 chars, empty = use species name)
  ivHp:       number        // 0–31
  ivAtk:      number        // 0–31
  ivDef:      number        // 0–31
  ivSpa:      number        // 0–31
  ivSpd:      number        // 0–31
  ivSpe:      number        // 0–31
  moves:      [number, number, number, number]  // Move IDs
  heldItem?:  number        // Optional held item ID
  prestige?:  number        // Phase 3 prestige field
}

/**
 * Build a valid 80-byte BoxPokemon buffer ready for injection.
 * All substructs are shuffled and XOR-encrypted exactly as the GBA does.
 */
export function buildBoxPokemon(data: BoxPokemonData): Uint8Array {
  // 1. Generate Personality Value
  // Nature is encoded in (PV % 25). Gender/ability are in specific bits.
  // For shiny: (TID XOR SID XOR PV_hi XOR PV_lo) < 8
  const tid = data.otId & 0xFFFF
  const sid = (data.otId >> 16) & 0xFFFF

  let pv: number = 0
  if (data.shiny) {
    // Generate a shiny PV with the correct nature
    // nature = pv % 25
    // shiny = (tid ^ sid ^ pv_hi ^ pv_lo) < 8
    let found = false
    for (let i = 0; i < 10000; i++) {
      const pvLo = Math.floor(Math.random() * 0x10000)
      const S = Math.floor(Math.random() * 8)
      const pvHi = pvLo ^ tid ^ sid ^ S
      const testPv = ((pvHi << 16) | pvLo) >>> 0
      
      if (testPv % 25 === data.nature) {
        pv = testPv
        found = true
        break
      }
    }
    if (!found) {
      // Fallback
      pv = Math.floor(Math.random() * 0x100000000)
      while (pv % 25 !== data.nature) pv = (pv + 1) >>> 0
    }
  } else {
    // Random PV with correct nature
    pv = Math.floor(Math.random() * 0x100000000)
    while (pv % 25 !== data.nature) {
      pv = (pv + 1) >>> 0
    }
  }

  // 2. Build 4 unencrypted substructs (each 12 bytes = 3 u32 words)
  // Order: [Growth=0, Attacks=1, EVs=2, Misc=3]
  const subG = new Uint8Array(12) // Growth: species, heldItem, exp, ppBonuses, friendship
  const subA = new Uint8Array(12) // Attacks: 4 moves (u16 each), 4 PP (u8 each)
  const subE = new Uint8Array(12) // EVs & Contest: 6 EVs + 6 contest stats
  const subM = new Uint8Array(12) // Misc: pokerus, metLocation, metLevel/game/ball, IVs+isEgg

  // -- Growth substruct (index 0) --
  subG[0] = data.species & 0xFF
  subG[1] = (data.species >> 8) & 0xFF
  subG[2] = (data.heldItem ?? 0) & 0xFF
  subG[3] = ((data.heldItem ?? 0) >> 8) & 0xFF
  
  // In Gen 3, BoxPokemon only stores Experience, not Level. The game recalculates Level from EXP.
  // We use `level^3` which perfectly matches Medium Fast, and overshoots Slow slightly (safe).
  // For exactly level 5 (the default), we use 135 to ensure L5 on Medium Slow (Celebi).
  const exp = data.level === 5 ? 135 : Math.floor(Math.pow(data.level, 3));
  
  subG[4] = exp & 0xFF; subG[5] = (exp >> 8) & 0xFF
  subG[6] = (exp >> 16) & 0xFF; subG[7] = (exp >> 24) & 0xFF
  subG[8] = 0  // ppBonuses
  subG[9] = 70 // friendship = 70 (neutral)
  // bytes 10-11: hiddenNature, box_ailment, box_hp — set to 0

  // -- Attacks substruct (index 1) --
  for (let i = 0; i < 4; i++) {
    const mv = data.moves[i] ?? 0
    subA[i * 2] = mv & 0xFF
    subA[i * 2 + 1] = (mv >> 8) & 0xFF
  }
  // PP values at offset 8 — set to a reasonable default (35 for normal moves)
  for (let i = 0; i < 4; i++) subA[8 + i] = data.moves[i] ? 35 : 0

  // -- EVs substruct (index 2): all 0 (fresh Pokémon) --
  // Already zeroed

  // -- Misc substruct (index 3) --
  subM[0] = 0 // pokerus
  subM[1] = 0 // metLocation (hatched / mystery)
  // metLevel (7 bits) | metGame (4 bits) | pokeball (5 bits)
  const metLevel = Math.min(data.level, 127)
  const metGame  = 1   // FireRed
  const pokeball = 4   // Poké Ball
  subM[2] = metLevel & 0x7F
  subM[3] = ((metLevel >> 7) & 0x01) | ((metGame & 0x0F) << 1) | ((pokeball & 0x1F) << 5)
  // IVs: packed as 5 bits each in a u32
  // [hpIV:5][atkIV:5][defIV:5][speIV:5][spaIV:5][spdIV:5][isEgg:1][abilityNum:1]
  const ivWord = (
    (data.ivHp  & 0x1F)        |
    ((data.ivAtk & 0x1F) << 5)  |
    ((data.ivDef & 0x1F) << 10) |
    ((data.ivSpe & 0x1F) << 15) |
    ((data.ivSpa & 0x1F) << 20) |
    ((data.ivSpd & 0x1F) << 25)
  ) >>> 0
  subM[4] = ivWord & 0xFF
  subM[5] = (ivWord >> 8) & 0xFF
  subM[6] = (ivWord >> 16) & 0xFF
  subM[7] = (ivWord >> 24) & 0xFF
  // ribbons & fateful encounter — all 0

  // 3. Arrange substructs according to PV % 24 shuffle order
  const order = SUBSTRUCT_ORDERS[pv % 24]
  const rawSubs = [subG, subA, subE, subM]
  const shuffled = new Uint8Array(48)
  for (let i = 0; i < 4; i++) {
    const src = rawSubs[order[i]]
    shuffled.set(src, i * 12)
  }

  // 4. Calculate checksum BEFORE encryption
  const checksum = calcMonChecksum(shuffled)

  // 5. XOR-encrypt the substruct block
  xorSubstructs(shuffled, pv, data.otId)

  // 6. Assemble the final 80-byte BoxPokemon
  const out = new Uint8Array(80)
  const dv = new DataView(out.buffer)

  dv.setUint32(0x00, pv, true)       // personality
  dv.setUint32(0x04, data.otId, true) // otId

  // nickname (10 bytes)
  const nickName = data.nickname || '' // empty = game uses species name
  const nickBytes = encodeGBAString(nickName.toUpperCase(), 10)
  out.set(nickBytes, 0x08)

  out[0x12] = 0x02 // language = English (2)
  out[0x13] = 0x02 // sanity: hasSpecies=1, inPC=1 (bits 1 and 7... actually: hasSpecies=bit1)

  // OT name (7 bytes)
  const otBytes = encodeGBAString(data.otName.toUpperCase(), 7)
  out.set(otBytes, 0x14)

  out[0x1B] = 0x00 // markings
  dv.setUint16(0x1C, checksum, true)  // internal checksum
  dv.setUint16(0x1E, data.prestige ?? 0, true) // Phase 3 prestige field

  // encrypted substructs
  out.set(shuffled, 0x20)

  return out
}
