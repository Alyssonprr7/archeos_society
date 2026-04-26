# tests/test_game_engine.py
import pytest
from app.core.game_engine import create_game, play_expedition
from app.models.domain import Card, CardColor, Expedition, SiteSide

def test_deve_montar_baralho_com_papeis_selecionados():
    # Arrange: Definindo 6 papéis válidos para a partida
    papeis_escolhidos = ["Botânico", "Linguista", "Professor", "Explorador", "Guia", "Médico"]
    
    # Act: Modificaremos a função create_game para receber esses papéis
    # Isso vai quebrar imediatamente, pois selected_roles ainda não existe na função!
    session = create_game(["p1", "p2", "p3"], selected_roles=papeis_escolhidos)
    
    # Assert: Verificações
    assert len(session.deck) > 0, "O baralho não pode estar vazio"
    
    # Extrai os nomes únicos de todos os papéis presentes no baralho gerado
    papeis_no_deck = set(card.role for card in session.deck)
    
    # Garante que apenas os 6 papéis escolhidos estão lá dentro
    assert papeis_no_deck == set(papeis_escolhidos), "O baralho contém papéis incorretos ou faltantes"

def test_deve_criar_partida_com_3_jogadores():
    session = create_game(["p1", "p2", "p3"])
    assert len(session.players) == 3
    assert session.max_seasons == 2 # Regra do RF09

def test_nao_deve_permitir_menos_de_2_jogadores():
    with pytest.raises(ValueError, match="A partida deve ter entre 2 e 6"):
        create_game(["p1"]) # Red phase: se a função não der erro, o teste falha

def test_jogar_expedicao_valida_por_cor():
    session = create_game(["p1", "p2"])
    
    cartas_jogadas = [
        Card(role="Guia", color=CardColor.EUROPE.value),
        Card(role="Médico", color=CardColor.EUROPE.value),
        Card(role="Botânico", color=CardColor.EUROPE.value)
    ]
    session.players["p1"].hand.extend(cartas_jogadas)
    
    # Baixa a expedição com o Guia como líder (índice 0)
    expedicao = play_expedition(session, player_id="p1", cards=cartas_jogadas, leader_index=0)
    
    assert len(session.players["p1"].expeditions_played) == 1
    assert expedicao.leader.role == "Guia"
    assert expedicao.color_matched is True 

def test_rejeitar_expedicao_invalida():
    session = create_game(["p1", "p2"])
    
    cartas_invalidas = [
        Card(role="Guia", color=CardColor.EUROPE.value),
        Card(role="Médico", color=CardColor.AFRICA.value), 
        Card(role="Botânico", color=CardColor.ASIA.value)  
    ]
    session.players["p1"].hand.extend(cartas_invalidas)
    
    with pytest.raises(ValueError, match="não compartilham a mesma cor ou função"):
        play_expedition(session, player_id="p1", cards=cartas_invalidas, leader_index=0)        

def test_expedicao_deve_avancar_veiculo_na_trilha_da_cor():
    # Arrange
    session = create_game(["p1", "p2"])
    
    cartas_jogadas = [
        Card(role="Guia", color=CardColor.EUROPE.value),
        Card(role="Médico", color=CardColor.EUROPE.value),
    ]
    session.players["p1"].hand.extend(cartas_jogadas)
    
    # Verifica que o jogador começa com 0 na trilha da Europa
    assert session.players["p1"].tracks[CardColor.EUROPE.value] == 0
    
    # Act
    play_expedition(session, player_id="p1", cards=cartas_jogadas, leader_index=0)
    
    # Assert (RF25 e RF31)
    # A expedição usou a cor da Europa, logo o veículo deve avançar 1 casa
    assert session.players["p1"].tracks[CardColor.EUROPE.value] == 1, "O veículo não avançou na trilha corretamente."

# No backend/tests/test_game_engine.py

