// drafting-and-reporting/components/DraftHistoryDisplay.tsx

'use client';

import React from 'react';
import { ChampionIcon } from './ui/ChampionIcon';
import { cn } from '@/lib/utils';

interface DraftAction {
  series_id: string;
  game_index: number;
  step_index: number;
  action_type: 'pick' | 'ban';
  champion: string;
  drafter_id: string;
  side_of_action: string;
  team_name: string;
  is_winner?: boolean;
}

interface DraftHistoryDisplayProps {
  drafts: DraftAction[];
}

const DraftHistoryDisplay: React.FC<DraftHistoryDisplayProps> = ({ drafts }) => {
  if (!drafts || drafts.length === 0) {
    return <p className="text-center text-gray-600 text-lg">No draft history available.</p>;
  }

  // Group drafts by Series, then by Game
  const seriesGroups = drafts.reduce((acc: Record<string, Record<number, DraftAction[]>>, action) => {
    if (!acc[action.series_id]) {
      acc[action.series_id] = {};
    }
    if (!acc[action.series_id][action.game_index]) {
      acc[action.series_id][action.game_index] = [];
    }
    acc[action.series_id][action.game_index].push(action);
    return acc;
  }, {});

  return (
    <div className="space-y-12">
      {Object.entries(seriesGroups).map(([seriesId, games]) => {
        // Get team names for the series label
        const firstAction = Object.values(games)[0][0];
        const teamNames = Array.from(new Set(Object.values(games).flatMap(g => g.map(a => a.team_name))));
        const seriesLabel = teamNames.join(' vs ');

        // Calculate series score
        const teamScores: Record<string, number> = {};
        teamNames.forEach(name => teamScores[name] = 0);
        
        Object.values(games).forEach(gameDrafts => {
          // A game is won by the team that has is_winner: true in its actions
          const winnerAction = gameDrafts.find(a => a.is_winner);
          if (winnerAction) {
            teamScores[winnerAction.team_name] = (teamScores[winnerAction.team_name] || 0) + 1;
          }
        });

        const scoreLabel = teamNames.map(name => teamScores[name] || 0).join(' - ');

        return (
          <div key={seriesId} className="border-t border-white/10 pt-8">
            <div className="flex justify-between items-end mb-8">
              <div>
                <p className="text-primary text-xs font-black uppercase tracking-widest mb-2">Tournament Series</p>
                <div className="flex items-center gap-6">
                  <h2 className="text-4xl font-black text-white tracking-tight uppercase">
                    {seriesLabel}
                  </h2>
                  <div className="px-4 py-1 bg-white/5 border border-white/10 rounded-xl">
                    <span className="text-2xl font-black text-primary tabular-nums">{scoreLabel}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-12">
              {Object.entries(games).map(([gameIdx, gameDrafts]) => {
                const picks = gameDrafts.filter(a => a.action_type === 'pick');
                const bans = gameDrafts.filter(a => a.action_type === 'ban');
                
                // Group by side for better layout
                const blueActions = gameDrafts.filter(a => a.side_of_action === 'blue');
                const redActions = gameDrafts.filter(a => a.side_of_action === 'red');
                
                const blueWon = blueActions.some(a => a.is_winner);
                const redWon = redActions.some(a => a.is_winner);

                return (
                  <div key={gameIdx} className={cn(
                    "bg-surface-light/20 backdrop-blur-md rounded-3xl overflow-hidden border transition-all shadow-2xl",
                    blueWon ? "border-blue-500/30" : redWon ? "border-red-500/30" : "border-white/10"
                  )}>
                    <div className="bg-white/5 px-8 py-4 border-b border-white/10 flex justify-between items-center">
                      <h3 className="text-lg font-black text-gray-200 uppercase tracking-widest">Game {parseInt(gameIdx, 10) + 1}</h3>
                      <div className="flex gap-4">
                        {blueWon && (
                          <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-500/30">
                            Blue Victory
                          </span>
                        )}
                        {redWon && (
                          <span className="px-3 py-1 bg-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-red-500/30">
                            Red Victory
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-8">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Blue Side */}
                        <div className="relative">
                          <div className="flex items-center space-x-3 pb-4 border-b border-blue-500/30 mb-6">
                            <div className="w-2 h-6 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                            <span className="font-black text-blue-400 uppercase tracking-[0.2em] text-sm">Blue Side</span>
                            <span className="text-gray-400 text-sm font-bold">— {blueActions[0]?.team_name}</span>
                          </div>
                          
                          <div className="space-y-8">
                            <div>
                              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Bans</p>
                              <div className="flex flex-wrap gap-3">
                                {blueActions.filter(a => a.action_type === 'ban').map((a, i) => (
                                  <div key={i} className="relative group">
                                    <div className="opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300 transform hover:scale-110">
                                      <ChampionIcon name={a.champion} size={42} />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Team Composition Picks</p>
                              <div className="flex flex-wrap gap-4">
                                {blueActions.filter(a => a.action_type === 'pick').map((a, i) => (
                                  <div key={i} className="relative group">
                                    <div className="ring-1 ring-blue-500/30 rounded-xl p-0.5 bg-blue-500/5 hover:ring-blue-500 hover:bg-blue-500/10 transition-all duration-300 transform hover:scale-105 shadow-lg">
                                      <ChampionIcon name={a.champion} size={58} />
                                    </div>
                                    <div className="absolute inset-0 bg-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl pointer-events-none" />
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Red Side */}
                        <div className="relative">
                          <div className="flex items-center space-x-3 pb-4 border-b border-red-500/30 mb-6">
                            <div className="w-2 h-6 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                            <span className="font-black text-red-400 uppercase tracking-[0.2em] text-sm">Red Side</span>
                            <span className="text-gray-400 text-sm font-bold">— {redActions[0]?.team_name}</span>
                          </div>
                          
                          <div className="space-y-8">
                            <div>
                              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Bans</p>
                              <div className="flex flex-wrap gap-3">
                                {redActions.filter(a => a.action_type === 'ban').map((a, i) => (
                                  <div key={i} className="relative group">
                                    <div className="opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300 transform hover:scale-110">
                                      <ChampionIcon name={a.champion} size={42} />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Team Composition Picks</p>
                              <div className="flex flex-wrap gap-4">
                                {redActions.filter(a => a.action_type === 'pick').map((a, i) => (
                                  <div key={i} className="relative group">
                                    <div className="ring-1 ring-red-500/30 rounded-xl p-0.5 bg-red-500/5 hover:ring-red-500 hover:bg-red-500/10 transition-all duration-300 transform hover:scale-105 shadow-lg">
                                      <ChampionIcon name={a.champion} size={58} />
                                    </div>
                                    <div className="absolute inset-0 bg-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl pointer-events-none" />
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DraftHistoryDisplay;

