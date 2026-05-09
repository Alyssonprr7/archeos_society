import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { motion } from 'motion/react';
import { useGameStore } from '../../store/gameStore';
import { LogIn } from 'lucide-react';

export default function Join() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setMyPlayerId, setGameId } = useGameStore()

  const gameId: string = location.state?.gameId ?? ''
  const playerOrder: string[] = location.state?.playerOrder ?? []
  const colorMap: Record<string, string> = location.state?.colorMap ?? {}

  const [selected, setSelected] = useState<string | null>(null)

  const join = () => {
    if (!selected) return
    setGameId(gameId)
    setMyPlayerId(selected)
    navigate('/game', { state: { gameCode: gameId } })
  }

  if (!gameId || playerOrder.length === 0) {
    navigate('/')
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">Entrar na Partida</h1>
          <p className="text-slate-500 text-sm font-mono mt-1 break-all">{gameId}</p>
        </div>

        <Card className="bg-slate-800/80 backdrop-blur-xl border-slate-700 p-6">
          <p className="text-slate-400 text-sm mb-4">Selecione qual jogador você é nesta partida:</p>

          <div className="space-y-3 mb-6">
            {playerOrder.map((playerName) => (
              <motion.button
                key={playerName}
                onClick={() => setSelected(playerName)}
                whileTap={{ scale: 0.97 }}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-colors ${
                  selected === playerName
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                }`}
              >
                <div
                  className="w-10 h-10 rounded-full flex-shrink-0"
                  style={{ backgroundColor: colorMap[playerName] ?? '#888' }}
                />
                <span className="text-white font-medium text-left">{playerName}</span>
                {selected === playerName && (
                  <span className="ml-auto text-amber-400 text-sm font-bold">Eu</span>
                )}
              </motion.button>
            ))}
          </div>

          <Button
            onClick={join}
            disabled={!selected}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-lg py-6 disabled:opacity-50"
          >
            <LogIn className="w-5 h-5 mr-2" />
            Entrar como {selected ?? '...'}
          </Button>
        </Card>
      </motion.div>
    </div>
  )
}
