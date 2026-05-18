export interface Pokemon {
  id: number
  name: string
  types: string[]
  level: number
  hp: number
  maxHp: number
  isShiny: boolean
  obtainedAt: string | null
}