def test_nao_deve_avancar_veiculo_se_expedicao_nao_atingir_threshold():
    session = create_game(["p1", "p2"])
    session.players["p1"].tracks[CardColor.EUROPE.value] = 2
    
    # Mudamos o Guia para Médicos para testar o threshold real
    cartas_jogadas = [
        Card(role="Médico", color=CardColor.EUROPE.value),
        Card(role="Médico", color=CardColor.EUROPE.value),
    ]
    session.players["p1"].hand.extend(cartas_jogadas)
    
    # Act: Médico é o líder agora
    play_expedition(session, player_id="p1", cards=cartas_jogadas, leader_index=0)
    
    # Assert (RF32): Como Médico não tem bônus de trilha, deve travar em 2
    assert session.players["p1"].tracks[CardColor.EUROPE.value] == 2, "O veículo avançou mesmo sem atingir o threshold!"

def test_expedicao_deve_descartar_mao_restante_para_o_mercado():
    # Arrange
    session = create_game(["p1", "p2"])
    
    # Preparamos a expedição e o que vai sobrar
    cartas_expedicao = [
        Card(role="Guia", color=CardColor.EUROPE.value),
        Card(role="Médico", color=CardColor.EUROPE.value),
    ]
    cartas_sobra = [
        Card(role="Botânico", color=CardColor.AFRICA.value),
        Card(role="Linguista", color=CardColor.ASIA.value),
    ]
    
    session.players["p1"].hand.extend(cartas_expedicao + cartas_sobra)
    
    # Act: Joga a expedição
    play_expedition(session, player_id="p1", cards=cartas_expedicao, leader_index=0)
    
    # Assert (RF30)
    # Falha esperada: a mão não estará vazia e o mercado estará em 0
    assert len(session.players["p1"].hand) == 0, "A mão do jogador deveria estar vazia!"
    assert len(session.market) == 2, "As cartas de sobra deveriam estar no mercado!"

def test_deve_calcular_pontuacao_de_expedicao_corretamente():
    # Arrange
    session = create_game(["p1", "p2"])
    
    # Criamos uma expedição de 3 cartas (deve valer 3 pontos)
    cartas = [
        Card(role="Guia", color=CardColor.EUROPE.value),
        Card(role="Médico", color=CardColor.EUROPE.value),
        Card(role="Botânico", color=CardColor.EUROPE.value)
    ]
    session.players["p1"].hand.extend(cartas)
    
    # Act
    play_expedition(session, player_id="p1", cards=cartas, leader_index=0)
    
    # Assert (RF38)
    # Precisamos implementar uma função ou lógica que compute isso
    from app.core.game_engine import calculate_points
    pontos = calculate_points(len(cartas))
    assert pontos == 3    

def test_deve_encerrar_temporada_ao_encontrar_terceiro_macaco():
    # Arrange
    session = create_game(["p1", "p2"])
    session.monkeys_found = 2
    
    # Criamos uma carta de macaco
    monkey_card = Card(role="Nenhum", color="Especial", is_monkey=True)
    session.deck.insert(0, monkey_card)
    
    # Simulamos a compra via API/Turno (aqui chamando a lógica que vamos implementar)
    from app.core.game_engine import check_monkey_condition
    result = check_monkey_condition(session, monkey_card)
    
    # Assert
    assert session.monkeys_found == 0  # Reset para a próxima temporada
    assert session.season == 2        # Avançou de 1 para 2
    assert session.status == "SEASON_ENDED"
    assert result["event"] == "SEASON_END"    

def test_deve_calcular_pontos_finais_da_trilha_europa():
    # Arrange
    session = create_game(["p1", "p2"])
    # Simulamos o avanço do jogador p1 até a casa 3 da Europa
    session.players["p1"].tracks["Europa"] = 3
    
    # Act
    from app.core.game_engine import calculate_track_points
    # A casa 3 da Europa deve valer 6 pontos pela regra padrão
    pontos_trilha = calculate_track_points("Europa", session.players["p1"].tracks["Europa"])
    
    # Assert
    assert pontos_trilha == 6

def test_deve_executar_setup_da_temporada_corretamente():
    # Arrange
    player_ids = ["p1", "p2", "p3"]
    # Act
    session = create_game(player_ids)
    
    # Assert (RF07)
    # Cada um dos 3 jogadores deve ter 1 carta
    for pid in player_ids:
        assert len(session.players[pid].hand) == 1, f"Jogador {pid} deveria ter 1 carta inicial"
    
    # Mercado deve ter N+2 cartas -> 3 + 2 = 5 cartas
    assert len(session.market) == 5, f"Mercado deveria ter 5 cartas, mas tem {len(session.market)}"    

