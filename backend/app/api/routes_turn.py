from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.core.game_engine import (
    active_games, 
    draw_from_market, 
    draw_card_from_deck, 
    validate_player_turn
)

router = APIRouter(prefix="/game", tags=["Turn Actions"])

# --- SCHEMAS ---
class DrawMarketRequest(BaseModel):
    player_id: str = Field(..., description="ID do jogador realizando a ação")
    market_index: int = Field(..., description="Índice (0 a N) da carta desejada no mercado")

class DrawDeckRequest(BaseModel):
    player_id: str = Field(..., description="ID do jogador realizando a ação")

# --- ROTAS ---
@router.post("/{game_id}/draw/market")
async def api_draw_market(game_id: str, request: DrawMarketRequest):
    """Permite ao jogador comprar uma carta visível do mercado."""
    session = active_games.get(game_id)
    if not session:
        raise HTTPException(status_code=404, detail="Partida não encontrada")
    
    try:
        validate_player_turn(session, request.player_id)
        draw_from_market(session, request.player_id, request.market_index)
        
        return {
            "message": "Carta comprada do mercado com sucesso.",
            "next_turn": session.current_turn_player_id
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{game_id}/draw/deck")
async def api_draw_deck(game_id: str, request: DrawDeckRequest):
    """
    Permite ao jogador comprar a carta do topo do baralho.
    Processa automaticamente regras de mercado vazio e macacos.
    """
    session = active_games.get(game_id)
    if not session:
        raise HTTPException(status_code=404, detail="Partida não encontrada")
    
    try:
        validate_player_turn(session, request.player_id)
        drawn_card = draw_card_from_deck(session, request.player_id)
        
        # A compra do baralho pode engatilhar o fim da temporada (3º macaco)
        if session.status in ["SEASON_ENDED", "FINISHED"]:
            return {
                "message": "Atenção: O 3º macaco foi revelado! A temporada acabou.",
                "game_status": session.status,
                "monkeys_found": session.monkeys_found
            }
            
        return {
            "message": "Carta comprada do baralho oculto com sucesso.",
            "next_turn": session.current_turn_player_id,
            "monkeys_found": session.monkeys_found
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))