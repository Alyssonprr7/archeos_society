from fastapi.testclient import TestClient
from app.main import app
from app.models.domain import CardColor, Card
from app.db.database import SessionLocal
from app.db.repository import load_game_state, save_game_state

client = TestClient(app)

def test_endpoint_jogar_expedicao_sucesso():
    # 1. Cria a partida via API (Já salva no banco automaticamente)
    res_create = client.post("/game/create", json={"player_ids": ["p1", "p2"]})
    game_id = res_create.json()["game_id"]
    
    # 2. Setup: Acessa O BANCO DE DADOS em vez da memória RAM (active_games)
    db = SessionLocal()
    session = load_game_state(db, game_id)
    
    # Força o turno e as cartas para satisfazer as validações
    session.current_turn_player_id = "p1"
    
    cartas_setup = [
        Card(role="Guia", color="Europa"),
        Card(role="Médico", color="Europa")
    ]
    
    session.players["p1"].hand.clear()
    session.players["p1"].hand.extend(cartas_setup)
    
    # Salva o estado manipulado de volta no banco para a API conseguir ler!
    save_game_state(db, session)
    db.close() # Fecha a conexão do teste
    
    # 3. Payload para a API
    payload = {
        "player_id": "p1",
        "card_indices": [0, 1],
        "leader_index": 0
    }
    
    response = client.post(f"/game/{game_id}/play-expedition", json=payload)
    
    assert response.status_code == 200