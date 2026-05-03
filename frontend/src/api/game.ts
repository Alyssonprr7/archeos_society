import api from './client'

export const gameApi = {
  createGame: (payload: { players: { name: string; role: string }[]; sites: string[] }) =>
    api.post('/game/create', payload),

  getState: (gameId: string) =>
    api.get(`/game/${gameId}`),

  buyFromMarket: (gameId: string, cardId: string) =>
    api.post(`/game/${gameId}/buy-market`, { card_id: cardId }),

  buyFromDeck: (gameId: string) =>
    api.post(`/game/${gameId}/buy-deck`),

  playExpedition: (gameId: string, cardIds: string[], leaderId: string) =>
    api.post(`/game/${gameId}/expedition`, { card_ids: cardIds, leader_id: leaderId }),

  endTurn: (gameId: string) =>
    api.post(`/game/${gameId}/end-turn`),

  endSeason: (gameId: string) =>
    api.post(`/game/${gameId}/end-season`),
}
