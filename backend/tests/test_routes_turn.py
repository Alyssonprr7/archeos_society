from fastapi.testclient import TestClient
from app.main import app
from app.models.domain import Card
from app.core.game_engine import active_games

client = TestClient(app)

def test_endpoint_draw_market_sucesso():
    # Arrange
    res_create = client.post("/game/create", json={"player_ids": ["p1", "p2"]})
    game_id = res_create.json()["game_id"]
    
    session = active_games[game_id]
    session.current_turn_player_id = "p1"
    player = session.players["p1"]
    player.hand.clear() # Limpa a mão gerada no setup automático
    
    mercado_inicial = len(session.market)
    carta_alvo = session.market[0] # Pega a primeira carta visível
    
    # Act
    payload = {"player_id": "p1", "market_index": 0}
    response = client.post(f"/game/{game_id}/draw/market", json=payload)
    
    # Assert
    assert response.status_code == 200
    dados = response.json()
    assert dados["message"] == "Carta comprada do mercado com sucesso."
    assert dados["next_turn"] == "p2", "O turno não passou para o p2!"
    
    # Validações na memória (Engine)
    assert len(player.hand) == 1
    assert player.hand[0] == carta_alvo
    assert len(session.market) == mercado_inicial - 1

def test_endpoint_draw_deck_sucesso():
    # Arrange
    res_create = client.post("/game/create", json={"player_ids": ["p1", "p2"]})
    game_id = res_create.json()["game_id"]
    
    session = active_games[game_id]
    session.current_turn_player_id = "p1"
    player = session.players["p1"]
    player.hand.clear()
    
    # Injeta uma carta normal no topo do baralho para garantir que não é macaco no teste
    session.deck.insert(0, Card(role="Guia", color="Europa"))
    tamanho_deck = len(session.deck)
    
    # Act
    payload = {"player_id": "p1"}
    response = client.post(f"/game/{game_id}/draw/deck", json=payload)
    
    # Assert
    assert response.status_code == 200
    dados = response.json()
    assert dados["message"] == "Carta comprada do baralho oculto com sucesso."
    assert dados["next_turn"] == "p2"
    
    assert len(player.hand) == 1
    assert player.hand[0].role == "Guia"
    assert len(session.deck) == tamanho_deck - 1

def test_endpoint_draw_deck_revela_terceiro_macaco():
    # Arrange
    res_create = client.post("/game/create", json={"player_ids": ["p1", "p2"]})
    game_id = res_create.json()["game_id"]
    
    session = active_games[game_id]
    session.current_turn_player_id = "p1"
    
    # Força o estado do jogo para estar à beira do fim da temporada
    session.monkeys_found = 2
    session.deck.insert(0, Card(role="Macaco", color="Especial", is_monkey=True))
    
    # Act
    payload = {"player_id": "p1"}
    response = client.post(f"/game/{game_id}/draw/deck", json=payload)
    
    # Assert
    assert response.status_code == 200
    dados = response.json()
    
    # Valida se a resposta da API refletiu o gatilho de fim de temporada
    assert dados["message"] == "Atenção: O 3º macaco foi revelado! A temporada acabou."
    assert dados["game_status"] == "SEASON_ENDED"

def test_endpoint_draw_limite_de_mao_excedido():
    # Arrange
    res_create = client.post("/game/create", json={"player_ids": ["p1", "p2"]})
    game_id = res_create.json()["game_id"]
    
    session = active_games[game_id]
    session.current_turn_player_id = "p1"
    player = session.players["p1"]
    
    # Força a mão do jogador a ter 10 cartas
    player.hand = [Card(role="Guia", color="Europa")] * 10
    
    # Act
    payload_market = {"player_id": "p1", "market_index": 0}
    response_market = client.post(f"/game/{game_id}/draw/market", json=payload_market)
    
    payload_deck = {"player_id": "p1"}
    response_deck = client.post(f"/game/{game_id}/draw/deck", json=payload_deck)
    
    # Assert
    assert response_market.status_code == 400
    assert "Limite de 10 cartas atingido" in response_market.json()["detail"]
    
    assert response_deck.status_code == 400
    assert "Limite de 10 cartas atingido" in response_deck.json()["detail"]