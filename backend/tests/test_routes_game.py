from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_endpoint_criar_partida_sucesso():
    # Arrange (Preparar)
    payload = {"player_ids": ["jogador_A", "jogador_B"]}
    
    # Act (Agir)
    response = client.post("/game/create", json=payload)
    
    # Assert (Verificar)
    assert response.status_code == 200
    dados = response.json()
    assert "game_id" in dados
    assert dados["message"] == "Partida criada com sucesso"

def test_endpoint_criar_partida_erro_limite():
    response = client.post("/game/create", json={"player_ids": ["apenas_um"]})
    assert response.status_code == 400
    assert "entre 2 e 6" in response.json()["detail"]

def test_endpoint_criar_partida_com_papeis_customizados():
    # Arrange: payload com jogadores e os papéis desejados
    payload = {
        "player_ids": ["jogador_1", "jogador_2"],
        "selected_roles": ["Guia", "Médico", "Linguista", "Botânico", "Professor", "Fotógrafo"]
    }
    
    # Act: Faz o POST para a API
    response = client.post("/game/create", json=payload)
    
    # Assert: A API precisa aceitar a requisição e retornar sucesso
    assert response.status_code == 200, f"Erro na API: {response.text}"
    dados = response.json()
    assert "game_id" in dados
    
    # Verifica indiretamente se a partida no backend foi criada com esses papéis
    # Buscando o estado do jogo via GET (outra rota)
    game_id = dados["game_id"]
    response_estado = client.get(f"/game/{game_id}")
    estado_jogo = response_estado.json()
    
    # Se o baralho foi montado corretamente, a primeira carta terá um dos papéis
    assert len(estado_jogo["deck"]) > 0
    papel_primeira_carta = estado_jogo["deck"][0]["role"]
    assert papel_primeira_carta in payload["selected_roles"]    