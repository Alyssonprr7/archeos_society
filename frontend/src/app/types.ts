export type CardColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple';
export type CardFunction = 'excavation' | 'transport' | 'research' | 'funding' | 'artifact' | 'monkey';

export interface GameCard {
  id: string;
  color: CardColor;
  function: CardFunction;
  value: number;
  role?: string;
  region?: string;
  monkeyType?: 'see' | 'hear' | 'speak';
}

export interface Player {
  id: string;
  name: string;
  color: string;
  score: number;
  cards: GameCard[];
  position: number;
  tracks?: Record<string, number>;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  ability: string;
}

export interface Expedition {
  id: string;
  playerId: string;
  cards: GameCard[];
  leader: GameCard;
  points: number;
}