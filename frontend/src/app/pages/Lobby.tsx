import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Users, Plus, Minus, Play, LogIn, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useGameStore } from '../../store/gameStore';
import { gameApi } from '../../api/game';
import { BackendGameState } from '../../api/types';
import { toast } from 'sonner';
import { Toaster } from '../components/ui/sonner';

type Mode = 'home' | 'create' | 'join'

const PLAYER_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899']

export default function Lobby() {
  const navigate = useNavigate();
  const { setPlayerColors } = useGameStore()

  const [mode, setMode] = useState<Mode>('home')
  const [numPlayers, setNumPlayers] = useState(4)
  const [players, setPlayers] = useState([
    { name: 'Jogador 1', color: PLAYER_COLORS[0] },
    { name: 'Jogador 2', color: PLAYER_COLORS[1] },
    { name: 'Jogador 3', color: PLAYER_COLORS[2] },
    { name: 'Jogador 4', color: PLAYER_COLORS[3] },
  ])

  const [joinCode, setJoinCode] = useState('')
  const [joinLoading, setJoinLoading] = useState(false)

  const addPlayer = () => {
    if (numPlayers < 6) {
      const n = numPlayers + 1
      setNumPlayers(n)
      setPlayers([...players, { name: `Jogador ${n}`, color: PLAYER_COLORS[n - 1] }])
    }
  }

  const removePlayer = () => {
    if (numPlayers > 2) {
      const n = numPlayers - 1
      setNumPlayers(n)
      setPlayers(players.slice(0, n))
    }
  }

  const updatePlayerName = (index: number, name: string) => {
    const updated = [...players]
    updated[index].name = name
    setPlayers(updated)
  }

  const goToSetup = () => {
    const colorMap: Record<string, string> = {}
    players.forEach((p) => { colorMap[p.name] = p.color })
    setPlayerColors(colorMap)
    navigate('/setup', { state: { players } })
  }

  const goToJoin = async () => {
    const code = joinCode.trim()
    if (!code) { toast.error('Digite o código da partida'); return }
    setJoinLoading(true)
    try {
      const res = await gameApi.getState(code)
      const raw: BackendGameState = res.data

      // Build color map from player_order (same deterministic order as adapters.ts)
      const colorMap: Record<string, string> = {}
      raw.player_order.forEach((pid, i) => {
        colorMap[pid] = PLAYER_COLORS[i % PLAYER_COLORS.length]
      })
      setPlayerColors(colorMap)

      navigate('/join', {
        state: {
          gameId: code,
          playerOrder: raw.player_order,
          colorMap,
        },
      })
    } catch {
      toast.error('Partida não encontrada. Verifique o código.')
    } finally {
      setJoinLoading(false)
    }
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

        {mode === 'create' && (
          <Card className="bg-slate-800/80 backdrop-blur-xl border-slate-700 p-6 md:p-8">
            <button
              onClick={() => setMode('home')}
              className="text-slate-400 hover:text-white text-sm mb-6 block"
            >
              ← Voltar
            </button>

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

            <div className="mb-6">
              <Label className="text-white text-lg mb-3 block">Nomes dos Jogadores</Label>
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

            <Button
              onClick={goToSetup}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-lg py-6"
            >
              <Play className="w-5 h-5 mr-2" />
              Continuar para Configuração
            </Button>
          </Card>
        )}

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
                onChange={(e) => setJoinCode(e.target.value.trim())}
                className="bg-slate-700 border-slate-600 text-white text-xl text-center font-mono tracking-widest"
                placeholder="Cole o código aqui"
                onKeyDown={(e) => e.key === 'Enter' && goToJoin()}
              />
              <p className="text-slate-500 text-xs mt-2">
                O anfitrião verá o código após criar a partida na tela de configuração.
              </p>
            </div>
            <Button
              onClick={goToJoin}
              disabled={joinLoading}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-lg py-6"
            >
              {joinLoading
                ? <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                : <LogIn className="w-5 h-5 mr-2" />
              }
              Entrar
            </Button>
          </Card>
        )}
      </motion.div>
    </div>
  )
}
