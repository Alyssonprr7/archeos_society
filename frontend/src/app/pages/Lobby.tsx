import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Users, Plus, Minus, Play, LogIn, Copy, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { useGameStore } from '../../store/gameStore';
import { toast } from 'sonner';
import { Toaster } from '../components/ui/sonner';

type Mode = 'home' | 'create' | 'join'

function generateGameCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export default function Lobby() {
  const navigate = useNavigate();
  const { setGameId, setMyPlayerId } = useGameStore()

  const [mode, setMode] = useState<Mode>('home')
  const [numPlayers, setNumPlayers] = useState(4);
  const [players, setPlayers] = useState([
    { name: 'Jogador 1', color: '#ef4444' },
    { name: 'Jogador 2', color: '#3b82f6' },
    { name: 'Jogador 3', color: '#22c55e' },
    { name: 'Jogador 4', color: '#f59e0b' },
  ]);
  const [gameCode, setGameCode] = useState('')
  const [codeCopied, setCodeCopied] = useState(false)

  // Join mode state
  const [joinCode, setJoinCode] = useState('')

  const playerColors = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899'];

  const addPlayer = () => {
    if (numPlayers < 6) {
      const newNum = numPlayers + 1;
      setNumPlayers(newNum);
      setPlayers([...players, { name: `Jogador ${newNum}`, color: playerColors[newNum - 1] }]);
    }
  };

  const removePlayer = () => {
    if (numPlayers > 2) {
      const newNum = numPlayers - 1;
      setNumPlayers(newNum);
      setPlayers(players.slice(0, newNum));
    }
  };

  const updatePlayerName = (index: number, name: string) => {
    const updated = [...players];
    updated[index].name = name;
    setPlayers(updated);
  };

  const createGame = () => {
    const code = generateGameCode()
    setGameCode(code)
    setGameId(code)
    // Host is player 0 by default
    setMyPlayerId('player-0')
  }

  const copyCode = async () => {
    await navigator.clipboard.writeText(gameCode)
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  const startGame = () => {
    navigate('/setup', { state: { players } });
  };

  const goToJoin = () => {
    if (!joinCode.trim()) {
      toast.error('Digite o código da partida')
      return
    }
    navigate('/join', { state: { code: joinCode.toUpperCase(), players } })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Toaster position="top-center" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <div className="text-center mb-8">
          <motion.h1
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="text-4xl md:text-6xl font-bold text-white mb-2"
          >
            Archeos Society
          </motion.h1>
          <p className="text-slate-400 text-lg">Prepare-se para a aventura arqueológica</p>
        </div>

        {/* Home — choose mode */}
        {mode === 'home' && (
          <Card className="bg-slate-800/80 backdrop-blur-xl border-slate-700 p-6 md:p-8">
            <div className="space-y-4">
              <Button
                onClick={() => setMode('create')}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-lg py-6"
              >
                <Play className="w-5 h-5 mr-2" />
                Criar Partida
              </Button>
              <Button
                onClick={() => setMode('join')}
                variant="outline"
                className="w-full bg-slate-700/50 border-slate-600 hover:bg-slate-700 text-white text-lg py-6"
              >
                <LogIn className="w-5 h-5 mr-2" />
                Entrar em Partida
              </Button>
            </div>
          </Card>
        )}

        {/* Create game */}
        {mode === 'create' && (
          <Card className="bg-slate-800/80 backdrop-blur-xl border-slate-700 p-6 md:p-8">
            <button
              onClick={() => { setMode('home'); setGameCode('') }}
              className="text-slate-400 hover:text-white text-sm mb-6 block"
            >
              ← Voltar
            </button>

            {/* Game code */}
            {gameCode ? (
              <div className="mb-6 bg-slate-700/50 rounded-xl p-4 text-center">
                <p className="text-slate-400 text-sm mb-1">Código da partida — compartilhe com os jogadores</p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-3xl font-bold text-amber-400 tracking-widest">{gameCode}</span>
                  <button onClick={copyCode} className="text-slate-400 hover:text-white">
                    {codeCopied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-slate-500 text-xs mt-2">Você é o Anfitrião (Jogador 1)</p>
              </div>
            ) : null}

            {/* Player count */}
            <div className="mb-6">
              <Label className="text-white text-lg mb-3 block">Número de Jogadores</Label>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={removePlayer}
                  disabled={numPlayers <= 2}
                  className="bg-slate-700 border-slate-600 hover:bg-slate-600"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <div className="flex-1 bg-slate-700/50 rounded-lg p-4 text-center">
                  <Users className="w-6 h-6 mx-auto mb-1 text-blue-400" />
                  <span className="text-3xl font-bold text-white">{numPlayers}</span>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={addPlayer}
                  disabled={numPlayers >= 6}
                  className="bg-slate-700 border-slate-600 hover:bg-slate-600"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Player names */}
            <div className="mb-6">
              <Label className="text-white text-lg mb-3 block">Jogadores</Label>
              <div className="space-y-3">
                {players.map((player, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: player.color }} />
                    <Input
                      value={player.name}
                      onChange={(e) => updatePlayerName(index, e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder={`Nome do jogador ${index + 1}`}
                    />
                  </motion.div>
                ))}
              </div>
            </div>

            {!gameCode ? (
              <Button
                onClick={createGame}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-lg py-6"
              >
                Gerar Código da Partida
              </Button>
            ) : (
              <Button
                onClick={startGame}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-lg py-6"
              >
                <Play className="w-5 h-5 mr-2" />
                Iniciar Jogo
              </Button>
            )}
          </Card>
        )}

        {/* Join game */}
        {mode === 'join' && (
          <Card className="bg-slate-800/80 backdrop-blur-xl border-slate-700 p-6 md:p-8">
            <button
              onClick={() => setMode('home')}
              className="text-slate-400 hover:text-white text-sm mb-6 block"
            >
              ← Voltar
            </button>
            <div className="mb-6">
              <Label className="text-white text-lg mb-3 block">Código da Partida</Label>
              <Input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="bg-slate-700 border-slate-600 text-white text-2xl text-center tracking-widest"
                placeholder="XXXXXX"
                maxLength={6}
              />
            </div>
            <Button
              onClick={goToJoin}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-lg py-6"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Entrar
            </Button>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
