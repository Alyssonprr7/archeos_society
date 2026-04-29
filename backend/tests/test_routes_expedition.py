from fastapi.testclient import TestClient
from app.main import app
from app.models.domain import CardColor, Card
from app.core.game_engine import active_games

client = TestClient(app)

def test_endpoint_jogar_expedicao_sucesso():
        # 1. Cria a partida via API
        res_create = client.post("/game/create", json={"player_ids": ["p1", "p2"]})
        game_id = res_create.json()["game_id"]
    
        # 2. Setup: Acesso à memória para garantir estado do teste
        session = active_games[game_id]
    
        # GARANTIA RNF09: Força o turno para o p1 para satisfazer a validação
        session.current_turn_player_id = "p1"
    
        cartas_setup = [
            Card(role="Guia", color="Europa"),
            Card(role="Médico", color="Europa")
        ]
        
        # --- CORREÇÃO AQUI ---
        session.players["p1"].hand.clear() # Remove a carta aleatória do setup
        session.players["p1"].hand.extend(cartas_setup)
    
        # 3. Payload para a API
        payload = {
            "player_id": "p1",
            "card_indices": [0, 1], # Agora o 0 e o 1 são exatamente o Guia e o Médico!
            "leader_index": 0
        }
    
        response = client.post(f"/game/{game_id}/play-expedition", json=payload)
    
        assert response.status_code == 200