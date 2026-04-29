from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.game_engine import (
    draw_from_market, 
    draw_card_from_deck, 
    validate_player_turn
)
from app.db.database import get_db
from app.db.repository import load_game_state, save_game_state

router = APIRouter(prefix="/game", tags=["Turn Actions"])

# --- SCHEMAS ---
class DrawMarketRequest(BaseModel):
    player_id: str = Field(..., description="ID do jogador realizando a ação")
    market_index: int = Field(..., description="Índice (0 a N) da carta desejada no mercado")

class DrawDeckRequest(BaseModel):
    player_id: str = Field(..., description="ID do jogador realizando a ação")

# --- ROTAS ---
@router.post("/{game_id}/draw/market")
async def api_draw_market(game_id: str, request: DrawMarketRequest, db: Session = Depends(get_db)):
    """Permite ao jogador comprar uma carta visível do mercado."""
    session = load_game_state(db, game_id)
    if not session:
        raise HTTPException(status_code=404, detail="Partida não encontrada")
    
    try:
        validate_player_turn(session, request.player_id)
        draw_from_market(session, request.player_id, request.market_index)
        
        # Salva as mudanças no banco de dados!
        save_game_state(db, session)
        
        return {
            "message": "Carta comprada do mercado com sucesso.",
            "next_turn": session.current_turn_player_id
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{game_id}/draw/deck")
async def api_draw_deck(game_id: str, request: DrawDeckRequest, db: Session = Depends(get_db)):
    """Permite ao jogador comprar a carta do topo do baralho."""
    session = load_game_state(db, game_id)

    # Bloqueio se o jogo acabou 
    if session.status in ["FINISHED", "SEASON_ENDED"]:
        raise HTTPException(status_code=400, detail="Ação não permitida.")

    try:
        drawn_card = draw_card_from_deck(session, request.player_id)
        save_game_state(db, session)
        
        # Se o jogo mudou de status após a compra (revelou o 3º macaco)
        if session.status in ["SEASON_ENDED", "FINISHED"]:
            return {
                "message": "Atenção: O 3º macaco foi revelado! A temporada acabou.",
                "game_status": session.status,
                "monkeys_found": session.monkeys_found
            }
        
        return {
            "message": "Carta comprada do baralho oculto com sucesso.",
            "next_turn": session.current_turn_player_id
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))