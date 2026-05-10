import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Button } from '../components/ui/button';
import { GameCard } from '../components/GameCard';
import { GameCard as GameCardType } from '../types';
import { motion } from 'motion/react';
import { ArrowLeft, Crown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '../components/ui/sonner';
import { gameApi } from '../../api/game';

export default function Expedition() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as {
    gameId?: string
    playerId?: string
    selectedIndices?: number[]
    selectedCards?: GameCardType[]
  }
  const { gameId, playerId, selectedIndices, selectedCards } = state

  const LEADER_ABILITIES: Record<string, string> = {
    'Guia':       'Sempre avança na trilha da região, independente do tamanho da expedição.',
    'Linguista':  'Avança na trilha do Linguista. O jogador com mais avanços ganha +2 pontos no fim da temporada.',
    'Professor':  'Escolha qualquer trilha para avançar. Acumula tokens — maior soma avança, menor recua no fim da temporada.',
    'Piloto':     'Escolha qualquer trilha para avançar.',
    'Estudante':  'Não avança na trilha de nenhuma região.',
    'Médico':     'Mantém todas as cartas na mão após a expedição (não descarta).',
    'Cartógrafo': 'Mantém as cartas na mão e ganha um turno extra se ainda tiver cartas.',
    'Patrono':    'Compra N cartas do baralho, onde N é o tamanho da expedição.',
    'Botânico':   'A próxima carta comprada do baralho vai para a sua mão.',
    'Curador':    'Ganha 1 relíquia. Relíquias valem pontos progressivos no fim da temporada.',
    'Fotógrafo':  'Conta +1 no tamanho efetivo da expedição para pontuação e avanço de trilha.',
    'Explorador': 'Avança na trilha da região se o tamanho da expedição superar sua posição atual.',
    'Mercenário': 'Coringa — pode entrar em qualquer expedição, mas não pode ser líder.',
  }

  const [leaderPos, setLeaderPos] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!gameId || !playerId || !selectedCards?.length) navigate('/')
  }, [gameId, playerId, selectedCards, navigate])

  if (!gameId || !playerId || !selectedCards?.length) return null

  const leaderCard = leaderPos !== null ? selectedCards[leaderPos] : null

  const isValidMember = (card: GameCardType) => {
    if (!leaderCard || card === leaderCard) return true
    return card.region === leaderCard.region || card.role === leaderCard.role
  }

  const allValid = leaderPos !== null && selectedCards.every((c: GameCardType, i: number) =>
    i === leaderPos || isValidMember(c)
  )

  const submitExpedition = async () => {
    if (leaderPos === null) { toast.error('Escolha o líder da expedição!'); return }
    if (!allValid) { toast.error('Algumas cartas não são compatíveis com o líder!'); return }

    setLoading(true)
    try {
      await gameApi.playExpedition(gameId, {
        player_id: playerId,
        card_indices: selectedIndices ?? [],
        leader_index: leaderPos,
      })
      toast.success('Expedição realizada!')
      navigate('/game', { state: { gameCode: gameId } })
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? 'Erro ao jogar expedição')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 overflow-y-auto">
      <Toaster position="top-center" />
      <div className="max-w-3xl mx-auto py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <button
            onClick={() => navigate(-1)}
            className="text-slate-400 hover:text-white text-sm mb-6 flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Expedição</h1>
          <p className="text-slate-400 mb-8">
            Clique em uma carta para torná-la líder. As demais devem compartilhar região ou papel com o líder.
          </p>

          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              Cartas Selecionadas
            </h2>
            <div className="flex flex-wrap gap-4">
              {selectedCards.map((card: GameCardType, idx: number) => {
                const isLeader = leaderPos === idx
                const valid = leaderPos === null || idx === leaderPos || isValidMember(card)
                return (
                  <motion.div
                    key={card.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setLeaderPos(idx)}
                    className={`relative cursor-pointer rounded-xl ring-2 transition-all ${
                      isLeader
                        ? 'ring-amber-400 shadow-lg shadow-amber-500/30'
                        : valid
                        ? 'ring-transparent hover:ring-slate-500'
                        : 'ring-red-500 opacity-60'
                    }`}
                  >
                    <GameCard card={card} />
                    {isLeader && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 rounded-full px-2 py-0.5 text-xs font-bold text-white flex items-center gap-1 whitespace-nowrap">
                        <Crown className="w-3 h-3" /> Líder
                      </div>
                    )}
                    {leaderPos !== null && !valid && (
                      <div className="absolute inset-0 bg-red-900/40 rounded-xl flex items-center justify-center">
                        <span className="text-red-400 text-xs font-bold">Incompatível</span>
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </div>

          {leaderCard && (
            <div className="bg-slate-800/60 rounded-xl p-4 mb-6 text-sm text-slate-300">
              <p>
                Líder: <span className="text-amber-300 font-semibold">{leaderCard.role ?? leaderCard.function}</span>
                {leaderCard.region && <> da região <span className="text-amber-300 font-semibold">{leaderCard.region}</span></>}
              </p>
              {leaderCard.role && LEADER_ABILITIES[leaderCard.role] && (
                <div className="mt-2 flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
                  <Crown className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-amber-200 text-xs">{LEADER_ABILITIES[leaderCard.role]}</p>
                </div>
              )}
              <p className="mt-2 text-slate-400 text-xs">
                As outras cartas devem ter o mesmo papel ou a mesma região.
              </p>
            </div>
          )}

          <Button
            onClick={submitExpedition}
            disabled={leaderPos === null || !allValid || loading}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-lg py-6 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Crown className="w-5 h-5 mr-2" />}
            Confirmar Expedição
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
