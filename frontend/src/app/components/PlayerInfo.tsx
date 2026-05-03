import { Player } from '../types';
import { Trophy, User } from 'lucide-react';

interface PlayerInfoProps {
  player: Player;
  isActive?: boolean;
  compact?: boolean;
}

export function PlayerInfo({ player, isActive, compact }: PlayerInfoProps) {
  return (
    <div 
      className={`
        flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg transition-all
        ${isActive ? 'bg-amber-500/20 ring-2 ring-amber-500' : 'bg-slate-800/50'}
        ${compact ? 'text-sm' : ''}
      `}
    >
      <div 
        className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white font-bold"
        style={{ backgroundColor: player.color }}
      >
        <User className="w-4 h-4 md:w-5 md:h-5" />
      </div>
      
      <div className="flex-1">
        <div className="font-semibold text-white">{player.name}</div>
        {!compact && (
          <div className="text-xs text-slate-400">
            {player.cards.length} cartas
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-1 bg-amber-500/20 px-2 py-1 rounded">
        <Trophy className="w-4 h-4 text-amber-500" />
        <span className="font-bold text-white">{player.score}</span>
      </div>
    </div>
  );
}
