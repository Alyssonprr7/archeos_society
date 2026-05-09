import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Button } from '../components/ui/button';
import { motion } from 'motion/react';
import { Trophy, Crown, Medal, RotateCcw, Home, Sparkles, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { gameApi } from '../../api/game';
import { useGameStore } from '../../store/gameStore';
import { BackendRankingEntry } from '../../api/types';

export default function GameEnd() {
  const navigate = useNavigate();
  const location = useLocation();
  const { gameId: storedGameId, playerColors, reset } = useGameStore()

  const gid: string = location.state?.gameId ?? storedGameId ?? ''

  const [ranking, setRanking] = useState<BackendRankingEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!gid) { navigate('/'); return }
    gameApi.getSummary(gid).then((res) => {
      const data: BackendRankingEntry[] = res.data.ranking
      setRanking(data)
      setLoading(false)

      const colors = ['#fbbf24', '#f59e0b', '#ef4444', '#3b82f6']
      const end = Date.now() + 3000
      ;(function frame() {
        confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors })
        confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors })
        if (Date.now() < end) requestAnimationFrame(frame)
      }())
    }).catch(() => navigate('/'))
  }, [gid, navigate])

  const PLAYER_COLORS_FALLBACK = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#f97316']

  const getColor = (playerId: string, index: number) =>
    playerColors[playerId] ?? PLAYER_COLORS_FALLBACK[index % PLAYER_COLORS_FALLBACK.length]

  const getMedalIcon = (position: number) => {
    if (position === 0) return <Crown className="w-8 h-8 text-amber-500" />
    if (position === 1) return <Medal className="w-7 h-7 text-slate-400" />
    if (position === 2) return <Medal className="w-6 h-6 text-orange-700" />
    return null
  }

  const playAgain = () => {
    reset()
    navigate('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
      </div>
    )
  }

  const winner = ranking[0]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-4xl py-8"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="inline-block mb-4"
          >
            <Trophy className="w-24 h-24 text-amber-500" />
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-2">Fim de Jogo!</h1>
          <p className="text-slate-400 text-lg">A expedição chegou ao fim</p>
        </div>

        {/* Winner */}
        {winner && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-500 rounded-2xl p-8 mb-8 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.1) 20px, rgba(255,255,255,0.1) 40px)`
            }} />
            <div className="relative">
              <Sparkles className="w-12 h-12 text-white mx-auto mb-4" />
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">🎉 Vencedor! 🎉</h2>
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full ring-4 ring-white" style={{ backgroundColor: getColor(winner.player_id, 0) }} />
                <div className="text-left">
                  <h3 className="text-3xl md:text-5xl font-bold text-white">{winner.player_id}</h3>
                  <p className="text-2xl text-white/90">{winner.total_score} pontos</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Rankings */}
        <div className="bg-slate-800/80 backdrop-blur-xl rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Classificação Final</h2>
          <div className="space-y-4">
            {ranking.map((entry, index) => (
              <motion.div
                key={entry.player_id}
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6 + index * 0.15 }}
                className={`
                  relative overflow-hidden rounded-xl p-5
                  ${index === 0 ? 'bg-gradient-to-r from-amber-500/30 to-orange-500/30 ring-2 ring-amber-500' :
                    index === 1 ? 'bg-slate-700/70 ring-2 ring-slate-500' :
                    index === 2 ? 'bg-slate-700/50 ring-2 ring-orange-700' :
                    'bg-slate-700/30'
                  }
                `}
              >
                {index < 3 && <div className="absolute top-0 right-0 p-3">{getMedalIcon(index)}</div>}
                <div className="flex items-center gap-4">
                  <div className={`text-3xl font-bold w-12 text-center ${
                    index === 0 ? 'text-amber-400' : index === 1 ? 'text-slate-300' : index === 2 ? 'text-orange-600' : 'text-slate-500'
                  }`}>
                    #{index + 1}
                  </div>
                  <div className="w-14 h-14 rounded-full ring-2 ring-white/50" style={{ backgroundColor: getColor(entry.player_id, index) }} />
                  <div className="flex-1">
                    <div className="text-xl font-bold text-white mb-1">{entry.player_id}</div>
                    <div className="text-sm text-slate-300">
                      Maior expedição: {entry.max_expedition} carta(s)
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-white">{entry.total_score}</div>
                    <div className="text-sm text-slate-400">pontos</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="flex-1 bg-slate-700 border-slate-600 hover:bg-slate-600 py-6 text-lg"
          >
            <Home className="w-5 h-5 mr-2" />
            Menu Principal
          </Button>
          <Button
            onClick={playAgain}
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-lg py-6"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Jogar Novamente
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
