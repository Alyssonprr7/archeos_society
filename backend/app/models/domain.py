from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from enum import Enum

SCORE_TABLE = {
    1: 0,
    2: 1,
    3: 3,
    4: 5,
    5: 8,
    6: 12  # 6 ou mais cartas
}
TRACK_SCORE_TABLES = {
    "default": {
        0: 0,
        1: 1,
        2: 3,
        3: 6,
        4: 10,
        5: 15,
        6: 21
    }
}

class SiteSide(str, Enum):
    BASIC = "A"
    ADVANCED = "B"

class CardColor(str, Enum):
    NORTH_AMERICA = "América do Norte"
    SOUTH_AMERICA = "América do Sul"
    EUROPE = "Europa"
    AFRICA = "África"
    ASIA = "Ásia"
    OCEANIA = "Oceania"
    SPECIAL = "Especial"

class Card(BaseModel):
    role: str
    color: str
    is_monkey: bool = False

class Expedition(BaseModel):
    cards: List[Card]
    leader: Card
    color_matched: bool

class Player(BaseModel):
    id: str
    color_assigned: Optional[str] = None
    score: int = 0
    hand: List[Card] = []
    expeditions_played: List[Expedition] = []
    tracks: Dict[str, int] = {
        "América do Norte": 0, "América do Sul": 0, 
        "Europa": 0, "África": 0, "Ásia": 0, "Oceania": 0
    }
    linguist_track: int = 0  
    relics: int = 0
    professor_tokens: List[int] = []
    extra_vehicles: Dict[str, int] = {"Ásia": 0}

class GameSession(BaseModel):
    game_id: str
    status: str = "WAITING_PLAYERS"
    players: Dict[str, Player] = {}
    player_order: List[str] = []
    current_turn_index: int = 0
    current_turn_player_id: Optional[str] = None
    deck: List[Card] = []                
    market: List[Card] = []              
    monkeys_found: int = 0               
    season: int = 1                      
    max_seasons: int = 3
    botanist_frame_player_id: Optional[str] = None
    site_configurations: Dict[str, SiteSide] = {
        "América do Norte": SiteSide.BASIC,
        "América do Sul": SiteSide.BASIC,
        "Europa": SiteSide.BASIC,
        "África": SiteSide.BASIC,
        "Ásia": SiteSide.BASIC,
        "Oceania": SiteSide.BASIC
    }