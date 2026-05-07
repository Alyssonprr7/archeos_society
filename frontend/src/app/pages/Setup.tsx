import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { motion } from 'motion/react';
import { CheckCircle2, Circle, MapPin, Play, Loader2, Copy, Check, ArrowRight } from 'lucide-react';
import { gameApi } from '../../api/game';
import { useGameStore } from '../../store/gameStore';
import { toast } from 'sonner';
import { Toaster } from '../components/ui/sonner';

const AVAILABLE_ROLES = [
  'Botânico', 'Linguista', 'Professor', 'Explorador', 'Guia',
  'Médico', 'Mercenário', 'Cartógrafo', 'Piloto', 'Patrono',
  'Curador', 'Fotógrafo', 'Estudante',
]

const SITES = [
  'América do Norte', 'América do Sul', 'Europa', 'África', 'Ásia', 'Oceania',
]

type SiteSide = 'A' | 'B'

export default function Setup() {
  const navigate = useNavigate();
  const location = useLocation();
  const players: { name: string; color: string }[] = location.state?.players || [];

  const { setGameId, setMyPlayerId } = useGameStore()

  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set())
  const [siteConfigs, setSiteConfigs] = useState<Record<string, SiteSide>>(
    Object.fromEntries(SITES.map((s) => [s, 'A' as SiteSide]))
  )
  const [loading, setLoading] = useState(false)
  const [createdGameId, setCreatedGameId] = useState<string | null>(null)
  const [codeCopied, setCodeCopied] = useState(false)

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) => {
      const next = new Set(prev)
      if (next.has(role)) next.delete(role)
      else next.add(role)
      return next
    })
  }

  const toggleSite = (site: string) => {
    setSiteConfigs((prev) => ({
      ...prev,
      [site]: prev[site] === 'A' ? 'B' : 'A',
    }))
  }

  const createGame = async () => {
    if (selectedRoles.size < 6) {
      toast.error('Selecione pelo menos 6 papéis para o baralho')
      return
    }
    setLoading(true)
    try {
      const res = await gameApi.createGame({
        player_ids: players.map((p) => p.name),
        selected_roles: Array.from(selectedRoles),
        site_configs: siteConfigs,
      })
      const gameId: string = res.data.game_id
      setGameId(gameId)
      setMyPlayerId(players[0].name)
      setCreatedGameId(gameId)
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? 'Erro ao criar partida')
    } finally {
      setLoading(false)
    }
  }

  const copyCode = async () => {
    if (!createdGameId) return
    await navigator.clipboard.writeText(createdGameId)
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  const goToGame = () => {
    navigate('/game', { state: { gameCode: createdGameId } })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 overflow-y-auto">
      <Toaster position="top-center" />
      <div className="max-w-4xl mx-auto py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 text-center">
            Configuração da Partida
          </h1>
          <p className="text-slate-400 text-center mb-8">
            Escolha os papéis do baralho e as configurações dos sítios
          </p>

          {/* Game code — shown after creation */}
          {createdGameId && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-500/15 border-2 border-green-500 rounded-2xl p-6 mb-8 text-center"
            >
              <p className="text-green-300 font-semibold mb-2">Partida criada! Compartilhe o código com os outros jogadores:</p>
              <div className="flex items-center justify-center gap-3 mb-3">
                <span className="text-2xl font-mono text-white bg-slate-800 rounded-xl px-4 py-2 select-all break-all">
                  {createdGameId}
                </span>
                <button onClick={copyCode} className="text-slate-400 hover:text-white flex-shrink-0">
                  {codeCopied ? <Check className="w-6 h-6 text-green-400" /> : <Copy className="w-6 h-6" />}
                </button>
              </div>
              <p className="text-slate-400 text-sm">Os outros jogadores entram em "Entrar em Partida" e colam esse código.</p>
            </motion.div>
          )}

          {/* Role selection */}
          <Card className="bg-slate-800/80 backdrop-blur-xl border-slate-700 p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
              <Circle className="w-5 h-5 text-blue-400" />
              Papéis no Baralho
            </h2>
            <p className="text-slate-400 text-sm mb-4">
              Selecione os papéis disponíveis ({selectedRoles.size} selecionados — mínimo 6)
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {AVAILABLE_ROLES.map((role) => {
                const isSelected = selectedRoles.has(role)
                return (
                  <motion.div
                    key={role}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => !createdGameId && toggleRole(role)}
                    className={`
                      p-3 rounded-lg transition-all flex items-center justify-between
                      ${createdGameId ? 'opacity-60 cursor-default' : 'cursor-pointer'}
                      ${isSelected
                        ? 'bg-gradient-to-br from-amber-500 to-orange-500 ring-2 ring-amber-400'
                        : 'bg-slate-700/50 hover:bg-slate-700'
                      }
                    `}
                  >
                    <span className="font-medium text-white text-sm">{role}</span>
                    {isSelected
                      ? <CheckCircle2 className="w-4 h-4 text-white flex-shrink-0" />
                      : <Circle className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    }
                  </motion.div>
                )
              })}
            </div>
          </Card>

          {/* Site configuration */}
          <Card className="bg-slate-800/80 backdrop-blur-xl border-slate-700 p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-400" />
              Sítios Arqueológicos
            </h2>
            <p className="text-slate-400 text-sm mb-4">
              Lado A (Básico) ou Lado B (Avançado) — clique para alternar
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {SITES.map((site) => {
                const side = siteConfigs[site]
                return (
                  <motion.div
                    key={site}
                    whileHover={{ scale: createdGameId ? 1 : 1.02 }}
                    whileTap={{ scale: createdGameId ? 1 : 0.98 }}
                    onClick={() => !createdGameId && toggleSite(site)}
                    className={`p-4 rounded-xl text-center ${createdGameId ? 'opacity-60 cursor-default' : 'cursor-pointer bg-slate-700/50 hover:bg-slate-700'}`}
                  >
                    <div className="text-white font-bold text-sm mb-2">{site}</div>
                    <div className={`
                      inline-block px-3 py-1 rounded-full text-xs font-bold
                      ${side === 'A'
                        ? 'bg-blue-500/30 text-blue-300 ring-1 ring-blue-500'
                        : 'bg-purple-500/30 text-purple-300 ring-1 ring-purple-500'
                      }
                    `}>
                      Lado {side}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </Card>

          {/* Players */}
          <Card className="bg-slate-800/80 backdrop-blur-xl border-slate-700 p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Jogadores</h2>
            <div className="flex flex-wrap gap-3">
              {players.map((p) => (
                <div key={p.name} className="flex items-center gap-2 bg-slate-700/50 rounded-lg px-3 py-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="text-white text-sm font-medium">{p.name}</span>
                </div>
              ))}
            </div>
          </Card>

          {!createdGameId ? (
            <Button
              onClick={createGame}
              disabled={selectedRoles.size < 6 || loading}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-lg py-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Play className="w-5 h-5 mr-2" />}
              Criar Partida
            </Button>
          ) : (
            <Button
              onClick={goToGame}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-lg py-6"
            >
              <ArrowRight className="w-5 h-5 mr-2" />
              Ir para o Jogo (como {players[0]?.name})
            </Button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
