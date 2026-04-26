from fastapi import APIRouter, HTTPException
from app.core.game_engine import active_games, advance_turn, end_season, check_monkey_condition 

router = APIRouter(prefix="/turn", tags=["Turn Management"])

@router.post("/{game_id}/draw/deck")
async def draw_from_deck(game_id: str, player_id: str):
    session = active_games.get(game_id)
    if not session:
        raise HTTPException(status_code=404, detail="Partida não encontrada") [cite: 5]

    player = session.players.get(player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Jogador não encontrado na partida") [cite: 6]
    
    # RF16 - Controlar limite de mão
    if len(player.hand) >= 10:
        raise HTTPException(status_code=400, detail="Limite de 10 cartas atingido.") [cite: 6]
        
    if not session.deck:
        raise HTTPException(status_code=400, detail="O baralho acabou") [cite: 6]

    drawn_card = session.deck.pop(0) [cite: 7]
    
    # RF17 a RF20 - Regras das Cartas de Macaco centralizadas no Engine
    monkey_event = check_monkey_condition(session, drawn_card)
    if monkey_event:
        # Se for o 3º macaco, encerra a temporada (SEASON_END ou GAME_END)
        if monkey_event["event"] in ["SEASON_END", "GAME_END"]:
            return monkey_event [cite: 7, 21, 22]
        
        # Se for o 1º ou 2º, o jogador compra outra carta imediatamente (recursão)
        return await draw_from_deck(game_id, player_id) [cite: 7]
        
    # Se não for macaco, adiciona à mão e passa o turno
    player.hand.append(drawn_card) [cite: 7]
    advance_turn(session) [cite: 8]
    
    return {"card": drawn_card, "message": "Carta comprada com sucesso. Turno passado."} [cite: 8]