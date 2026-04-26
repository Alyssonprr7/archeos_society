import requests
import sys

BASE_URL = "http://localhost:8000"
PLAYERS = ["jogador_1", "jogador_2", "jogador_3"]

def print_step(message):
    print(f"\n[🔄] {message}...")

def print_success(message):
    print(f"[✅] {message}")

def print_error(message, response):
    print(f"[❌] {message}")
    print(f"Status Code: {response.status_code}")
    print(f"Detalhes: {response.text}")
    sys.exit(1)

def run_validation():
    print("Iniciando Validação do Archeos Society Engine...\n")

    # 1. Testar se a API está online
    try:
        requests.get(f"{BASE_URL}/")
        print_success("API está online!")
    except requests.exceptions.ConnectionError:
        print("[❌] Erro: A API não está rodando. Inicie o Uvicorn primeiro.")
        sys.exit(1)

    # 2. Criar uma nova partida
    print_step("Criando nova partida com 3 jogadores")
    payload = {"player_ids": PLAYERS}
    response = requests.post(f"{BASE_URL}/game/create", json=payload)
    
    if response.status_code != 200:
        print_error("Falha ao criar partida", response)
        
    game_data = response.json()
    game_id = game_data["game_id"]
    print_success(f"Partida criada com sucesso! ID: {game_id}")

    # 3. Validar o estado inicial da partida
    print_step("Validando o estado inicial do jogo")
    response = requests.get(f"{BASE_URL}/game/{game_id}")
    
    if response.status_code != 200:
        print_error("Falha ao resgatar o estado da partida", response)
        
    state = response.json()
    assert state["max_seasons"] == 2, "Erro: Partidas de 3 jogadores devem ter 2 temporadas."
    assert len(state["players"]) == 3, "Erro: Número de jogadores incorreto."
    print_success("Estado inicial validado (Temporadas e Jogadores corretos).")

    # 4. Validar restrição de compra (O baralho está vazio no código atual)
    print_step("Testando validação de limite/compra com deck vazio")
    
    # Passando o player_id como query parameter (?player_id=jogador_1)
    response = requests.post(f"{BASE_URL}/turn/{game_id}/draw/deck", params={"player_id": "jogador_1"})
    
    # O esperado neste momento da sua EAP é que o sistema bloqueie a compra,
    # pois a lógica de popular o baralho ainda não foi implementada.
    if response.status_code == 400 and "baralho acabou" in response.text:
        print_success("Lógica de validação do deck funcionou perfeitamente (Status 400 retornado).")
    else:
        print_error("O sistema deveria ter bloqueado a compra (Baralho vazio).", response)

    print("\n🎉 Validação concluída com sucesso! O core engine está operacional.")

if __name__ == "__main__":
    run_validation()