import api from './client'

export const gameApi = {
  createGame: (payload: {
    player_ids: string[]
    selected_roles?: string[]
    site_configs?: Record<string, 'A' | 'B'>
  }) => api.post('/game/create', payload),

  getState: (gameId: string) => api.get(`/game/${gameId}`),

  getSummary: (gameId: string) => api.get(`/game/${gameId}/summary`),

  drawFromMarket: (gameId: string, playerId: string, marketIndex: number) =>
    api.post(`/game/${gameId}/draw/market`, { player_id: playerId, market_index: marketIndex }),

  drawFromDeck: (gameId: string, playerId: string) =>
    api.post(`/game/${gameId}/draw/deck`, { player_id: playerId }),

  playExpedition: (
    gameId: string,
    payload: {
      player_id: string
      card_indices: number[]
      leader_index: number
      target_track?: string
      choose_to_score?: boolean
    },
  ) => api.post(`/game/${gameId}/play-expedition`, payload),

  nextSeason: (gameId: string) => api.post(`/game/${gameId}/ready`),
}
