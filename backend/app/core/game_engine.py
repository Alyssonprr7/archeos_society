import uuid
import random
from typing import List, Dict, Optional
from app.models.domain import (
    GameSession, Player, Card, CardColor, Expedition, 
    SCORE_TABLE, TRACK_SCORE_TABLES, SiteSide 
)

active_games: Dict[str, GameSession] = {}

def start_season_setup(session: GameSession):
    """Executa o setup inicial da temporada (RF07)"""
    # 1. Distribui 1 carta para cada jogador
    for player in session.players.values():
        if session.deck:
            player.hand.append(session.deck.pop(0))
            
    # 2. Popula o mercado com N+2 cartas
    num_players = len(session.players)
    cards_for_market = num_players + 2
    
    for _ in range(cards_for_market):
        if session.deck:
            session.market.append(session.deck.pop(0))

def create_game(player_ids: List[str], selected_roles: List[str] = None) -> GameSession:
    """Valida e inicializa uma nova partida (RF01, RF02, RF03, RF05, RF09)"""
    if not (2 <= len(player_ids) <= 6):
        raise ValueError("A partida deve ter entre 2 e 6 jogadores.")
    
    if selected_roles is None:
        selected_roles = ["Botânico", "Linguista", "Professor", "Explorador", "Guia", "Médico"]
        
    if len(selected_roles) != 6:
        raise ValueError("A partida deve ser configurada com exatamente 6 papéis.")
    
    max_seasons = 2 if len(player_ids) in [2, 3] else 3
    game_id = f"game_{uuid.uuid4().hex[:8]}"
    
    session = GameSession(
        game_id=game_id,
        max_seasons=max_seasons,
        player_order=player_ids.copy()
    )
    
    colors = ["Vermelho", "Azul", "Verde", "Amarelo", "Roxo", "Preto"]
    for i, pid in enumerate(player_ids):
        session.players[pid] = Player(
            id=pid,
            color_assigned=colors[i]
        )
        
    for role in selected_roles:
        for color in CardColor:
            if color != CardColor.SPECIAL: 
                session.deck.append(Card(role=role, color=color.value))
                
    random.shuffle(session.deck)
    start_season_setup(session)
    
    active_games[game_id] = session
    return session

def play_expedition(
    session: GameSession, 
    player_id: str, 
    cards: List[Card], 
    leader_index: int,
    target_track: Optional[str] = None  # RF28
) -> Expedition:
    """Valida e baixa uma expedição para a mesa (RF21 a RF32)"""
    if not cards:
        raise ValueError("Uma expedição precisa de pelo menos uma carta.")
        
    if leader_index < 0 or leader_index >= len(cards):
        raise ValueError("Índice do líder inválido.")
        
    leader = cards[leader_index]
    player = session.players.get(player_id)
    
    # Validação de integridade da expedição
    color_match = all(card.color == leader.color for card in cards)
    role_match = all(card.role == leader.role for card in cards)
    
    if not (color_match or role_match):
        raise ValueError("As cartas não compartilham a mesma cor ou função.")
        
    if not player:
        raise ValueError("Jogador não encontrado na partida.")
        
    # Remoção das cartas da mão
    for played_card in cards:
        card_in_hand = next((c for c in player.hand if c.role == played_card.role and c.color == played_card.color), None)
        if card_in_hand:
            player.hand.remove(card_in_hand)
        else:
            raise ValueError(f"O jogador não possui a carta {played_card.role} ({played_card.color}) na mão.")

    
    # Define qual trilha será afetada: a escolhida (Professor) ou a da cor do líder
    trilha_alvo = target_track if leader.role == "Professor" and target_track else leader.color
    
    if trilha_alvo != CardColor.SPECIAL.value and trilha_alvo in player.tracks:
        posicao_atual = player.tracks[trilha_alvo]
        tamanho_expedicao = len(cards)
        
        # Guia ignora threshold; Professor e outros seguem a regra: tamanho > posição atual
        if leader.role == "Guia" or tamanho_expedicao > posicao_atual:
            player.tracks[trilha_alvo] += 1
            apply_site_effects(session, player_id, trilha_alvo)            


            
    # RF30 - Descarte da Mão Restante (Médico é a exceção)
    if player.hand and leader.role != "Médico":
        session.market.extend(player.hand)
        player.hand.clear()
        
            
    expedition = Expedition(
        cards=cards.copy(),
        leader=leader,
        color_matched=color_match
    )
    
    player.expeditions_played.append(expedition)
    return expedition

def advance_turn(session: GameSession):
    """Passa o turno para o próximo jogador (RF10)"""
    if not session.player_order:
        return
    session.current_turn_index = (session.current_turn_index + 1) % len(session.player_order)
    session.current_turn_player_id = session.player_order[session.current_turn_index]

