# Archeos Society - Backend Engine 🧭

Este repositório contém o motor de jogo (engine) e a API REST para o **Archeos Society**, um jogo de tabuleiro focado em expedições arqueológicas. O sistema gerencia desde a criação de partidas até a pontuação final, garantindo a integridade das regras e a segurança dos turnos.

## 🚀 Tecnologias Utilizadas

* **Python 3.11/3.12**: Linguagem base do projeto.
* **FastAPI**: Framework web moderno e de alta performance.
* **Pydantic**: Validação de dados e definições de schemas.
* **Pytest**: Framework para testes automatizados.
* **Docker**: Conteinerização com multi-stage build para otimização de imagem.
* **Uvicorn**: Servidor ASGI com suporte a WebSockets.

## 🏗️ Arquitetura do Projeto

O projeto segue uma estrutura modular para separar a lógica de negócio da interface de comunicação:

* **`/app/models/domain.py`**: Modelos de dados, Enums e tabelas de pontuação (Expedições e Trilhas).
* **`/app/core/game_engine.py`**: O núcleo do jogo. Contém a lógica de expedições, efeitos de especialistas, gerenciamento de macacos e cálculos de vitória.
* **`/app/api/`**: Endpoints divididos por responsabilidade:
    * `routes_game.py`: Gestão de partidas e jogadas de expedição.
    * `routes_turn.py`: Gestão de compras e controle de turnos.
* **`/tests/`**: Suite de testes completa validando os requisitos funcionais e não funcionais.

## 📋 Requisitos Implementados

### Funcionais (RF)
* **Gestão de Partida**: Criação de partidas (2-6 jogadores), montagem automática de baralho e definição de temporadas.
* **Temporadas**: Mecânica de "Cartas de Macaco" com encerramento automático ao encontrar o 3º macaco e reset de cartas entre temporadas.
* **Expedições**: Validação de cor/função e efeitos de especialistas (**Guia**, **Médico**, **Professor**, **Fotógrafo**).
* **Trilhas**: Controle de movimentação, bônus de sítios (Lados A/B) e cálculo de pontos por casa.
* **Vitória**: Determinação de vencedor com critério de desempate pela maior expedição da temporada final.

### Não Funcionais (RNF)
* **RNF09**: Controle de turno seguro (impede que um jogador realize ações fora da sua vez).

## 🛠️ Como Executar

### Via Docker (Recomendado)
1. Certifique-se de ter o Docker instalado.
2. Na raiz do projeto, execute:
   ```bash
   docker build -t archeos-backend .
   docker run -p 8000:8000 archeos-backend
   ```
3. Acesse a documentação interativa (Swagger) em: `http://localhost:8000/docs`.

### Localmente
1. Crie um ambiente virtual: `python -m venv venv`.
2. Ative o venv: `source venv/bin/activate` (Linux/Mac) ou `venv\Scripts\activate` (Windows).
3. Instale as dependências: `pip install -r requirements.txt`.
4. Inicie o servidor: `uvicorn app.main:app --reload`.

## 🧪 Testes

Para rodar a bateria de testes e validar todos os requisitos:
```bash
pytest -v
```
Atualmente, o projeto conta com **26 testes** unitários e de integração aprovados.
