import { GameCard as GameCardType } from '../types';
import { motion } from 'motion/react';
import { Pickaxe, Truck, FlaskConical, DollarSign, GemIcon } from 'lucide-react';

interface GameCardProps {
  card: GameCardType;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

const colorMap = {
  red: 'bg-gradient-to-br from-red-500 to-red-700',
  blue: 'bg-gradient-to-br from-blue-500 to-blue-700',
  green: 'bg-gradient-to-br from-green-500 to-green-700',
  yellow: 'bg-gradient-to-br from-yellow-500 to-yellow-700',
  purple: 'bg-gradient-to-br from-purple-500 to-purple-700',
};

const functionIcons = {
  excavation: Pickaxe,
  transport: Truck,
  research: FlaskConical,
  funding: DollarSign,
  artifact: GemIcon,
  monkey: null, // Monkey will use emoji
};

const monkeyEmojis = {
  see: '🙈',
  hear: '🙉',
  speak: '🙊',
};

export function GameCard({ card, selected, onClick, disabled }: GameCardProps) {
  const Icon = functionIcons[card.function];
  
  // Special styling for monkey cards
  const isMonkey = card.function === 'monkey';
  
  return (
    <motion.div
      whileHover={!disabled ? { scale: 1.05, y: -8 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      onClick={disabled ? undefined : onClick}
      className={`
        relative w-24 h-36 md:w-28 md:h-40 rounded-xl overflow-hidden
        cursor-pointer transition-all shadow-lg
        ${isMonkey 
          ? 'bg-gradient-to-br from-orange-600 to-amber-800' 
          : colorMap[card.color]
        }
        ${selected ? 'ring-4 ring-white scale-105' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <div className="absolute inset-0 bg-black/10" />
      
      {isMonkey ? (
        <>
          {/* Monkey Emoji */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl md:text-7xl">
              {monkeyEmojis[card.monkeyType || 'see']}
            </span>
          </div>
          
          {/* Warning Badge */}
          <div className="absolute top-2 left-2 right-2 bg-red-500 text-white text-xs font-bold py-1 px-2 rounded text-center">
            ⚠️ MACACO
          </div>
        </>
      ) : (
        <>
          {/* Function Icon */}
          <div className="absolute top-2 left-2 bg-white/20 backdrop-blur-sm p-1.5 rounded-lg">
            {Icon && <Icon className="w-4 h-4 md:w-5 md:h-5 text-white" />}
          </div>
          
          {/* Role + Region */}
          <div className="absolute bottom-0 left-0 right-0 bg-black/40 backdrop-blur-sm px-2 py-1.5 text-center">
            <p className="text-xs font-bold text-white leading-tight truncate">{card.role ?? '—'}</p>
            <p className="text-[10px] text-white/70 leading-tight truncate">{card.region ?? '—'}</p>
          </div>
        </>
      )}
      
      {/* Pattern decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="w-full h-full" style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)`
        }} />
      </div>
    </motion.div>
  );
}