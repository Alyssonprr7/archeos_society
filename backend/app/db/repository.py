from sqlalchemy.orm import Session
from app.db.database import GameRecord
from app.models.domain import GameSession

def save_game_state(db: Session, session: GameSession):
    """Salva ou atualiza o estado completo da partida no banco de dados."""
    game_data = session.model_dump()
    
    db_game = db.query(GameRecord).filter(GameRecord.game_id == session.game_id).first()
    
    if db_game:
        # Atualiza a partida existente
        db_game.status = session.status
        db_game.state = game_data
    else:
        # Cria uma nova partida
        db_game = GameRecord(
            game_id=session.game_id,
            status=session.status,
            state=game_data
        )
        db.add(db_game)
        
    db.commit()

def load_game_state(db: Session, game_id: str) -> GameSession | None:
    """Busca o jogo no banco e reconstrói o objeto Pydantic GameSession."""
    db_game = db.query(GameRecord).filter(GameRecord.game_id == game_id).first()
    
    if not db_game:
        return None
        
    # Reconstrói a classe GameSession a partir do JSON salvo
    return GameSession(**db_game.state)