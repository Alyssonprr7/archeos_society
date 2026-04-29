from fastapi import FastAPI
from app.api.routes_game import router as game_router
from app.api.routes_turn import router as turn_router

from app.db.database import engine, Base
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Archeos Society Engine",
    description="Backend API para gerenciamento do jogo de tabuleiro Archeos Society",
    version="1.0.0"
)

# Registrando os módulos na aplicação principal
app.include_router(game_router)
app.include_router(turn_router)

@app.get("/")
async def root():
    return {
        "status": "online", 
        "message": "Archeos Society API operante. Acesse /docs para visualizar o Swagger."
    }