from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional 
from app.core.game_engine import (
    create_game, 
    active_games, 
    play_expedition, 
    validate_player_turn 
)
from app.models.domain import Card # Adicione este import se não houver

router = APIRouter(prefix="/game", tags=["Game Management"])

class CreateGameRequest(BaseModel):
    player_ids: List[str]
    selected_roles: Optional[List[str]] = None 

class PlayExpeditionRequest(BaseModel):
    player_id: str
    cards: List[Card]
    leader_index: int
    target_track: Optional[str] = None  

@router.post("/create")
async def api_create_game(request: CreateGameRequest):
    try:
        # Repasse a variável request.selected_roles para a função:
        session = create_game(request.player_ids, request.selected_roles)
        return {"message": "Partida criada com sucesso", "game_id": session.game_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{game_id}")
async def get_game_state(game_id: str):
    session = active_games.get(game_id)
    if not session:
        raise HTTPException(status_code=404, detail="Partida não encontrada")
    return session

@router.post("/{game_id}/play-expedition")
async def api_play_expedition(game_id: str, request: PlayExpeditionRequest):
    session = active_games.get(game_id)
    if not session:
        raise HTTPException(status_code=404, detail="Partida não encontrada")
    
    try:
        # Validação RNF09 antes de processar a lógica
        validate_player_turn(session, request.player_id)
        
        play_expedition(session, request.player_id, request.cards, request.leader_index, request.target_track)
        return {"message": "Expedição jogada com sucesso"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) 