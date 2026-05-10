import uuid
import random
from typing import List, Dict, Optional
from app.models.domain import (
    GameSession, Player, Card, CardColor, Expedition, 
    SCORE_TABLE, TRACK_SCORE_TABLES, SiteSide 
)

active_games: Dict[str, GameSession] = {}

def start_season_setup(session: GameSession):
    """Executa o setup inicial da temporada com partição de macacos (RF07)"""
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

    # --- NOVA LÓGICA DE PARTIÇÃO (RF07/US07) ---
    # 3. Divide o baralho restante em duas pilhas semelhantes
    cartas_restantes = session.deck
    meio = len(cartas_restantes) // 2
    pilha_superior = cartas_restantes[:meio]
    pilha_inferior = cartas_restantes[meio:]

    # 4. Embaralha os 3 macacos apenas na pilha inferior
    macacos = [Card(role="Macaco", color="Especial", is_monkey=True) for _ in range(3)]
    pilha_inferior.extend(macacos)
    random.shuffle(pilha_inferior)

    # 5. Remonta o deck: Superior (limpa) sobre Inferior (com macacos)
    session.deck = pilha_superior + pilha_inferior

def create_game(
    player_ids: List[str], 
    selected_roles: List[str] = None,
    site_configs: Dict[str, SiteSide] = None 
) -> GameSession:
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
        player_order=player_ids.copy(),
        current_turn_player_id=player_ids[0],
        status="PLAYING"
    )
    
    if site_configs:
        session.site_configurations.update(site_configs)
    
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
    target_track: Optional[str] = None,
    choose_to_score: bool = False, # Para Uluru
    move_extra_vehicle: bool = False, # Para Ta-Sekhet-Ma'at
    is_final_ur_round: bool = False
) -> Expedition:
    """Valida e baixa uma expedição para a mesa (RF21 a RF32)"""
    
    if not cards:
        raise ValueError("Uma expedição precisa de pelo menos uma carta.")
        
    # Nova Restrição: Turno Final de Ur (Ásia B)
    if is_final_ur_round:
        limite_ur = session.players[player_id].tracks.get("Ásia", 0) + 1 # Ex: Posição 1 limita a 2 cartas
        if len(cards) > limite_ur:
            raise ValueError("Tamanho da expedição excede o limite de Ur.")
        
    if leader_index < 0 or leader_index >= len(cards):
        raise ValueError("Índice do líder inválido.")
        
    leader = cards[leader_index]
    player = session.players.get(player_id)
    
    if not player:
        raise ValueError("Jogador não encontrado na partida.")

    # RF28 - Restrição do Mercenário
    if leader.role == "Mercenário":
        raise ValueError("Um Mercenário não pode ser o líder da expedição.")
    
    # Validação de integridade da expedição (Mercenário age como coringa)
    cartas_normais = [card for card in cards if card.role != "Mercenário"]
    color_match = all(card.color == leader.color for card in cartas_normais)
    role_match = all(card.role == leader.role for card in cartas_normais)

    if not (color_match or role_match):
        raise ValueError("As cartas não compartilham a mesma cor ou função.")
        
    # Remoção das cartas da mão
    for played_card in cards:
        card_in_hand = next((c for c in player.hand if c.role == played_card.role and c.color == played_card.color), None)
        if card_in_hand:
            player.hand.remove(card_in_hand)
        else:
            raise ValueError(f"O jogador não possui a carta {played_card.role} ({played_card.color}) na mão.")

    # 1. PROCESSA MOVIMENTAÇÃO (Guia, Piloto, Professor, Estudante)
    trilha_alvo = target_track if (leader.role in ["Piloto", "Professor"] and target_track) else leader.color
    avancou = False
    
    if leader.role == "Linguista":
        player.linguist_track += 1
    elif leader.role != "Estudante" and trilha_alvo in player.tracks:
        posicao_atual = player.tracks[trilha_alvo]
        if leader.role == "Guia" or len(cards) > posicao_atual:
            player.tracks[trilha_alvo] += 1
            avancou = True

    # 2. DESCARTE OBRIGATÓRIO (RF30) - CRÍTICO: Deve vir ANTES dos bônus de compra/sítios
    # Isso impede que o bônus do Patrono ou Chichén Itzá seja descartado 
    if player.hand and leader.role not in ["Médico", "Cartógrafo"]:
        session.market.extend(player.hand)
        player.hand.clear()

    # 3. APLICA EFEITOS DE SÍTIO (Agora a mão está limpa para novos bônus)
    if avancou:
        apply_site_effects(session, player_id, trilha_alvo, choose_to_score, move_extra_vehicle)

    # 4. HABILIDADE DO PATRONO (RF28)
    if leader.role == "Patrono":
        for _ in range(len(cards)):
            if len(player.hand) < 10 and session.deck:
                drawn_card = session.deck.pop(0)
                # Devolve macacos ao deck para não disparar fim de temporada em bônus 
                if drawn_card.is_monkey: session.deck.insert(0, drawn_card)
                else: player.hand.append(drawn_card)
                    
    # 5. HABILIDADE DO BOTÂNICO, CURADOR E PROFESSOR
    if leader.role == "Botânico":
        session.botanist_frame_player_id = player_id
    elif leader.role == "Curador":
        player.relics += 1
    elif leader.role == "Professor":
        player.professor_tokens.append(min(len(cards), 6))
            
    expedition = Expedition(cards=cards.copy(), leader=leader, color_matched=color_match)
    player.expeditions_played.append(expedition)
    player.score += calculate_points(get_expedition_effective_size(expedition))
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
    """Finaliza a temporada e aplica efeitos oficiais (RF34, RF36, RF38)"""
    
    # 1. PONTUAÇÃO DE RELÍQUIAS (expedições já pontuam em tempo real ao serem jogadas)
    for player in session.players.values():
        player.score += calculate_relic_score(player.relics)

    # 2. LINGUISTA: +2 pontos apenas para o líder
    pos_ling = [p.linguist_track for p in session.players.values()]
    max_ling = max(pos_ling) if pos_ling else 0
    if max_ling > 0:
        for p in session.players.values():
            if p.linguist_track == max_ling: p.score += 2

    # 3. PROFESSOR: Bônus de avanço e penalidade de recuo
    somas = {pid: sum(getattr(p, "professor_tokens", [])) for pid, p in session.players.items()}
    val_somas = list(somas.values())
    if val_somas:
        max_prof, min_prof = max(val_somas), min(val_somas)
        for pid, p in session.players.items():
            trilha_alvo = max(p.tracks, key=p.tracks.get) if p.tracks else "Europa"
            if max_prof > 0 and somas[pid] == max_prof: 
                p.tracks[trilha_alvo] += 1
            if somas[pid] == min_prof and p.tracks.get(trilha_alvo, 0) > 0: 
                p.tracks[trilha_alvo] -= 1
            p.professor_tokens.clear()

    # 4. PONTUAÇÃO DE TRILHAS (Com separação explícita de Lados)
    for pid, player in session.players.items():
        for track, pos in player.tracks.items():
            lado = session.site_configurations.get(track, SiteSide.BASIC)
            
            if track == "América do Sul":
                if lado == SiteSide.BASIC:
                    player.score += calculate_track_points(track, pos)
                elif lado == SiteSide.ADVANCED:
                    pos_extra = player.extra_vehicles.get("América do Sul", 0)
                    pos_efetiva = min(pos, pos_extra)
                    player.score += calculate_track_points(track, pos_efetiva)
                    
            elif track == "Europa":
                if lado == SiteSide.BASIC:
                    player.score += calculate_track_points(track, pos)
                elif lado == SiteSide.ADVANCED:
                    ocupantes = [p.tracks["Europa"] for p in session.players.values() if p.tracks["Europa"] == pos]
                    if len(ocupantes) == 1:
                        player.score += calculate_track_points(track, pos) + 10 
                    else:
                        player.score += calculate_track_points(track, pos) + 5
                        
            elif track == "Ásia":
                # Em Ur, tanto o lado Básico quanto o Avançado ganham pontos pela tabela normalmente.
                # (A diferença do avançado é o turno extra, resolvido na play_expedition)
                player.score += calculate_track_points(track, pos)
                
            else:
                # Trata América do Norte, África e Oceania (pontuação base)
                player.score += calculate_track_points(track, pos)

    # 4.1 RAPA NUI (Oceania - Bônus do Lado Avançado pós-pontuação)
    if session.site_configurations.get("Oceania") == SiteSide.ADVANCED:
        pos_oceania = [p.tracks.get("Oceania", 0) for p in session.players.values()]
        max_oceania = max(pos_oceania) if pos_oceania else 0
        
        if max_oceania > 0:
            for p in session.players.values():
                if p.tracks.get("Oceania", 0) == max_oceania:
                    p.score += 3
                    p.tracks["Oceania"] = 0 # Reset de liderança

    # 4.1 RAPA NUI (Oceania - Lado Avançado)
    if session.site_configurations.get("Oceania") == SiteSide.ADVANCED:
        # Encontra a posição máxima
        pos_oceania = [p.tracks.get("Oceania", 0) for p in session.players.values()]
        max_oceania = max(pos_oceania) if pos_oceania else 0
        if max_oceania > 0:
            for p in session.players.values():
                if p.tracks.get("Oceania", 0) == max_oceania:
                    p.score += 3
                    p.tracks["Oceania"] = 0 # Retorna ao espaço mais à esquerda                   

    # 5. BOTÂNICO: +2 pontos e reset
    if getattr(session, "botanist_frame_player_id", None):
        dono = session.players.get(session.botanist_frame_player_id)
        if dono: dono.score += 2
        session.botanist_frame_player_id = None

    # 6. RESET DE CARTAS (RF35)
    reset_cards_for_new_season(session)

    if session.season >= session.max_seasons:
        session.status = "FINISHED"
        return {"event": "GAME_FINISHED", "message": "Jogo encerrado."}
    else:
        # Prepara a próxima temporada
        session.season += 1
        session.monkeys_found = 0
        
        # O setup inicial é feito, mas o status deve sinalizar o fim da temporada anterior
        start_season_setup(session)
        session.status = "SEASON_ENDED" # <--- Mantenha como SEASON_ENDED
        
        return {"event": "SEASON_END", "message": "Nova temporada iniciada."}

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

    # Repõe o mercado com uma carta do deck
    if session.deck:
        drawn = session.deck.pop(0)
        if drawn.is_monkey:
            check_monkey_condition(session, drawn)
        else:
            session.market.append(drawn)

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
        # Se a temporada ACABOU, interrompemos o fluxo e não avançamos o turno
        if session.status in ["SEASON_ENDED", "FINISHED"]:
            return drawn_card # Retorna o macaco para sinalizar o fim na API
            
        # Se achou macaco mas a temporada NÃO acabou, o jogador tenta comprar de novo (RF19)
        return draw_card_from_deck(session, player_id)

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


