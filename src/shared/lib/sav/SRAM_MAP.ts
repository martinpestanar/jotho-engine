/**
 * SRAM_MAP.ts — Exact memory layout of the GBA Pokémon save file
 *
 * Source: https://github.com/martinpestanar/pokemonHnS
 * Files:   include/global.h (SaveBlock1, SaveBlock2)
 *          include/constants/global.h (array sizes)
 *
 * Flash layout (131,072 bytes = 32 sectors × 4,096 bytes):
 *   Sectors 0-13: Save Slot A
 *   Sectors 14-27: Save Slot B
 *   Each sector: 4,084 bytes data + 12 bytes footer (id, checksum, signature, counter)
 *
 * Within a save slot (14 sectors):
 *   Sector ID 0: SaveBlock2 (fits in 4,084 bytes — sizeof = 0xF2C)
 *   Sector ID 1-4: SaveBlock1 (4 × 4,084 = 16,336 bytes)
 *   Sector ID 5-13: PokemonStorage (9 × 4,084 bytes)
 *
 * IMPORTANT: XOR encryption is DISABLED on money/coins since commit b41dff352.
 * Values in this fork are PLAINTEXT at all offsets.
 */

// ============================================================
// Flash sector constants
// ============================================================
export const SECTOR_SIZE        = 0x1000  // 4,096 bytes
export const SECTOR_DATA_SIZE   = 4084     // data before footer
export const SECTOR_SIGNATURE   = 0x08012025
export const NUM_SECTORS        = 32
export const NUM_SECTORS_PER_SLOT = 14

// Footer offsets within a sector
export const SECTOR_FOOTER_ID        = SECTOR_DATA_SIZE       // 4084 (u16)
export const SECTOR_FOOTER_CHECKSUM  = SECTOR_DATA_SIZE + 2   // 4086 (u16)
export const SECTOR_FOOTER_SIGNATURE = SECTOR_DATA_SIZE + 4   // 4088 (u32)
export const SECTOR_FOOTER_COUNTER   = SECTOR_DATA_SIZE + 8   // 4092 (u32)

// ============================================================
// SaveBlock1 — Player data (offsets from chunk start = sector ID 1)
// ============================================================
export const SAVEBLOCK1 = {
  /** Player position (Coords16, 4 bytes) */
  POS:              0x0000,
  /** Current warp location (WarpData, 8 bytes) */
  LOCATION:         0x0004,
  /** Player party count (u8) */
  PARTY_COUNT:      0x0234,
  /** Player party Pokemon (PARTY_SIZE × sizeof(Pokemon) = 6 × 100 = 600 bytes) */
  PARTY:            0x0238,
  /** Money / PKD balance (u32, PLAINTEXT) */
  MONEY:            0x0490,
  /** Game Corner coins (u16) */
  COINS:            0x0494,
  /** Registered key item for SELECT (u16) */
  REGISTERED_ITEM:  0x0496,
  /** PC items (PC_ITEMS_COUNT × ItemSlot(4) = 50 × 4 = 200 bytes) */
  PC_ITEMS:         0x0498,
  /** Bag pocket: Items (BAG_ITEMS_COUNT × 4 = 90 × 4 = 360 bytes) */
  BAG_ITEMS:        0x0560,
  /** Bag pocket: Key Items (30 × 4 = 120 bytes) */
  BAG_KEYITEMS:     0x05D8,
  /** Bag pocket: Poké Balls (16 × 4 = 64 bytes) */
  BAG_POKEBALLS:    0x0650,
  /** Bag pocket: TMs & HMs (64 × 4 = 256 bytes) */
  BAG_TMHM:         0x0690,
  /** Bag pocket: Berries (46 × 4 = 184 bytes) */
  BAG_BERRIES:      0x0790,
  /** Pokéblocks (40 × 7 = 280 bytes) */
  POKEBLOCKS:       0x0848,
  /** Pokédex seen flags, copy 1 */
  SEEN1:            0x0988,
  /** Berry blender records (3 × u16) */
  BERRY_BLENDER:    0x09BC,
  /** Save version magic number (u32, must be 0xE8F828BC) */
  VERSION_MAGIC:    0x09C2,
  /** Save version ID (u16, currently 7 in HnS) */
  VERSION_ID:       0x09C6,
  /** Trainer rematch step counter (u16) */
  REMATCH_COUNTER:  0x09C8,
  /** Event flags (NUM_FLAG_BYTES bytes, each bit is one flag) */
  FLAGS:            0x1270,
  /** Game vars (VARS_COUNT × u16 = 256 × 2 = 512 bytes) */
  VARS:             0x139C,
  /** Game statistics (NUM_GAME_STATS × u32 = 64 × 4 = 256 bytes) */
  GAME_STATS:       0x159C,
} as const

// ============================================================
// SaveBlock2 — System data (offsets from chunk start = sector ID 0)
// ============================================================
export const SAVEBLOCK2 = {
  /** Player name (8 bytes, null-terminated) */
  PLAYER_NAME:      0x0000,
  /** Player gender (u8) */
  GENDER:           0x0008,
  /** Trainer ID (4 bytes) */
  TRAINER_ID:       0x000A,
  /** Play time hours (u16) */
  PLAY_TIME_HOURS:  0x000E,
  /** Play time minutes (u8) */
  PLAY_TIME_MINUTES: 0x0010,
  /** Options bitfield starts here */
  OPTIONS:          0x0013,
  /** Pokédex data */
  POKEDEX:          0x0018,
  /** Encryption key (u32, DISABLED in Johto LifeSync — always 0) */
  ENCRYPTION_KEY:   0x00AC,
  /** Rival name (8 bytes) */
  RIVAL_NAME:       0x0000, // NOTE: struct size is 0xF2C
} as const

// ============================================================
// ItemSlot structure (4 bytes each)
// ============================================================
export const ITEMSLOT_SIZE = 4  // { u16 itemId, u16 quantity }

// ============================================================
// Bag pocket sizes (from include/constants/global.h)
// ============================================================
export const POCKET_SIZES = {
  PC_ITEMS:      50,
  ITEMS:         90,
  KEY_ITEMS:     30,
  POKE_BALLS:    16,
  TM_HM:         64,
  BERRIES:       46,
} as const

// ============================================================
// Flag groups (from include/constants/flags.h)
// ============================================================
export const FLAG_GROUPS = {
  /** System flags start */
  SYSTEM:         0x860,
  /** Johto badge flags (8 badges) */
  BADGE_JOHTO:    0x867,
  /** Kanto badge flags (8 badges) */
  BADGE_KANTO:    0x8E5,
  /** Game cleared flag */
  GAME_CLEAR:     0x864,
} as const
