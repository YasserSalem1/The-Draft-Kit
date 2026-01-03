// drafting-and-reporting/components/ReportDisplay.tsx

'use client';

import React from 'react';

import { ScoutingReportData } from '@/lib/data/scouting';

interface ScoutingReportProps {
  report: ScoutingReportData;
}

const ReportDisplay: React.FC<ScoutingReportProps> = ({ report }) => {
  if (!report) {
    return <p>No report data available.</p>;
  }

  return (
    <div className="space-y-8">
      {/* Player Stats Grouped by Player */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <span className="w-1 h-8 bg-primary rounded-full"></span>
          Player Champion Stats
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(report.player_stats_grouped).map(([player, champions]) => (
            <div key={player} className="bg-surface-light/50 border border-white/10 rounded-xl p-6 hover:border-primary/30 transition-colors">
              <h3 className="text-xl font-bold text-white mb-4 pb-3 border-b border-white/10">{player}</h3>
              <div className="space-y-2">
                {champions.map((champ) => (
                  <div key={champ.name} className="flex items-center justify-between py-2 px-3 bg-surface/50 rounded-lg">
                    <span className="font-semibold text-gray-200">{champ.name}</span>
                    <div className="flex gap-4 text-sm">
                      <span className="text-gray-400">Played: <span className="text-white font-bold">{champ.played}</span></span>
                      <span className="text-gray-400">Wins: <span className="text-green-400 font-bold">{champ.wins}</span></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Most Banned Champions */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <span className="w-1 h-8 bg-red-500 rounded-full"></span>
          Most Banned Champions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface-light/50 border border-blue-500/20 rounded-xl p-5">
            <h3 className="text-lg font-bold text-blue-300 mb-4 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              Against Blue Side
            </h3>
            <div className="space-y-2">
              {report.most_banned_champions.against_blue_side.map(([champ, count]) => (
                <div key={champ} className="flex items-center justify-between py-2 px-3 bg-surface/50 rounded-lg">
                  <span className="text-gray-200 font-medium">{champ}</span>
                  <span className="text-red-400 font-bold">{count} bans</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-surface-light/50 border border-red-500/20 rounded-xl p-5">
            <h3 className="text-lg font-bold text-red-300 mb-4 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              Against Red Side
            </h3>
            <div className="space-y-2">
              {report.most_banned_champions.against_red_side.map(([champ, count]) => (
                <div key={champ} className="flex items-center justify-between py-2 px-3 bg-surface/50 rounded-lg">
                  <span className="text-gray-200 font-medium">{champ}</span>
                  <span className="text-red-400 font-bold">{count} bans</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-surface-light/50 border border-primary/20 rounded-xl p-5">
            <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary"></div>
              By Blue Side
            </h3>
            <div className="space-y-2">
              {report.most_banned_champions.by_blue_side.map(([champ, count]) => (
                <div key={champ} className="flex items-center justify-between py-2 px-3 bg-surface/50 rounded-lg">
                  <span className="text-gray-200 font-medium">{champ}</span>
                  <span className="text-yellow-400 font-bold">{count} bans</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-surface-light/50 border border-primary/20 rounded-xl p-5">
            <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary"></div>
              By Red Side
            </h3>
            <div className="space-y-2">
              {report.most_banned_champions.by_red_side.map(([champ, count]) => (
                <div key={champ} className="flex items-center justify-between py-2 px-3 bg-surface/50 rounded-lg">
                  <span className="text-gray-200 font-medium">{champ}</span>
                  <span className="text-yellow-400 font-bold">{count} bans</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Most Picked Champions by Slot */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <span className="w-1 h-8 bg-green-500 rounded-full"></span>
          Most Picked Champions by Slot
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-surface-light/50 border border-blue-500/20 rounded-xl p-5">
            <h3 className="text-lg font-bold text-blue-300 mb-4 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              Blue 1st Pick
            </h3>
            <div className="space-y-2">
              {report.most_picked_champions_by_slot.blue1.map(([champ, count]) => (
                <div key={champ} className="flex items-center justify-between py-2 px-3 bg-surface/50 rounded-lg">
                  <span className="text-gray-200 font-medium">{champ}</span>
                  <span className="text-green-400 font-bold">{count} picks</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-surface-light/50 border border-red-500/20 rounded-xl p-5">
            <h3 className="text-lg font-bold text-red-300 mb-4 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              Red 1st & 2nd Picks
            </h3>
            <div className="space-y-2">
              {report.most_picked_champions_by_slot.red1_red2.map(([champ, count]) => (
                <div key={champ} className="flex items-center justify-between py-2 px-3 bg-surface/50 rounded-lg">
                  <span className="text-gray-200 font-medium">{champ}</span>
                  <span className="text-green-400 font-bold">{count} picks</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Roster Stats */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <span className="w-1 h-8 bg-purple-500 rounded-full"></span>
          Active Roster Stats
        </h2>
        <div className="bg-surface-light/50 border border-white/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-surface/80 border-b border-white/10">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Player</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Role</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Games</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Win Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {report.roster_stats.map((stat, idx) => (
                  <tr key={`${stat.Player}-${stat.Role}`} className={idx % 2 === 0 ? 'bg-surface/30' : 'bg-surface-light/30'}>
                    <td className="px-6 py-4 whitespace-nowrap text-white font-semibold">{stat.Player}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-300">{stat.Role}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-400">{stat.Games}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`font-bold ${stat.WinRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                        {stat.WinRate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Champion Pools by Player */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <span className="w-1 h-8 bg-yellow-500 rounded-full"></span>
          Champion Pools by Player (Top 5)
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Object.entries(report.champion_pools_by_player).map(([player, champions]) => (
            <div key={player} className="bg-surface-light/50 border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4 pb-3 border-b border-white/10">{player}</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-surface/80 border-b border-white/10">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Champion</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Games</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Win Rate</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">KDA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {champions.map((champ, idx) => (
                      <tr key={champ.Champion} className={idx % 2 === 0 ? 'bg-surface/30' : 'bg-surface-light/30'}>
                        <td className="px-4 py-3 whitespace-nowrap text-white font-medium">{champ.Champion}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-400">{champ.Games}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`font-bold ${parseFloat(champ.WinRate) >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                            {champ.WinRate}%
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-300 font-mono">{champ.KDA}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ReportDisplay;

