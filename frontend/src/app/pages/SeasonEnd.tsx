import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Button } from '../components/ui/button';
import { Player } from '../types';
import { motion } from 'motion/react';
import { Trophy, TrendingUp, Award, ArrowRight, Loader2 } from 'lucide-react';
import { gameApi } from '../../api/game';
import { adaptGameState } from '../../api/adapters';
import { useGameStore } from '../../store/gameStore';
import { BackendGameState } from '../../api/types';
import { toast } from 'sonner';
import { Toaster } from '../components/ui/sonner';

export default function SeasonEnd() {
  const navigate = useNavigate();
  const location = useLocation();
  const { gameId: storedGameId, playerColors } = useGameStore()

  const gid: string = location.state?.gameId ?? storedGameId ?? ''

  const [players, setPlayers] = useState<Player[]>([])
  const [season, setSeason] = useState(1)
  const [monkeysFound, setMonkeysFound] = useState(0)
  const [loading, setLoading] = useState(true)
  const [continuing, setContinuing] = useState(false)

  useEffect(() => {
    if (!gid) { navigate('/'); return }
    gameApi.getState(gid).then((res) => {
      const raw: BackendGameState = res.data
      const adapted = adaptGameState(raw, playerColors)
      setPlayers(adapted.players)
      setSeason(adapted.season)
      setMonkeysFound(adapted.monkeysFound)
      setLoading(false)
    }).catch(() => navigate('/'))
  }, [gid, navigate, playerColors])

  const nextSeason = async () => {
    setContinuing(true)
    try {
      await gameApi.nextSeason(gid)
      navigate('/game', { state: { gameCode: gid } })
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? 'Erro ao avançar temporada')
      setContinuing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
      </div>
    )
  }

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score)
  const leader = sortedPlayers[0]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Toaster position="top-center" />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-3xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }} className="inline-block mb-4">
            <Award className="w-20 h-20 text-amber-500" />
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-2">Fim da Temporada {season}</h1>
          <p className="text-slate-400 text-lg">Resumo da rodada</p>
          {monkeysFound >= 3 && (
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: 'spring' }}
              className="mt-4 inline-block bg-orange-500/30 border-2 border-orange-500 rounded-lg px-6 py-3"
            >
              <p className="text-2xl font-bold text-orange-200">🙈🙉🙊 3 Macacos Revelados!</p>
              <p className="text-sm text-orange-300 mt-1">A temporada terminou prematuramente</p>
            </motion.div>
          )}
        </div>

        {/* Leader */}
        {leader && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-6 mb-6"
          >
            <div className="flex items-center gap-4">
              <Trophy className="w-12 h-12 text-white" />
              <div className="flex-1">
                <div className="text-white/80 text-sm mb-1">Líder da Temporada</div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full" style={{ backgroundColor: leader.color }} />
                  <div>
                    <h3 className="text-2xl font-bold text-white">{leader.name}</h3>
                    <p className="text-white/90">{leader.score} pontos</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Rankings */}
        <div className="bg-slate-800/80 backdrop-blur-xl rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-400" />
            Classificação
          </h2>
          <div className="space-y-3">
            {sortedPlayers.map((player, index) => (
              <motion.div
                key={player.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className={`flex items-center gap-4 p-4 rounded-lg ${index === 0 ? 'bg-amber-500/20' : 'bg-slate-700/50'}`}
              >
                <div className="text-2xl font-bold text-white w-8">#{index + 1}</div>
                <div className="w-10 h-10 rounded-full" style={{ backgroundColor: player.color }} />
                <div className="flex-1">
                  <div className="font-bold text-white">{player.name}</div>
                  <div className="text-sm text-slate-400">Posição: {player.position}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">{player.score}</div>
                  <div className="text-sm text-slate-400">pontos</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Tracks progress */}
        <div className="bg-slate-800/80 backdrop-blur-xl rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-bold text-white mb-4">Progresso nas Trilhas</h3>
          {sortedPlayers.map((player) => (
            <div key={player.id} className="mb-4 last:mb-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: player.color }} />
                <span className="text-sm text-white font-medium">{player.name}</span>
                <span className="text-xs text-slate-400 ml-auto">{player.position}/10</span>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: 10 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.8 + i * 0.05 }}
                    className={`w-full h-3 rounded ${i < player.position ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-slate-700'}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <Button
          onClick={nextSeason}
          disabled={continuing}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-lg py-6"
        >
          {continuing ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <ArrowRight className="w-5 h-5 mr-2" />}
          Próxima Temporada
        </Button>
      </motion.div>
    </div>
  );
}
