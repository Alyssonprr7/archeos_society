import { useNavigate, useLocation } from 'react-router';
import { Button } from '../components/ui/button';
import { Player } from '../types';
import { motion } from 'motion/react';
import { Trophy, TrendingUp, Award, ArrowRight } from 'lucide-react';
import { useEffect } from 'react';

export default function SeasonEnd() {
  const navigate = useNavigate();
  const location = useLocation();
  const { players, season, monkeyEnd } = location.state || {};

  // Redirect if no state data
  useEffect(() => {
    if (!players || !season) {
      navigate('/');
    }
  }, [players, season, navigate]);

  // Guard clause
  if (!players || !season) {
    return null;
  }

  // Sort players by score
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const leader = sortedPlayers[0];

  const nextSeason = () => {
    // Check if game should end (e.g., after season 3)
    if (season >= 3) {
      navigate('/game-end', { state: { players } });
    } else {
      navigate('/game', { 
        state: { 
          players, 
          season: season + 1 
        } 
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-3xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="inline-block mb-4"
          >
            <Award className="w-20 h-20 text-amber-500" />
          </motion.div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-2">
            Fim da Temporada {season}
          </h1>
          <p className="text-slate-400 text-lg">Resumo da rodada</p>
          
          {monkeyEnd && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className="mt-4 inline-block bg-orange-500/30 border-2 border-orange-500 rounded-lg px-6 py-3"
            >
              <p className="text-2xl font-bold text-orange-200">
                🙈🙉🙊 3 Macacos Revelados!
              </p>
              <p className="text-sm text-orange-300 mt-1">
                A temporada terminou prematuramente
              </p>
            </motion.div>
          )}
        </div>

        {/* Leader Highlight */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center gap-4">
            <Trophy className="w-12 h-12 text-white" />
            <div className="flex-1">
              <div className="text-white/80 text-sm mb-1">Líder da Temporada</div>
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-full"
                  style={{ backgroundColor: leader.color }}
                />
                <div>
                  <h3 className="text-2xl font-bold text-white">{leader.name}</h3>
                  <p className="text-white/90">{leader.score} pontos</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Rankings */}
        <div className="bg-slate-800/80 backdrop-blur-xl rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-400" />
            Classificação
          </h2>
          
          <div className="space-y-3">
            {sortedPlayers.map((player: Player, index) => (
              <motion.div
                key={player.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className={`
                  flex items-center gap-4 p-4 rounded-lg
                  ${index === 0 ? 'bg-amber-500/20' : 'bg-slate-700/50'}
                `}
              >
                <div className="text-2xl font-bold text-white w-8">
                  #{index + 1}
                </div>
                
                <div 
                  className="w-10 h-10 rounded-full"
                  style={{ backgroundColor: player.color }}
                />
                
                <div className="flex-1">
                  <div className="font-bold text-white">{player.name}</div>
                  <div className="text-sm text-slate-400">
                    Posição na trilha: {player.position}/10
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">{player.score}</div>
                  <div className="text-sm text-slate-400">pontos</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Progress Summary */}
        <div className="bg-slate-800/80 backdrop-blur-xl rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-bold text-white mb-4">Progresso nas Trilhas</h3>
          
          {sortedPlayers.map((player: Player) => (
            <div key={player.id} className="mb-4 last:mb-0">
              <div className="flex items-center gap-2 mb-2">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: player.color }}
                />
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
                    className={`w-full h-3 rounded ${
                      i < player.position 
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500' 
                        : 'bg-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Continue Button */}
        <Button
          onClick={nextSeason}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-lg py-6"
        >
          {season >= 3 ? 'Ver Resultado Final' : 'Próxima Temporada'}
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </motion.div>
    </div>
  );
}