def validate_player_turn(session: GameSession, player_id: str):
    """Verifica se é o turno do jogador que enviou a requisição (RNF09)"""
    if session.current_turn_player_id != player_id:
        raise ValueError(f"Não é o turno do jogador {player_id}. Vez de {session.current_turn_player_id}.")

def end_season(session: GameSession) -> dict:
    """Finaliza a temporada atual e verifica fim de jogo (RF34, RF40)"""
    session.season += 1
    session.status = "SEASON_ENDED"
    session.monkeys_found = 0
    
    if session.season > session.max_seasons:
        session.status = "FINISHED"
        return {"event": "GAME_END", "message": "Última temporada finalizada. Partida encerrada!"}
        
    return {"event": "SEASON_END", "message": "Terceiro macaco revelado! Fim da temporada."}

def calculate_points(expedition_size: int) -> int:
    """Retorna os pontos baseados no tamanho da expedição (RF38)"""
    if expedition_size <= 0:
        return 0
    if expedition_size >= 6:
        return SCORE_TABLE[6]
    return SCORE_TABLE.get(expedition_size, 0)

def check_monkey_condition(session: GameSession, drawn_card: Card) -> Optional[dict]:
    """Verifica se a carta comprada é um macaco e processa o fim da temporada (RF17-20, RF34)"""
    if not drawn_card.is_monkey:
        return None

    session.monkeys_found += 1
    
    # Se atingir 3 macacos, a temporada acaba imediatamente
    if session.monkeys_found >= 3:
        return end_season(session)
        
    return {"event": "MONKEY_FOUND", "message": f"Macaco revelado! ({session.monkeys_found}/3)"}    

def calculate_track_points(track_name: str, position: int) -> int:
    """Calcula os pontos baseados na posição do veículo em uma trilha específica (RF41)"""
    table = TRACK_SCORE_TABLES.get(track_name, TRACK_SCORE_TABLES["default"])
    
    # Garante que não ultrapasse o limite definido na tabela
    max_pos = max(table.keys())
    safe_position = min(position, max_pos)
    
    return table.get(safe_position, 0)    


def draw_from_market(session: GameSession, player_id: str, market_index: int):
    """Permite ao jogador comprar uma carta visível do mercado (RF13)"""
    player = session.players.get(player_id)
    if not player:
        raise ValueError("Jogador não encontrado.")
    
    # RF16 - Validar limite de mão
    if len(player.hand) >= 10:
        raise ValueError("Limite de 10 cartas atingido.")
    
    if market_index < 0 or market_index >= len(session.market):
        raise ValueError("Índice do mercado inválido.")
    
    # Remove do mercado e adiciona à mão
    card = session.market.pop(market_index)
    player.hand.append(card)
    
    # Passa o turno automaticamente após a compra (RF10)
    advance_turn(session)


def draw_card_from_deck(session: GameSession, player_id: str) -> Optional[Card]:
    """Realiza a compra de uma carta do deck, aplicando o bônus de mercado vazio (RF14, RF15)"""
    player = session.players.get(player_id)
    if not player or not session.deck:
        return None

    # RF16 - Limite de mão
    if len(player.hand) >= 10:
        raise ValueError("Limite de 10 cartas atingido.")

    # Primeira compra
    drawn_card = session.deck.pop(0)
    
    # Se for macaco, processamos a regra especial (RF17-20)
    monkey_check = check_monkey_condition(session, drawn_card)
    if monkey_check:
        # Se achou macaco mas a temporada NÃO acabou, o jogador tenta comprar de novo (RF19)
        if monkey_check["event"] != "SEASON_END":
             return draw_card_from_deck(session, player_id)
        return drawn_card # Retorna para sinalizar o fim da temporada

    player.hand.append(drawn_card)

    # RF15 - Regra do Mercado Vazio: se após a compra o mercado estiver vazio, compra outra
    if not session.market and len(player.hand) < 10:
        extra_card = session.deck.pop(0) if session.deck else None
        if extra_card:
            # Nota: Pela regra oficial, o 2º macaco no bônus também dispararia compra extra,
            # mas para simplificar o MVP, vamos apenas adicionar a carta se não for macaco.
            if not extra_card.is_monkey:
                player.hand.append(extra_card)
            else:
                session.deck.insert(0, extra_card) # Devolve se for macaco para não complicar a recursão

    advance_turn(session)
    return drawn_card    

