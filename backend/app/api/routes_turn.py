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
        monkeys_before = session.monkeys_found
        draw_from_market(session, request.player_id, request.market_index)
        save_game_state(db, session)

        if session.status in ["SEASON_ENDED", "FINISHED"]:
            return {
                "message": "O 3º macaco foi revelado! A temporada acabou.",
                "game_status": session.status,
                "monkey_revealed": True,
                "monkeys_found": session.monkeys_found,
            }

        if session.monkeys_found > monkeys_before:
            return {
                "message": f"Macaco revelado! ({session.monkeys_found}/3)",
                "monkey_revealed": True,
                "monkeys_found": session.monkeys_found,
                "next_turn": session.current_turn_player_id,
            }

        return {
            "message": "Carta comprada do mercado com sucesso.",
            "next_turn": session.current_turn_player_id,
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
        monkeys_before = session.monkeys_found
        draw_card_from_deck(session, request.player_id)
        save_game_state(db, session)

        if session.status in ["SEASON_ENDED", "FINISHED"]:
            return {
                "message": "O 3º macaco foi revelado! A temporada acabou.",
                "game_status": session.status,
                "monkey_revealed": True,
                "monkeys_found": session.monkeys_found,
            }

        if session.monkeys_found > monkeys_before:
            return {
                "message": f"Macaco revelado! ({session.monkeys_found}/3) — Uma nova carta foi comprada.",
                "monkey_revealed": True,
                "monkeys_found": session.monkeys_found,
                "next_turn": session.current_turn_player_id,
            }

        return {
            "message": "Carta comprada do baralho oculto com sucesso.",
            "next_turn": session.current_turn_player_id,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))