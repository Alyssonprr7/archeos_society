# Estratégia de Desenvolvimento — Archeos Society

## Equipe

| Membro | Papel |
|--------|-------|
| A | Tech Lead / DevOps — branches, PRs, CI, integração |
| B | Frontend — Lobby, Setup, SeasonEnd, GameEnd |
| C | Frontend — Game screen, mecânica de macaco, Expedition |
| D | Backend — Criação de partida e turno (RF01–RF20) |
| E | Backend — Expedição e fim de temporada (RF21–RF39) |
| F | Backend + Integração — Pontuação, vencedor, testes (RF37–RF42) |

---

## Estratégia de Ramificação

```
main          ← produção / entregas estáveis
└── develop   ← integração (toda feature converge aqui antes de ir para main)
    ├── feature/lobby-setup
    ├── feature/game-screen
    ├── feature/expedition-screen
    ├── feature/season-game-end
    ├── feature/backend-game-setup
    ├── feature/backend-turn
    ├── feature/backend-expedition
    ├── feature/backend-scoring
    └── ci/github-actions
```

**Regras:**
- Nenhum commit direto em `main` ou `develop`
- Toda branch parte de `develop` e volta via **Pull Request com ao menos 1 aprovação**
- Nome das branches: `feature/<descricao>` ou `fix/<descricao>`
- Toda PR deve referenciar a Issue do RF correspondente (`Closes #N`)

---

## Cronograma (03/05 – 12/05)

| Data | Entrega |
|------|---------|
| **03/05** | Setup do projeto: branch `develop`, Issues no GitHub (RF01–RF42 + RNF01–RNF09), CI configurado |
| **04/05** | RF01–RF09: criação de partida, baralho, sítios, jogadores, temporadas (backend + Lobby/Setup frontend) |
| **05/05** | RF10–RF16: ordem de turno, compra de cartas, limite de mão |
| **06/05** | RF17–RF24: mecânica de macaco, início da validação de expedição |
| **07/05** | RF25–RF33: expedição completa, efeitos de papéis, sítios arqueológicos |
| **08/05** | RF34–RF42: fim de temporada, pontuação, vencedor, desempate |
| **09/05** | Integração geral: conectar frontend ↔ backend |
| **10/05** | Testes de cenários borda, polimento, monitoramento (EV/PV) |
| **11/05** | Ensaio da demo, preparação dos slides |
| **12/05** | Apresentação |

---

## Controle de Modificações

- **Issues no GitHub**: uma por RF/RNF — rastreiam o que foi pedido e quando foi entregue
- **Pull Requests**: vinculam código às Issues com `Closes #N`; exigem aprovação antes do merge
- **GitHub Actions**: CI roda build do frontend + testes do backend a cada push em `develop` e `main`
- **EV/PV por membro**: medido por Issues fechadas e commits por autor (`git shortlog -sn`)
