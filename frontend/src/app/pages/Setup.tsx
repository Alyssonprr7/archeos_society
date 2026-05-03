import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Role } from '../types';
import { motion } from 'motion/react';
import { CheckCircle2, Circle, MapPin, Play } from 'lucide-react';

const availableRoles: Role[] = [
  {
    id: '1',
    name: 'Arqueólogo',
    description: 'Especialista em escavações',
    ability: '+1 carta ao comprar do deck',
  },
  {
    id: '2',
    name: 'Explorador',
    description: 'Mestre das expedições',
    ability: 'Pode fazer expedições com 2 cartas',
  },
  {
    id: '3',
    name: 'Pesquisador',
    description: 'Expert em análises',
    ability: 'Ver 2 cartas extras do mercado',
  },
  {
    id: '4',
    name: 'Patrocinador',
    description: 'Rico e influente',
    ability: 'Começa com +2 pontos',
  },
  {
    id: '5',
    name: 'Guia',
    description: 'Conhecedor dos caminhos',
    ability: '+1 movimento na trilha',
  },
  {
    id: '6',
    name: 'Colecionador',
    description: 'Acumula artefatos',
    ability: 'Limite de mão: 12 cartas',
  },
];

const archaeologicalSites = [
  { id: '1', name: 'Pirâmides do Egito', icon: '🏜️' },
  { id: '2', name: 'Machu Picchu', icon: '⛰️' },
  { id: '3', name: 'Angkor Wat', icon: '🏯' },
  { id: '4', name: 'Stonehenge', icon: '🗿' },
];

export default function Setup() {
  const navigate = useNavigate();
  const location = useLocation();
  const players = location.state?.players || [];
  
  const [selectedRoles, setSelectedRoles] = useState<{ [playerId: number]: Role }>({});
  const [selectedSites, setSelectedSites] = useState<string[]>(['1', '2', '3']);

  const toggleRole = (playerIndex: number, role: Role) => {
    setSelectedRoles({
      ...selectedRoles,
      [playerIndex]: role,
    });
  };

  const toggleSite = (siteId: string) => {
    if (selectedSites.includes(siteId)) {
      setSelectedSites(selectedSites.filter(id => id !== siteId));
    } else {
      setSelectedSites([...selectedSites, siteId]);
    }
  };

  const startGame = () => {
    navigate('/game', { state: { players, selectedRoles, selectedSites } });
  };

  const allRolesSelected = players.length === Object.keys(selectedRoles).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 overflow-y-auto">
      <div className="max-w-6xl mx-auto py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 text-center">
            Configuração da Partida
          </h1>
          <p className="text-slate-400 text-center mb-8">
            Escolha os papéis e os sítios arqueológicos
          </p>

          {/* Role Selection */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Circle className="w-6 h-6 text-blue-400" />
              Seleção de Papéis
            </h2>
            
            <div className="grid gap-6">
              {players.map((player: any, index: number) => (
                <Card key={index} className="bg-slate-800/80 backdrop-blur-xl border-slate-700 p-4 md:p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div 
                      className="w-10 h-10 rounded-full flex-shrink-0"
                      style={{ backgroundColor: player.color }}
                    />
                    <h3 className="text-xl font-bold text-white">{player.name}</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {availableRoles.map((role) => {
                      const isSelected = selectedRoles[index]?.id === role.id;
                      return (
                        <motion.div
                          key={role.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => toggleRole(index, role)}
                          className={`
                            p-4 rounded-lg cursor-pointer transition-all
                            ${isSelected 
                              ? 'bg-gradient-to-br from-amber-500 to-orange-500 ring-2 ring-amber-400' 
                              : 'bg-slate-700/50 hover:bg-slate-700'
                            }
                          `}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-bold text-white text-sm">{role.name}</h4>
                            {isSelected ? (
                              <CheckCircle2 className="w-5 h-5 text-white flex-shrink-0" />
                            ) : (
                              <Circle className="w-5 h-5 text-slate-400 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-slate-300 mb-1">{role.description}</p>
                          <p className="text-xs text-amber-300 font-semibold">{role.ability}</p>
                        </motion.div>
                      );
                    })}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Archaeological Sites */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <MapPin className="w-6 h-6 text-green-400" />
              Sítios Arqueológicos
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {archaeologicalSites.map((site) => {
                const isSelected = selectedSites.includes(site.id);
                return (
                  <motion.div
                    key={site.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleSite(site.id)}
                    className={`
                      p-6 rounded-xl cursor-pointer transition-all text-center
                      ${isSelected
                        ? 'bg-gradient-to-br from-green-500 to-emerald-500 ring-2 ring-green-400'
                        : 'bg-slate-800/50 hover:bg-slate-700/50'
                      }
                    `}
                  >
                    <div className="text-4xl mb-2">{site.icon}</div>
                    <h4 className="font-bold text-white text-sm">{site.name}</h4>
                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-white mx-auto mt-2" />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Confirm Button */}
          <Button
            onClick={startGame}
            disabled={!allRolesSelected || selectedSites.length < 2}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-lg py-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-5 h-5 mr-2" />
            Confirmar Setup
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
