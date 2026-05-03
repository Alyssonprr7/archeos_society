import { create } from 'zustand'

export type CardColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple'
export type CardFunction = 'excavation' | 'transport' | 'research' | 'funding' | 'artifact' | 'monkey'

export interface GameCard {
  id: string
  color: CardColor
  function: CardFunction
  value: number
  monkeyType?: 'see' | 'hear' | 'speak'
}

export interface Player {
  id: string
  name: string
  color: string
  role: string
  score: number
  position: number
  cards: GameCard[]
}

export interface GameState {
  gameId: string | null
  myPlayerId: string | null
  players: Player[]
  currentPlayerIndex: number
  market: GameCard[]
  season: number
  revealedMonkeys: number
  phase: 'lobby' | 'setup' | 'playing' | 'expedition' | 'season-end' | 'game-end'
  selectedCards: GameCard[]
  sites: string[]

  setGameId: (id: string) => void
  setMyPlayerId: (id: string | null) => void
  setPlayers: (players: Player[]) => void
  setMarket: (market: GameCard[]) => void
  setCurrentPlayer: (index: number) => void
  setSeason: (season: number) => void
  setRevealedMonkeys: (count: number) => void
  setPhase: (phase: GameState['phase']) => void
  setSelectedCards: (cards: GameCard[]) => void
  setSites: (sites: string[]) => void
  reset: () => void
}

const PLAYER_ID_KEY = 'archeos_myPlayerId'
const GAME_ID_KEY = 'archeos_gameId'

const initialState = {
  gameId: localStorage.getItem(GAME_ID_KEY) ?? null,
  myPlayerId: localStorage.getItem(PLAYER_ID_KEY) ?? null,
  players: [],
  currentPlayerIndex: 0,
  market: [],
  season: 1,
  revealedMonkeys: 0,
  phase: 'lobby' as const,
  selectedCards: [],
  sites: [],
}

export const useGameStore = create<GameState>((set) => ({
  ...initialState,

  setGameId: (id) => {
    localStorage.setItem(GAME_ID_KEY, id)
    set({ gameId: id })
  },
  setMyPlayerId: (id) => {
    if (id) localStorage.setItem(PLAYER_ID_KEY, id)
    else localStorage.removeItem(PLAYER_ID_KEY)
    set({ myPlayerId: id })
  },
  setPlayers: (players) => set({ players }),
  setMarket: (market) => set({ market }),
  setCurrentPlayer: (index) => set({ currentPlayerIndex: index }),
  setSeason: (season) => set({ season }),
  setRevealedMonkeys: (count) => set({ revealedMonkeys: count }),
  setPhase: (phase) => set({ phase }),
  setSelectedCards: (cards) => set({ selectedCards: cards }),
  setSites: (sites) => set({ sites }),
  reset: () => {
    localStorage.removeItem(PLAYER_ID_KEY)
    localStorage.removeItem(GAME_ID_KEY)
    set({ ...initialState, gameId: null, myPlayerId: null })
  },
}))
