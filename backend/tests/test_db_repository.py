import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.database import Base
from app.db.repository import save_game_state, load_game_state
from app.core.game_engine import create_game

# 1. Configura um banco de dados SQL em MEMÓRIA RAM (super rápido e volátil)
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 2. Fixture do Pytest para injetar o banco nos testes
@pytest.fixture
def db():
    # Cria as tabelas antes do teste
    Base.metadata.create_all(bind=engine)
    db_session = TestingSessionLocal()
    
    yield db_session # Entrega o banco para o teste usar
    
    # Após o teste terminar, fecha a conexão e apaga as tabelas
    db_session.close()
    Base.metadata.drop_all(bind=engine)

def test_salvar_e_carregar_novo_jogo(db):
    # Arrange: Cria um jogo usando a nossa engine já testada
    session = create_game(["jogador_1", "jogador_2"])
    
    # Act: Salva no banco e tenta carregar de volta
    save_game_state(db, session)
    sessao_carregada = load_game_state(db, session.game_id)
    
    # Assert
    assert sessao_carregada is not None
    assert sessao_carregada.game_id == session.game_id
    assert len(sessao_carregada.players) == 2
    assert sessao_carregada.status == session.status
    # Valida se a mão do jogador foi preservada na conversão
    assert len(sessao_carregada.players["jogador_1"].hand) == 1 

def test_atualizar_jogo_existente(db):
    # Arrange: Salva a partida inicial
    session = create_game(["jogador_1", "jogador_2"])
    save_game_state(db, session)
    
    # Simula o avanço do jogo (jogador ganha 42 pontos e avança na trilha)
    session.players["jogador_1"].score = 42
    session.players["jogador_1"].tracks["Europa"] = 3
    
    # Act: Salva novamente (deve fazer um UPDATE)
    save_game_state(db, session)
    sessao_atualizada = load_game_state(db, session.game_id)
    
    # Assert: Verifica se as alterações foram salvas corretamente
    assert sessao_atualizada.players["jogador_1"].score == 42
    assert sessao_atualizada.players["jogador_1"].tracks["Europa"] == 3

def test_carregar_jogo_inexistente_retorna_none(db):
    # Act
    resultado = load_game_state(db, "game_id_invalido_123")
    
    # Assert
    assert resultado is None