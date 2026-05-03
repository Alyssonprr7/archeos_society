import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Button } from '../components/ui/button';
import { GameCard } from '../components/GameCard';
import { PlayerInfo } from '../components/PlayerInfo';
import { Player, GameCard as GameCardType, CardColor, CardFunction } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Package, Send, AlertCircle, Menu, X, Eye, ChevronDown, ChevronUp, Hand } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '../components/ui/sonner';
import { useGameStore } from '../../store/gameStore';

const monkeyEmojis = {
  see: '🙈',
  hear: '🙉',
  speak: '🙊',
};

const generateInitialCard = (id: string): GameCardType => {
  const colors: CardColor[] = ['red', 'blue', 'green', 'yellow', 'purple'];
  const functions: CardFunction[] = ['excavation', 'transport', 'research', 'funding', 'artifact'];
  return {
    id,
    color: colors[Math.floor(Math.random() * colors.length)],
    function: functions[Math.floor(Math.random() * functions.length)],
    value: Math.floor(Math.random() * 5) + 1,
  };
};

const generateCard = (id: string, turnCount: number): GameCardType => {
  const colors: CardColor[] = ['red', 'blue', 'green', 'yellow', 'purple'];
  const functions: CardFunction[] = ['excavation', 'transport', 'research', 'funding', 'artifact'];
  const canHaveMonkey = turnCount >= 5;
  const monkeyChance = canHaveMonkey ? Math.min(0.15, 0.05 + (turnCount - 5) * 0.02) : 0;
  const isMonkey = Math.random() < monkeyChance;

  if (isMonkey) {
    const monkeyTypes: Array<'see' | 'hear' | 'speak'> = ['see', 'hear', 'speak'];
    return { id, color: 'red', function: 'monkey', value: 0, monkeyType: monkeyTypes[Math.floor(Math.random() * monkeyTypes.length)] };
  }

  return {
    id,
    color: colors[Math.floor(Math.random() * colors.length)],
    function: functions[Math.floor(Math.random() * functions.length)],
    value: Math.floor(Math.random() * 5) + 1,
  };
};