def determine_winner(session: GameSession) -> List[Dict]:
    """
    Identifica o vencedor e aplica critérios de desempate (RF41, RF42).
    Retorna uma lista ordenada de jogadores.
    """
    ranking = []
    
    for player_id, player in session.players.items():
        # Cálculo de pontos de expedições na mesa (RF38)
        expedition_points = sum(calculate_points(len(e.cards)) for e in player.expeditions_played)
        
        # Cálculo de pontos das trilhas (RF37, RF41)
        track_points = sum(
            calculate_track_points(name, pos) 
            for name, pos in player.tracks.items()
        )
        
        # Pontuação Total (RF41)
        total_score = expedition_points + track_points
        
        # Maior expedição para desempate (RF42)
        # Consideramos apenas as expedições da última temporada/mesa atual
        max_expedition_size = max(
            [len(e.cards) for e in player.expeditions_played], 
            default=0
        )
        
        ranking.append({
            "player_id": player_id,
            "total_score": total_score,
            "max_expedition": max_expedition_size
        })

    # Ordenação (RF41 e RF42):
    # 1º Critério: Pontuação Total (descendente)
    # 2º Critério: Tamanho da maior expedição (descendente)
    ranking.sort(key=lambda x: (x["total_score"], x["max_expedition"]), reverse=True)
    
    return ranking

def reset_cards_for_new_season(session: GameSession):
    """
    Recolhe todas as cartas ao baralho para reiniciar a temporada (RF35).
    """
    # 1. Recolhe cartas da mão e expedições de cada jogador
    for player in session.players.values():
        # Adiciona cartas da mão ao deck
        session.deck.extend(player.hand)
        player.hand.clear()
        
        # Adiciona cartas das expedições ao deck
        for expedition in player.expeditions_played:
            session.deck.extend(expedition.cards)
        player.expeditions_played.clear()

    # 2. Recolhe cartas do mercado
    session.deck.extend(session.market)
    session.market.clear()

    # 3. Embaralha novamente (essencial para a nova temporada)
    random.shuffle(session.deck)    

def apply_site_effects(session: GameSession, player_id: str, track_name: str):
    """
    Aplica bônus imediatos ao atingir certas posições nas trilhas (RF33).
    """
    player = session.players[player_id]
    posicao = player.tracks[track_name]
    lado = session.site_configurations.get(track_name)

    # Lado Básico: Apenas mantém o progresso para pontuação final
    if lado == SiteSide.BASIC:
        return 

    # Lado Avançado (Lado B): Efeitos Ativos
    elif lado == SiteSide.ADVANCED:
        
        # CHICHÉN ITZÁ: Compra de cartas imediata 
        if track_name == "América do Norte":
            # O manual indica que o número de cartas a comprar está ao lado do threshold 
            # Exemplo: Se cruzou o threshold que indica '2', compra 2 cartas do deck 
            # Implementação simplificada baseada na posição (mapear conforme o tabuleiro físico):
            cards_to_draw = {1: 1, 2: 1, 3: 2, 4: 2, 5: 3}.get(posicao, 0)
            for _ in range(cards_to_draw):
                if len(player.hand) < 10: # Respeita o limite de mão
                    draw_card_from_deck(session, player_id)

        # ULURU: Pontuação imediata opcional com reset de veículo 
        elif track_name == "Ásia":
            # Nota: Esta parte exigiria uma interação do usuário ou uma política de IA.
            # Se o jogador optar por pontuar agora:
            pontos_atuais = calculate_track_points(track_name, posicao)
            player.score += pontos_atuais
            player.tracks[track_name] = 0 # Retorna ao espaço mais à esquerda

        # UR: Avanço de veículos (aplica-se se Ur estiver ativo)
        elif track_name == "África":
            # No avanço de veículos de Ur, você pode escolher 1 veículo para avançar
            pass # Lógica depende de como você gerencia os 2 veículos de Ta-Sekhet


def end_season(session: GameSession) -> dict:
    """Finaliza a temporada atual e aplica efeitos de fim de temporada (RF34, RF36, RF40)"""
    
    # RF36 - Resolver efeitos de papéis e locais antes de fechar a temporada
    for player in session.players.values():
        # Exemplo: Efeito do Fotógrafo (ganha pontos por expedições únicas)
        possui_fotografo = any(
            e.leader.role == "Fotógrafo" for e in player.expeditions_played
        )
        if possui_fotografo:
            # Lógica simplificada: +2 pontos por ter um Fotógrafo na mesa
            player.score += 2

    session.season += 1
    session.status = "SEASON_ENDED"
    session.monkeys_found = 0
    
    if session.season > session.max_seasons:
        session.status = "FINISHED"
        return {"event": "GAME_END", "message": "Última temporada finalizada. Partida encerrada!"}
        
    return {"event": "SEASON_END", "message": "Terceiro macaco revelado! Fim da temporada."}