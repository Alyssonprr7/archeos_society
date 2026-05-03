import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Button } from '../components/ui/button';
import { GameCard } from '../components/GameCard';
import { Player, GameCard as GameCardType } from '../types';
import { motion } from 'motion/react';
import { ArrowLeft, CheckCircle, Crown, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '../components/ui/sonner';

export default function Expedition() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    players: initialPlayers,
    currentPlayerIndex,
    selectedCards: initialSelectedCards,
    season,
    market: initialMarket,
    revealedMonkeys,
    turnCount
  } = location.state || {};

  // Redirect if no state data
  useEffect(() => {
    if (!initialPlayers || !initialSelectedCards) {
      navigate('/');
    }
  }, [initialPlayers, initialSelectedCards, navigate]);

  const [players] = useState<Player[]>(initialPlayers || []);
  const [market] = useState<GameCardType[]>(initialMarket || []);
  const currentPlayer = players[currentPlayerIndex];
  
  // Guard clause
  if (!currentPlayer || !initialSelectedCards) {
    return null;
  }
  
  const selectedCardObjects = currentPlayer.cards.filter(
    card => initialSelectedCards.includes(card.id)
  );
  
  const [leader, setLeader] = useState<GameCardType | null>(null);
  const [validationError, setValidationError] = useState<string>('');

  const validateExpedition = (): boolean => {
    if (!leader) {
      setValidationError('Selecione uma carta líder!');
      return false;
    }

    if (selectedCardObjects.length < 2) {
      setValidationError('Expedição precisa de pelo menos 2 cartas!');
      return false;
    }

    // Check if all cards have same color OR same function
    const allSameColor = selectedCardObjects.every(card => card.color === leader.color);
    const allSameFunction = selectedCardObjects.every(card => card.function === leader.function);

    if (!allSameColor && !allSameFunction) {
      setValidationError('Todas as cartas devem ter a mesma cor OU a mesma função!');
      return false;
    }

    setValidationError('');
    return true;
  };

  const confirmExpedition = () => {
    if (!validateExpedition()) {
      toast.error(validationError);
      return;
    }

    // Calculate points
    const points = selectedCardObjects.reduce((sum, card) => sum + card.value, 0);
    const bonus = leader ? Math.floor(leader.value * 1.5) : 0;
    const totalPoints = points + bonus;

    // Update player
    const updatedPlayers = [...players];
    updatedPlayers[currentPlayerIndex].score += totalPoints;
    updatedPlayers[currentPlayerIndex].position = Math.min(
      updatedPlayers[currentPlayerIndex].position + 1,
      10
    );

    // Get remaining cards from hand that were NOT selected for the expedition
    // These cards should be available to other players
    const cardsNotUsedInExpedition = updatedPlayers[currentPlayerIndex].cards.filter(
      card => !initialSelectedCards.includes(card.id)
    );

    // Remove ALL cards from player's hand (both selected and not selected)
    // Cards used in expedition are discarded
    // Cards not used go to the market
    updatedPlayers[currentPlayerIndex].cards = [];

    // Add cards that were not used in expedition to market for other players
    const updatedMarket = [...market, ...cardsNotUsedInExpedition];

    // Move to next player
    const nextPlayerIndex = (currentPlayerIndex + 1) % updatedPlayers.length;

    toast.success(`Expedição concluída! +${totalPoints} pontos`);

    setTimeout(() => {
      navigate('/game', {
        state: {
          players: updatedPlayers,
          season,
          market: updatedMarket,
          currentPlayerIndex: nextPlayerIndex,
          revealedMonkeys,
          turnCount: turnCount + 1
        }
      });
    }, 1000);
  };

  const cancel = () => {
    navigate('/game', {
      state: {
        players,
        season,
        market,
        currentPlayerIndex,
        revealedMonkeys,
        turnCount
      }
    });
  };

  const selectLeader = (card: GameCardType) => {
    setLeader(card);
    setValidationError('');
  };

  // Check validation in real-time
  const getValidationStatus = () => {
    if (!leader) return { valid: false, message: 'Selecione uma carta líder' };
    
    const allSameColor = selectedCardObjects.every(card => card.color === leader.color);
    const allSameFunction = selectedCardObjects.every(card => card.function === leader.function);

    if (allSameColor) {
      return { valid: true, message: `✓ Todas as cartas são da cor ${leader.color}` };
    }
    if (allSameFunction) {
      return { valid: true, message: `✓ Todas as cartas têm a função ${leader.function}` };
    }
    
    return { valid: false, message: '✗ Cartas devem ter mesma cor OU mesma função' };
  };

  const validation = getValidationStatus();
  const totalPoints = selectedCardObjects.reduce((sum, card) => sum + card.value, 0);
  const leaderBonus = leader ? Math.floor(leader.value * 1.5) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 overflow-y-auto">
      <Toaster position="top-center" />
      
      <div className="max-w-4xl mx-auto py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={cancel}
              className="mb-4 text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">
              Iniciar Expedição
            </h1>
            <p className="text-slate-400">
              Escolha a carta líder e valide sua expedição
            </p>
          </div>

          {/* Current Player */}
          <div 
            className="bg-slate-800/50 backdrop-blur-xl rounded-lg p-4 mb-6 flex items-center gap-3"
          >
            <div 
              className="w-12 h-12 rounded-full flex-shrink-0"
              style={{ backgroundColor: currentPlayer.color }}
            />
            <div>
              <div className="text-sm text-slate-400">Jogador</div>
              <div className="text-xl font-bold text-white">{currentPlayer.name}</div>
            </div>
          </div>

          {/* Leader Selection */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Crown className="w-6 h-6 text-amber-500" />
              Selecione a Carta Líder
            </h2>
            
            <div className="flex gap-3 overflow-x-auto pb-4">
              {selectedCardObjects.map((card) => (
                <div key={card.id} onClick={() => selectLeader(card)}>
                  <GameCard 
                    card={card}
                    selected={leader?.id === card.id}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Validation Status */}
          <div className={`
            rounded-lg p-4 mb-6 flex items-start gap-3
            ${validation.valid 
              ? 'bg-green-500/20 border border-green-500' 
              : 'bg-amber-500/20 border border-amber-500'
            }
          `}>
            {validation.valid ? (
              <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h3 className="font-bold text-white mb-1">Validação da Expedição</h3>
              <p className={validation.valid ? 'text-green-300' : 'text-amber-300'}>
                {validation.message}
              </p>
            </div>
          </div>

          {/* Points Summary */}
          <div className="bg-slate-800/80 backdrop-blur-xl rounded-lg p-6 mb-6">
            <h3 className="text-lg font-bold text-white mb-4">Resumo de Pontos</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Total das cartas</span>
                <span className="text-2xl font-bold text-white">{totalPoints}</span>
              </div>
              
              {leader && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Bônus do líder (×1.5)</span>
                  <span className="text-2xl font-bold text-amber-500">+{leaderBonus}</span>
                </div>
              )}
              
              <div className="border-t border-slate-700 pt-3 flex justify-between items-center">
                <span className="text-lg font-bold text-white">Total</span>
                <span className="text-3xl font-bold text-green-400">
                  {totalPoints + leaderBonus}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={cancel}
              className="flex-1 bg-slate-700 border-slate-600 hover:bg-slate-600"
            >
              Cancelar
            </Button>
            
            <Button
              onClick={confirmExpedition}
              disabled={!validation.valid}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Confirmar Expedição
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}