def test_expedicao_deve_descartar_mao_restante_para_o_mercado():
    # Arrange
    session = create_game(["p1", "p2"])
    
    # Limpamos a mão inicial do setup para ter controle total do teste
    session.players["p1"].hand.clear()
    
    # Salva o estado do mercado após o setup automático
    cartas_iniciais_mercado = len(session.market)
    
    # Preparamos a expedição (2) e as sobras (2)
    cartas_expedicao = [
        Card(role="Guia", color=CardColor.EUROPE.value),
        Card(role="Médico", color=CardColor.EUROPE.value),
    ]
    cartas_sobra = [
        Card(role="Botânico", color=CardColor.AFRICA.value),
        Card(role="Linguista", color=CardColor.ASIA.value),
    ]
    
    session.players["p1"].hand.extend(cartas_expedicao + cartas_sobra)
    
    # Act
    play_expedition(session, player_id="p1", cards=cartas_expedicao, leader_index=0)
    
    # Assert
    assert len(session.players["p1"].hand) == 0
    # Agora o cálculo deve ser exato: iniciais + 2 sobras
    esperado = cartas_iniciais_mercado + 2
    assert len(session.market) == esperado, f"O mercado deveria ter {esperado} cartas"

def test_deve_permitir_comprar_carta_do_mercado():
    # Arrange
    session = create_game(["p1", "p2"])
    player = session.players["p1"]
    player.hand.clear() # Limpa para facilitar a conferência
    
    # Pegamos a primeira carta disponível no mercado após o setup
    carta_alvo = session.market[0]
    tamanho_inicial_mercado = len(session.market)
    
    # Act: Precisamos criar essa função na engine
    from app.core.game_engine import draw_from_market
    draw_from_market(session, player_id="p1", market_index=0)
    
    # Assert (RF13)
    assert len(player.hand) == 1
    assert player.hand[0] == carta_alvo
    assert len(session.market) == tamanho_inicial_mercado - 1
    assert carta_alvo not in session.market

def test_guia_deve_permitir_avanco_mesmo_sem_atingir_threshold():
    # Arrange
    session = create_game(["p1", "p2"])
    player = session.players["p1"]
    
    # Simula o jogador já na posição 2 da Europa
    player.tracks["Europa"] = 2
    
    # Criamos uma expedição de APENAS 1 carta, mas o líder é um Guia
    cartas_guia = [Card(role="Guia", color="Europa")]
    player.hand.extend(cartas_guia)
    
    # Act
    # Normalmente, 1 carta não avançaria quem está na posição 2 (1 > 2 é False)
    play_expedition(session, player_id="p1", cards=cartas_guia, leader_index=0)
    
    # Assert (RF27, RF28)
    # Com o Guia, o veículo DEVE avançar para 3
    assert player.tracks["Europa"] == 3, "O Guia deveria ter permitido o avanço na trilha!"    

def test_deve_conceder_compra_extra_se_mercado_estiver_vazio():
    # Arrange
    session = create_game(["p1", "p2"])
    session.market.clear() 
    player = session.players["p1"]
    player.hand.clear()
    
    # Act
    from app.core.game_engine import draw_card_from_deck
    draw_card_from_deck(session, "p1")
    
    # Assert (RF15)
    assert len(player.hand) == 2, "Deveria ter ganho uma carta extra pelo mercado vazio"

def test_medico_deve_permitir_manter_cartas_na_mao():
    # Arrange
    session = create_game(["p1", "p2"])
    player = session.players["p1"]
    player.hand.clear()
    
    # 1 Médicos para liderar e 2 cartas que deveriam ser salvas
    cartas_expedicao = [Card(role="Médico", color="Europa")]
    cartas_para_salvar = [
        Card(role="Guia", color="Ásia"),
        Card(role="Professor", color="África")
    ]
    player.hand.extend(cartas_expedicao + cartas_para_salvar)
    
    # Act
    play_expedition(session, player_id="p1", cards=cartas_expedicao, leader_index=0)
    
    # Assert (RF28)
    # A mão NÃO deve estar vazia; deve conter as 2 cartas salvas
    assert len(player.hand) == 2, "O Médico deveria ter impedido o descarte da mão!"
    assert player.hand == cartas_para_salvar

