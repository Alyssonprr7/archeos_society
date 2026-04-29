from sqlalchemy import create_engine, Column, String, JSON
from sqlalchemy.orm import sessionmaker, declarative_base

# Usando SQLite para o MVP.
SQLALCHEMY_DATABASE_URL = "sqlite:///./archeos.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class GameRecord(Base):
    __tablename__ = "games"

    game_id = Column(String, primary_key=True, index=True)
    status = Column(String, index=True)
    state = Column(JSON) # Aqui guardaremos o GameSession inteiro convertido para JSON

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()    