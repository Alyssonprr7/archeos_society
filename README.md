# Archeos Society - Digital Edition 🏛️🃏

Este projeto é uma implementação digital do jogo de tabuleiro **Archeos Society**, de Paolo Mori, desenvolvido como parte da disciplina de Gerência de Projetos na **Universidade Federal Fluminense (UFF)**.

O sistema permite que 2 a 6 jogadores compitam em expedições arqueológicas, gerenciando especialistas e recursos para acumular o maior prestígio ao longo de múltiplas temporadas.

## 🚀 Stack Tecnológica

- **Frontend:** [Next.js 14+](https://nextjs.org/) (App Router, TypeScript, Tailwind CSS)
- **Backend:** [FastAPI](https://fastapi.tiangolo.com/) (Python 3.11)
- **Estado Global:** [Zustand](https://docs.pmnd.rs/zustand/getting-started/introduction)
- **Infraestrutura:** Docker & Docker Compose
- **Comunicação:** WebSockets para atualizações em tempo real (Fim de Temporada/Turnos)

## 🛠️ Arquitetura e Decisões de Projeto

O projeto segue uma arquitetura de microserviços simplificada para garantir a separação de preocupações (**RNF07**):

1.  **Core Engine (Backend):** Responsável por validar todas as regras do manual, como o limite de 10 cartas na mão e o gatilho da 3ª carta de macaco.
2.  **Interface (Frontend):** Desenvolvida em Next.js para alta performance e SEO-friendly (manual do jogo). O estado local é gerido pelo Zustand para evitar re-renderizações desnecessárias.

## 📋 Regras Implementadas (MVP)

- [x] **Gestão de Mão:** Limite estrito de 10 cartas.
- [x] **Mecânica de Macacos:** Revelação da 3ª carta encerra a temporada imediatamente.
- [x] **Expedições:** Lógica de líderes e bônus por cor de região.
- [x] **Sítios Arqueológicos:** Progressão de veículos e pontuação diferenciada (Estrela Grande/Pequena).

## 🐳 Como Executar (Docker)

Certifique-se de ter o Docker e o Docker Compose instalados.

1. Clone o repositório:
   ```bash
   git clone [https://github.com/seu-usuario/archeos_society.git](https://github.com/seu-usuario/archeos_society.git)
   cd archeos_society