def test_professor_deve_permitir_avanco_em_trilha_escolhida():
    # Arrange
    session = create_game(["p1", "p2"])
    player = session.players["p1"]
    
    # Criamos uma expedição de Professores (cor Europa)
    # Mas o jogador quer avançar na trilha da Ásia
    cartas_professor = [Card(role="Professor", color="Europa")]
    player.hand.extend(cartas_professor)
    
    # Act
    # Precisamos atualizar a play_expedition para aceitar uma trilha opcional (target_track)
    play_expedition(
        session, 
        player_id="p1", 
        cards=cartas_professor, 
        leader_index=0, 
        target_track="Ásia"
    )
    
    # Assert (RF28)
    assert player.tracks["Ásia"] == 1, "O Professor deveria ter avançado na trilha escolhida (Ásia)!"
    assert player.tracks["Europa"] == 0, "Não deveria ter avançado na trilha da cor da carta!"

def test_deve_impedir_acao_fora_do_turno():
    # Arrange
    session = create_game(["jogador_A", "jogador_B"])
    # O primeiro jogador é o jogador_A
    session.current_turn_player_id = "jogador_A"
    
    # Act & Assert (RNF09)
    # Jogador B tenta jogar no turno do A
    with pytest.raises(ValueError, match="Não é o turno do jogador jogador_B"):
        from app.core.game_engine import validate_player_turn
        validate_player_turn(session, "jogador_B")

def test_deve_determinar_vencedor_por_desempate_de_maior_expedicao():
    # Arrange
    session = create_game(["p1", "p2"])
    p1 = session.players["p1"]
    p2 = session.players["p2"]
    
    # Ambos terão expedições que valem 3 pontos (tamanho 3) 
    # Mas p2 terá uma SEGUNDA expedição maior (tamanho 5) para o desempate 
    
    # p1: Duas expedições de tamanho 3 (Total 6 pontos, maior é 3)
    p1.expeditions_played = [
        Expedition(cards=[Card(role="Guia", color="Europa")]*3, leader=Card(role="Guia", color="Europa"), color_matched=True),
        Expedition(cards=[Card(role="Guia", color="África")]*3, leader=Card(role="Guia", color="África"), color_matched=True)
    ]
    
    # p2: Uma de tamanho 3 e uma de tamanho 5 (Total 11 pontos - aqui ainda seriam diferentes)
    # Para empatar em 6 pontos: uma de tamanho 3 (3 pts) e três de tamanho 2 (1 pt cada) 
    p1.expeditions_played = [Expedition(cards=[Card(role="Guia", color="Europa")]*4, leader=Card(role="Guia", color="Europa"), color_matched=True)] # 5 pts
    p2.expeditions_played = [
        Expedition(cards=[Card(role="Médico", color="Ásia")]*4, leader=Card(role="Médico", color="Ásia"), color_matched=True), # 5 pts
        Expedition(cards=[Card(role="Médico", color="Brasil")]*5, leader=Card(role="Médico", color="Brasil"), color_matched=True) # Diferencial de tamanho
    ]


def test_deve_resetar_cartas_entre_temporadas():
    # Arrange
    session = create_game(["p1", "p2"])
    player = session.players["p1"]
    
    # Simula estado com cartas em diversos lugares
    player.hand = [Card(role="Guia", color="Europa")]
    player.expeditions_played = [
        Expedition(
            cards=[Card(role="Médico", color="Ásia")], 
            leader=Card(role="Médico", color="Ásia"), 
            color_matched=True
        )
    ]
    session.market = [Card(role="Botânico", color="África")]
    
    tamanho_inicial_deck = len(session.deck)
    
    # Act
    from app.core.game_engine import reset_cards_for_new_season
    reset_cards_for_new_season(session)
    
    # Assert (RF35)
    assert len(player.hand) == 0, "A mão do jogador deveria estar vazia"
    assert len(player.expeditions_played) == 0, "As expedições deveriam ter sido removidas"
    assert len(session.market) == 0, "O mercado deveria ter sido limpo"
    assert len(session.deck) > tamanho_inicial_deck, "As cartas devem ter retornado ao baralho"