export default function Game() {
  const navigate = useNavigate();
  const location = useLocation();
  const { myPlayerId } = useGameStore();

  const playersData = location.state?.players || [];

  useEffect(() => {
    if (!playersData || playersData.length === 0) navigate('/');
  }, [playersData, navigate]);

  const initializePlayers = (): Player[] => {
    if (location.state?.players && location.state.players[0]?.score !== undefined) {
      return location.state.players;
    }
    return playersData.map((p: any, i: number) => ({
      id: `player-${i}`,
      name: p.name,
      color: p.color,
      score: 0,
      cards: Array.from({ length: 5 }, (_, j) => generateInitialCard(`${i}-${j}`)),
      position: 0,
    }));
  };

  const [players, setPlayers] = useState<Player[]>(initializePlayers());
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(location.state?.currentPlayerIndex || 0);
  const [market, setMarket] = useState<GameCardType[]>(
    location.state?.market || Array.from({ length: 5 }, (_, i) => generateInitialCard(`market-${i}`))
  );
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [season, setSeason] = useState(location.state?.season || 1);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [revealedMonkeys, setRevealedMonkeys] = useState<GameCardType[]>(location.state?.revealedMonkeys || []);
  const [turnCount, setTurnCount] = useState(location.state?.turnCount || 0);
  const [myHandOpen, setMyHandOpen] = useState(false);

  useEffect(() => {
    if (location.state?.players && location.state.players[0]?.score !== undefined) setPlayers(location.state.players);
    if (location.state?.market) setMarket(location.state.market);
    if (location.state?.currentPlayerIndex !== undefined) setCurrentPlayerIndex(location.state.currentPlayerIndex);
    if (location.state?.revealedMonkeys) setRevealedMonkeys(location.state.revealedMonkeys);
    if (location.state?.turnCount !== undefined) setTurnCount(location.state.turnCount);
  }, [location.state]);

  const currentPlayer = players[currentPlayerIndex];

  // The player bound to this device. Falls back to currentPlayer in single-device mode.
  const myPlayer = myPlayerId
    ? (players.find(p => p.id === myPlayerId) ?? currentPlayer)
    : currentPlayer;

  const isMyTurn = !myPlayerId || myPlayer?.id === currentPlayer?.id;

  const MAX_HAND_SIZE = 10;

  useEffect(() => {
    if (revealedMonkeys.length >= 3) {
      toast.error('🙈🙉🙊 3 Macacos revelados! Fim da temporada!', { duration: 3000 });
      setTimeout(() => navigate('/season-end', { state: { players, season, monkeyEnd: true } }), 2000);
    }
  }, [revealedMonkeys, navigate, players, season]);

  if (!currentPlayer || !myPlayer) return null;

  // ── Actions (only called when isMyTurn is true) ─────────────────────────

  const buyFromMarket = (card: GameCardType) => {
    if (myPlayer.cards.length >= MAX_HAND_SIZE) { toast.error('Limite de cartas atingido! (máx: 10)'); return; }
    if (card.function === 'monkey') {
      setRevealedMonkeys(prev => [...prev, card]);
      toast.warning(`Macaco revelado! ${monkeyEmojis[card.monkeyType || 'see']} (${revealedMonkeys.length + 1}/3)`, { duration: 2000 });
    }
    const updated = [...players];
    updated[currentPlayerIndex].cards.push(card);
    setPlayers(updated);

    const newMarket = market.filter(c => c.id !== card.id);
    const newCard = generateCard(`market-${Date.now()}`, turnCount);
    if (newCard.function === 'monkey') {
      setTimeout(() => {
        setRevealedMonkeys(prev => [...prev, newCard]);
        toast.warning(`Macaco no mercado! ${monkeyEmojis[newCard.monkeyType || 'see']}`, { duration: 2000 });
      }, 500);
    }
    newMarket.push(newCard);
    setMarket(newMarket);
    if (card.function !== 'monkey') toast.success('Carta comprada do mercado!');
    nextTurn();
  };

  const buyFromDeck = () => {
    if (myPlayer.cards.length >= MAX_HAND_SIZE) { toast.error('Limite de cartas atingido! (máx: 10)'); return; }
    const newCard = generateCard(`deck-${Date.now()}`, turnCount);
    if (newCard.function === 'monkey') {
      setRevealedMonkeys(prev => [...prev, newCard]);
      toast.warning(`Macaco comprado! ${monkeyEmojis[newCard.monkeyType || 'see']} (${revealedMonkeys.length + 1}/3)`, { duration: 2000 });
    }
    const updated = [...players];
    updated[currentPlayerIndex].cards.push(newCard);
    setPlayers(updated);
    if (newCard.function !== 'monkey') toast.success('Carta comprada do baralho!');
    nextTurn();
  };

  const startExpedition = () => {
    if (selectedCards.length < 2) { toast.error('Selecione ao menos 2 cartas para iniciar uma expedição!'); return; }
    navigate('/expedition', { state: { players, currentPlayerIndex, selectedCards, season, market, revealedMonkeys, turnCount } });
  };

  const toggleCardSelection = (cardId: string) => {
    const card = myPlayer.cards.find(c => c.id === cardId);
    if (card?.function === 'monkey') { toast.error('Cartas de macaco não podem ser usadas em expedições!'); return; }
    setSelectedCards(prev => prev.includes(cardId) ? prev.filter(id => id !== cardId) : [...prev, cardId]);
  };

  const nextTurn = () => {
    setSelectedCards([]);
    const nextIndex = (currentPlayerIndex + 1) % players.length;
    setCurrentPlayerIndex(nextIndex);
    setTurnCount(prev => prev + 1);
    if (nextIndex === 0 && Math.random() > 0.7) navigate('/season-end', { state: { players, season } });
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      <Toaster position="top-center" />

      {/* Header */}
      <div className="bg-slate-800/80 backdrop-blur-xl border-b border-slate-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white">Archeos Society</h1>
            <p className="text-sm text-slate-400">Temporada {season}</p>
          </div>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </Button>
          <div className="hidden md:block text-right">
            <div className="text-sm text-slate-400">Vez de</div>
            <div className="text-lg font-bold" style={{ color: currentPlayer.color }}>{currentPlayer.name}</div>
          </div>
        </div>
      </div>

      {/* Watching banner */}
      {!isMyTurn && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 flex items-center gap-2"
        >
          <Eye className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <p className="text-amber-300 text-sm">
            Você está observando — é a vez de{' '}
            <span className="font-bold" style={{ color: currentPlayer.color }}>{currentPlayer.name}</span>.
            Suas ações ficam disponíveis quando chegar a sua vez.
          </p>
        </motion.div>
      )}

      <div className="flex flex-col md:flex-row h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <AnimatePresence>
          {(mobileMenuOpen || window.innerWidth >= 768) && (
            <motion.div
              initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }}
              className="w-full md:w-80 bg-slate-800/50 backdrop-blur-xl border-r border-slate-700 p-4 overflow-y-auto absolute md:relative z-20 h-full"
            >
              <h2 className="text-lg font-bold text-white mb-4">Jogadores</h2>
              <div className="space-y-3">
                {players.map((player, index) => (
                  <PlayerInfo key={player.id} player={player} isActive={index === currentPlayerIndex} />
                ))}
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-bold text-white mb-4">Trilhas Arqueológicas</h3>
                {players.map((player) => (
                  <div key={player.id} className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: player.color }} />
                      <span className="text-sm text-white">{player.name}</span>
                    </div>
                    <div className="flex gap-1">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className={`w-full h-2 rounded ${i < player.position ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-slate-700'}`} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-bold text-white mb-3">Macacos Revelados</h3>
                <div className={`p-4 rounded-lg ${revealedMonkeys.length >= 3 ? 'bg-red-500/30 border-2 border-red-500' : 'bg-orange-500/20 border border-orange-500'}`}>
                  <div className="flex items-center justify-center gap-3 mb-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${i < revealedMonkeys.length ? 'bg-orange-600' : 'bg-slate-700'}`}>
                        {i < revealedMonkeys.length && revealedMonkeys[i] ? monkeyEmojis[revealedMonkeys[i].monkeyType || 'see'] : '?'}
                      </div>
                    ))}
                  </div>
                  <p className="text-center text-sm font-bold text-orange-300">{revealedMonkeys.length}/3 Macacos</p>
                  {revealedMonkeys.length >= 2 && revealedMonkeys.length < 3 && (
                    <p className="text-center text-xs text-orange-200 mt-2">⚠️ Próximo macaco encerra a temporada!</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">

          {/* Market — always visible, only clickable on your turn */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-blue-400" />
                Mercado de Cartas
              </h2>
              <Button
                onClick={isMyTurn ? buyFromDeck : undefined}
                disabled={!isMyTurn}
                variant="outline"
                className="bg-purple-500/20 border-purple-500 hover:bg-purple-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Package className="w-4 h-4 mr-2" />
                Comprar do Baralho
              </Button>
            </div>
            <div className={`flex gap-3 overflow-x-auto pb-4 ${!isMyTurn ? 'opacity-80' : ''}`}>
              {market.map((card) => (
                <div
                  key={card.id}
                  onClick={isMyTurn ? () => buyFromMarket(card) : undefined}
                  className={!isMyTurn ? 'cursor-default' : 'cursor-pointer'}
                >
                  <GameCard card={card} />
                </div>
              ))}
            </div>
          </div>

          {/* Hand section */}
          {isMyTurn ? (
            /* My turn — show my interactive hand */
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">
                  Sua Mão
                  <span className={`ml-2 text-sm ${myPlayer.cards.length >= MAX_HAND_SIZE ? 'text-red-400' : 'text-slate-400'}`}>
                    ({myPlayer.cards.length}/{MAX_HAND_SIZE})
                  </span>
                </h2>
                <Button
                  onClick={startExpedition}
                  disabled={selectedCards.length < 2}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Iniciar Expedição ({selectedCards.length})
                </Button>
              </div>

              {myPlayer.cards.length >= MAX_HAND_SIZE && (
                <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <p className="text-red-300 text-sm">Limite de cartas atingido! Faça uma expedição antes de comprar mais.</p>
                </div>
              )}

              <div className="flex gap-3 overflow-x-auto pb-4">
                {myPlayer.cards.map((card) => (
                  <div key={card.id} onClick={() => toggleCardSelection(card.id)} className="cursor-pointer">
                    <GameCard card={card} selected={selectedCards.includes(card.id)} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Watching — show only card count for the active player, hand hidden */
            <div className="mb-6">
              <div className="flex items-center gap-3 p-4 bg-slate-800/60 rounded-xl border border-slate-700">
                <Hand className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <p className="text-slate-400 text-sm">
                  <span className="font-semibold" style={{ color: currentPlayer.color }}>{currentPlayer.name}</span>
                  {' '}tem <span className="text-white font-bold">{currentPlayer.cards.length}</span> carta(s) na mão.
                </p>
              </div>
            </div>
          )}

          {/* My hand (collapsible) — only shown when watching someone else */}
          {!isMyTurn && myPlayer.id !== currentPlayer.id && (
            <div className="border border-slate-700 rounded-xl overflow-hidden">
              <button
                onClick={() => setMyHandOpen(o => !o)}
                className="w-full flex items-center justify-between p-4 bg-slate-800/60 hover:bg-slate-800 transition-colors text-left"
              >
                <span className="text-white font-semibold">
                  Minha Mão
                  <span className="ml-2 text-slate-400 text-sm font-normal">({myPlayer.cards.length}/{MAX_HAND_SIZE})</span>
                </span>
                {myHandOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              <AnimatePresence>
                {myHandOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex gap-3 overflow-x-auto p-4 bg-slate-900/40">
                      {myPlayer.cards.length === 0 ? (
                        <p className="text-slate-500 text-sm">Sua mão está vazia.</p>
                      ) : (
                        myPlayer.cards.map((card) => (
                          <div key={card.id} className="cursor-default">
                            <GameCard card={card} />
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
