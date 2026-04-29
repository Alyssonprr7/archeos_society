from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Optional 
from app.core.game_engine import (
    create_game, 
    active_games, 
    play_expedition, 
    validate_player_turn,
    resolve_expedition_turn_end # Garanta que esta função está importada
)
from app.models.domain import Card, SiteSide

router = APIRouter(prefix="/game", tags=["Game Management"])

# --- SCHEMAS DE ENTRADA ---
class CreateGameRequest(BaseModel):
    player_ids: List[str] = Field(..., min_length=2, max_length=6)
    selected_roles: Optional[List[str]] = None
    site_configs: Optional[Dict[str, SiteSide]] = Field(
        None, 
        description="Mapeamento das trilhas para o Lado A (BASIC) ou Lado B (ADVANCED)"
    )

class PlayExpeditionRequest(BaseModel):
    player_id: str
    card_indices: List[int] = Field(..., description="Índices das cartas na mão do jogador")
    leader_index: int = Field(..., description="Índice do líder na lista de cartas enviadas")
    target_track: Optional[str] = None
    choose_to_score: bool = False
    move_extra_vehicle: bool = False
    is_final_ur_round: bool = False


# --- ROTAS ---
@router.post("/create")
async def api_create_game(request: CreateGameRequest):
    try:
        session = create_game(
            player_ids=request.player_ids, 
            selected_roles=request.selected_roles,
            site_configs=request.site_configs # Passando a configuração do Lado A/B
        )
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
        validate_player_turn(session, request.player_id)
        player = session.players.get(request.player_id)
        
        # Converte os índices enviados pelo frontend nas cartas reais da mão do jogador
        try:
            selected_cards = [player.hand[i] for i in request.card_indices]
        except IndexError:
            raise ValueError("Um ou mais índices de cartas são inválidos ou não existem na mão.")

        expedition = play_expedition(
            session=session, 
            player_id=request.player_id, 
            cards=selected_cards, 
            leader_index=request.leader_index, 
            target_track=request.target_track,
            choose_to_score=request.choose_to_score,
            move_extra_vehicle=request.move_extra_vehicle,
            is_final_ur_round=request.is_final_ur_round
        )
        
        # Passa o turno ou concede turno extra (Cartógrafo)
        resolve_expedition_turn_end(session, player, expedition)
        
        return {
            "message": "Expedição jogada com sucesso", 
            "expedition_size": len(expedition.cards),
            "next_turn": session.current_turn_player_id
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))