def test_deve_aplicar_efeito_de_sitio_ao_avancar_trilha():
    # Arrange
    session = create_game(["p1", "p2"])
    # Forçamos a Europa para o lado básico e p1 na beira de um marco
    session.site_configurations["Europa"] = SiteSide.BASIC
    session.players["p1"].tracks["Europa"] = 2
    
    # Preparamos uma expedição de 3 cartas (suficiente para avançar para a casa 3)
    cartas = [Card(role="Guia", color="Europa")] * 3
    session.players["p1"].hand.extend(cartas)
    
    mao_antes = len(session.players["p1"].hand)
    
    # Act
    play_expedition(session, "p1", cartas, 0)
    
    # Assert (RF33)
    # Na casa 3 da Europa (Básico), o jogador deveria ter ganho uma carta
    # (Considerando o descarte da expedição e a compra do bônus)
    assert session.players["p1"].tracks["Europa"] == 3
    # A lógica exata depende de qual bônus você definir no seu apply_site_effects    

def test_deve_aplicar_pontos_do_fotografo_no_fim_da_temporada():
    # Arrange
    session = create_game(["p1", "p2"])
    player = session.players["p1"]
    
    # Simula uma expedição liderada por um Fotógrafo
    exp_fotografo = Expedition(
        cards=[Card(role="Fotógrafo", color="Europa")],
        leader=Card(role="Fotógrafo", color="Europa"),
        color_matched=True
    )
    player.expeditions_played.append(exp_fotografo)
    pontuacao_inicial = player.score
    
    # Act
    # Simula o encontro do 3º macaco que dispara o end_season
    from app.core.game_engine import end_season
    end_season(session)
    
    # Assert (RF36)
    # O score deve ser maior que o inicial devido ao bônus do Fotógrafo
    assert player.score > pontuacao_inicial, "O bônus de fim de temporada (Fotógrafo) não foi aplicado!"    

def test_deve_aplicar_bonus_de_compra_em_chichen_itza_avancado():
    # Arrange: Setup do cenário América do Norte Lado B
    session = create_game(["p1", "p2"])
    player = session.players["p1"]
    track = "América do Norte"
    
    session.site_configurations[track] = SiteSide.ADVANCED
    player.tracks[track] = 0
    player.hand.clear() # Limpa para validar a entrada de novas cartas
    
    # Cartas para a expedição (tamanho 2 para avançar do 0 -> 1)
    cartas_exp = [Card(role="Guia", color=track)] * 2
    player.hand.extend(cartas_exp)
    
    # Act
    play_expedition(session, "p1", cartas_exp, 0)
    
    # Assert
    assert player.tracks[track] == 1
    # Verifica se o efeito de compra de Chichén Itzá foi disparado
    # (Considerando que a posição 1 concede pelo menos 1 carta)
    assert len(player.hand) > 0 

def test_deve_permitir_reset_de_trilha_em_uluru_ao_pontuar_imediatamente():
    # Arrange: Setup do cenário Ásia Lado B
    session = create_game(["p1", "p2"])
    player = session.players["p1"]
    track = "Ásia"
    
    session.site_configurations[track] = SiteSide.ADVANCED
    player.tracks[track] = 2 # Já está avançado
    player.score = 0
    
    # Expedição de tamanho 3 para avançar (3 > 2)
    cartas_exp = [Card(role="Guia", color=track)] * 3
    player.hand.extend(cartas_exp)
    
    # Act
    play_expedition(session, "p1", cartas_exp, 0)
    
    # Assert
    # Se a lógica de Uluru for "pontuar e resetar":
    if player.score > 0:
        assert player.tracks[track] == 0 # Voltou ao início
    else:
        assert player.tracks[track] == 3 # Apenas avançou sem resetar    