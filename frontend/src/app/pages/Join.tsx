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

  const code: string = location.state?.code ?? ''
  // Players list passed by the host (in the real game this will come from the backend)
  const playersFromState: { name: string; color: string }[] = location.state?.players ?? [
    { name: 'Jogador 1', color: '#ef4444' },
    { name: 'Jogador 2', color: '#3b82f6' },
    { name: 'Jogador 3', color: '#22c55e' },
    { name: 'Jogador 4', color: '#f59e0b' },
  ]

  const [selected, setSelected] = useState<number | null>(null)

  const join = () => {
    if (selected === null) return
    setGameId(code)
    setMyPlayerId(`player-${selected}`)
    navigate('/game', { state: { players: playersFromState } })
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
          <p className="text-amber-400 text-2xl font-mono tracking-widest">{code}</p>
        </div>

        <Card className="bg-slate-800/80 backdrop-blur-xl border-slate-700 p-6">
          <p className="text-slate-400 text-sm mb-4">Selecione qual jogador você é nesta partida:</p>

          <div className="space-y-3 mb-6">
            {playersFromState.map((player, index) => (
              <motion.button
                key={index}
                onClick={() => setSelected(index)}
                whileTap={{ scale: 0.97 }}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-colors ${
                  selected === index
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                }`}
              >
                <div className="w-10 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: player.color }} />
                <span className="text-white font-medium text-left">{player.name}</span>
                {selected === index && (
                  <span className="ml-auto text-amber-400 text-sm font-bold">Eu</span>
                )}
              </motion.button>
            ))}
          </div>

          <Button
            onClick={join}
            disabled={selected === null}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-lg py-6 disabled:opacity-50"
          >
            <LogIn className="w-5 h-5 mr-2" />
            Entrar como {selected !== null ? playersFromState[selected].name : '...'}
          </Button>
        </Card>
      </motion.div>
    </div>
  )
}