def apply_site_effects(
    session: GameSession, 
    player_id: str, 
    track_name: str, 
    choose_to_score: bool = False,
    move_extra_vehicle: bool = False
):
    player = session.players[player_id]
    lado = session.site_configurations.get(track_name)

    if lado == SiteSide.ADVANCED:
        # --- EUROPA: MESA VERDE (Exemplo de Bônus de Compra ou Avanço Extra) ---
        if track_name == "Europa":
            # Se a expedição que causou o avanço for grande (ex: size >= 3), 
            # o jogador ganha uma carta extra do deck.
            if session.deck and len(player.hand) < 10:
                player.hand.append(session.deck.pop(0))

        # --- ÁFRICA: (Exemplo de ganho imediato de pontos ao avançar) ---
        elif track_name == "África":
            player.score += 2

        # --- AMÉRICA DO NORTE: CHICHÉN ITZÁ (Compra ao avançar) ---
        elif track_name == "América do Norte":
            if session.deck and len(player.hand) < 10:
                player.hand.append(session.deck.pop(0))

        # --- OCEANIA: ULURU ---
        elif track_name == "Oceania" and choose_to_score:
            pos = player.tracks["Oceania"]
            player.score += calculate_track_points("Oceania", pos)
            player.tracks["Oceania"] = 0 # Retorna ao início 

        # --- ÁSIA: TA-SEKHET-MA'AT ---
        elif track_name == "Ásia":
            if move_extra_vehicle:
                player.extra_vehicles["Ásia"] += 1
            else:
                player.tracks["Ásia"] += 1
            # Nota: No fim da temporada, pontua apenas o mais atrasado

