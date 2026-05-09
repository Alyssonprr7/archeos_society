import { create } from 'zustand'

export interface GameStore {
  gameId: string | null
  myPlayerId: string | null
  playerColors: Record<string, string>

  setGameId: (id: string) => void
  setMyPlayerId: (id: string | null) => void
  setPlayerColors: (colors: Record<string, string>) => void
  reset: () => void
}

const GAME_ID_KEY = 'archeos_gameId'
const PLAYER_ID_KEY = 'archeos_myPlayerId'
const PLAYER_COLORS_KEY = 'archeos_playerColors'

function loadPlayerColors(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(PLAYER_COLORS_KEY) ?? '{}')
  } catch {
    return {}
  }
}

export const useGameStore = create<GameStore>((set) => ({
  gameId: localStorage.getItem(GAME_ID_KEY) ?? null,
  myPlayerId: localStorage.getItem(PLAYER_ID_KEY) ?? null,
  playerColors: loadPlayerColors(),

  setGameId: (id) => {
    localStorage.setItem(GAME_ID_KEY, id)
    set({ gameId: id })
  },
  setMyPlayerId: (id) => {
    if (id) localStorage.setItem(PLAYER_ID_KEY, id)
    else localStorage.removeItem(PLAYER_ID_KEY)
    set({ myPlayerId: id })
  },
  setPlayerColors: (colors) => {
    localStorage.setItem(PLAYER_COLORS_KEY, JSON.stringify(colors))
    set({ playerColors: colors })
  },
  reset: () => {
    localStorage.removeItem(GAME_ID_KEY)
    localStorage.removeItem(PLAYER_ID_KEY)
    localStorage.removeItem(PLAYER_COLORS_KEY)
    set({ gameId: null, myPlayerId: null, playerColors: {} })
  },
}))