def resolve_expedition_turn_end(session: GameSession, player: Player, expedition: Expedition):
    """
    Resolve o estado do jogo após uma expedição ser jogada.
    Verifica se o jogador tem direito a um turno extra (ex: Cartógrafo).
    Se não tiver, passa o turno.
    """
    if expedition.leader.role == "Cartógrafo" and len(player.hand) > 0:
        # Turno extra concedido. O turno NÃO avança.
        # No MVP, podemos adicionar uma flag ao jogador ou à sessão se necessário para o frontend,
        # mas manter o current_turn_player_id é suficiente para a lógica do backend.
        return
        
    # Se não for Cartógrafo, ou se for mas a mão estiver vazia (sem cartas para jogar), o turno passa.
    advance_turn(session)    

def get_expedition_effective_size(expedition: Expedition) -> int:
    """Calcula o tamanho da expedição removendo Mercenários e aplicando bônus do Fotógrafo"""
    # Remove mercenários da contagem
    tamanho_base = len([c for c in expedition.cards if c.role != "Mercenário"])
    
    # Bônus do Fotógrafo (+1 no tamanho da expedição para pontuação/avanço)
    if expedition.leader.role == "Fotógrafo":
        tamanho_base += 1
        
    return tamanho_base

def calculate_relic_score(relics: int) -> int:
    # Tabela progressiva: 1:1, 2:3, 3:6, 4:10, 5:15, 6+:21 
    table = {0: 0, 1: 1, 2: 3, 3: 6, 4: 10, 5: 15}
    return table.get(relics, 21 if relics >= 6 else 0)

def prepare_deck_with_monkeys(session: GameSession):
    # Assume que o deck já tem as cartas normais e já distribuiu mão/mercado
    cartas_restantes = session.deck
    random.shuffle(cartas_restantes)
    
    meio = len(cartas_restantes) // 2
    pilha_superior = cartas_restantes[:meio]
    pilha_inferior = cartas_restantes[meio:]
    
    # Criar e adicionar os 3 macacos na pilha inferior
    macacos = [Card(role="Macaco", color="Especial", is_monkey=True) for _ in range(3)]
    pilha_inferior.extend(macacos)
    random.shuffle(pilha_inferior)
    
    # Montar o deck final: Superior (limpa) sobre Inferior (com macacos)
    session.deck = pilha_superior + pilha_inferior    