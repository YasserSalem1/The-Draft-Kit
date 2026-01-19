// drafting-and-reporting/components/ReportDisplay.tsx

'use client';

import React, { useEffect, useState } from 'react';
import { ScoutingReportData } from '@/lib/data/scouting';
import { getLatestVersion, getChampionIconUrlByName } from '@/lib/api/ddragon';
import { cn } from '@/lib/utils';
import DraftHistoryDisplay from './DraftHistoryDisplay';

interface ScoutingReportProps {
  report: ScoutingReportData;
}

const ChampionIcon = ({ name, version, size = 40 }: { name: string; version: string; size?: number }) => (
  <div 
    className="relative overflow-hidden rounded-lg border border-white/10 bg-surface shadow-md flex-shrink-0"
    style={{ width: size, height: size }}
  >
    <img
      src={getChampionIconUrlByName(version, name)}
      alt={name}
      className="object-cover w-full h-full scale-105"
      onError={(e) => {
        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1a1a1a&color=fff&size=128`;
      }}
    />
  </div>
);

const ReportDisplay: React.FC<ScoutingReportProps> = ({ report }) => {
  const [version, setVersion] = useState<string>('16.1.1');

  useEffect(() => {
    getLatestVersion().then(setVersion);
  }, []);

  if (!report) {
    return <p className="text-gray-400 text-center py-10">No report data available.</p>;
  }

  return (
    <div className="space-y-12">
      {/* Player Stats Grouped by Player */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <span className="w-1.5 h-8 bg-primary rounded-full"></span>
          Player Performance
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(report.player_stats_grouped).map(([player, champions]) => (
            <div key={player} className="bg-surface-light/30 border border-white/10 rounded-2xl p-4 flex flex-col shadow-sm">
              <h3 className="text-base font-black text-gray-300 mb-3 px-1 uppercase tracking-widest border-b border-white/10 pb-2">{player}</h3>
              <div className="space-y-2.5 overflow-y-auto max-h-[400px] pr-2 scrollbar-thin">
                {champions.sort((a, b) => b.played - a.played).map((champ) => (
                  <div key={champ.name} className="flex items-center gap-3 p-2.5 bg-surface/50 rounded-xl border border-white/5 hover:bg-surface/80 transition-all group shadow-sm">
                    <ChampionIcon name={champ.name} version={version} size={44} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-sm text-gray-100 truncate group-hover:text-white">{champ.name}</span>
                        <span className="text-xs font-bold text-gray-400">
                          {champ.played} Games - {((champ.wins / champ.played) * 100).toFixed(0)}% WR
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-3 text-[11px] font-black">
                          <span className="text-blue-400">Blind: {champ.blindPicks}</span>
                          <span className="text-red-400">Counter: {champ.counterPicks}</span>
                        </div>
                        <span className="text-[10px] font-bold text-gray-500 uppercase">
                          {champ.wins}W - {champ.played - champ.wins}L
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Draft Pressure sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Blue Side Draft Pressure */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="w-1.5 h-8 bg-blue-500 rounded-full"></span>
            Blue Side Draft
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { title: 'Banned Against', data: report.most_banned_champions.against_blue_side, color: 'text-blue-400', border: 'border-blue-500/20' },
              { title: 'Banned By', data: report.most_banned_champions.by_blue_side, color: 'text-primary', border: 'border-primary/20' },
            ].map((group) => (
              <div key={group.title} className={cn("bg-surface-light/30 border rounded-2xl p-4 shadow-sm", group.border)}>
                <h3 className={cn("text-xs font-black uppercase tracking-[0.2em] mb-3 border-b border-white/10 pb-2", group.color)}>
                  {group.title}
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {group.data.slice(0, 5).map((stats) => (
                    <div key={stats.champion} className="flex items-center gap-3 p-2 bg-surface/50 rounded-xl border border-white/5">
                      <ChampionIcon name={stats.champion} version={version} size={32} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-bold text-gray-200 truncate">{stats.champion}</span>
                          <span className="text-xs font-black text-white">{stats.count}</span>
                        </div>
                        <div className="flex gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                          <span>Phase 1: <span className="text-gray-300">{stats.phase1}</span></span>
                          <span>Phase 2: <span className="text-gray-300">{stats.phase2}</span></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Red Side Draft Pressure */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="w-1.5 h-8 bg-red-500 rounded-full"></span>
            Red Side Draft
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { title: 'Banned Against', data: report.most_banned_champions.against_red_side, color: 'text-red-400', border: 'border-red-500/20' },
              { title: 'Banned By', data: report.most_banned_champions.by_red_side, color: 'text-red-500', border: 'border-red-500/20' }
            ].map((group) => (
              <div key={group.title} className={cn("bg-surface-light/30 border rounded-2xl p-4 shadow-sm", group.border)}>
                <h3 className={cn("text-xs font-black uppercase tracking-[0.2em] mb-3 border-b border-white/10 pb-2", group.color)}>
                  {group.title}
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {group.data.slice(0, 5).map((stats) => (
                    <div key={stats.champion} className="flex items-center gap-3 p-2 bg-surface/50 rounded-xl border border-white/5">
                      <ChampionIcon name={stats.champion} version={version} size={32} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-bold text-gray-200 truncate">{stats.champion}</span>
                          <span className="text-xs font-black text-white">{stats.count}</span>
                        </div>
                        <div className="flex gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                          <span>Phase 1: <span className="text-gray-300">{stats.phase1}</span></span>
                          <span>Phase 2: <span className="text-gray-300">{stats.phase2}</span></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="space-y-12">
        {/* Most Picked Champions by Slot */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="w-1.5 h-8 bg-green-500 rounded-full"></span>
            Priority Picks
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface-light/30 border border-blue-500/20 rounded-2xl p-6 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-400 mb-6 border-b border-white/10 pb-2">Blue B1</h3>
              <div className="flex flex-wrap gap-4">
                {report.most_picked_champions_by_slot.blue1.slice(0, 10).map(([champ, count]) => (
                  <div key={champ} className="relative group">
                    <ChampionIcon name={champ} version={version} size={56} />
                    <div className="absolute -bottom-1.5 -right-1.5 bg-primary text-[11px] font-black text-white px-2 py-0.5 rounded-md border border-black/50 shadow-lg">
                      {count}
                    </div>
                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg pointer-events-none border border-primary/50">
                      <span className="text-[10px] font-black text-white text-center px-1 uppercase leading-tight">{champ}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-surface-light/30 border border-red-500/20 rounded-2xl p-6 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-red-400 mb-6 border-b border-white/10 pb-2">Red R1/R2</h3>
              <div className="flex flex-wrap gap-4">
                {report.most_picked_champions_by_slot.red1_red2.slice(0, 10).map(([champ, count]) => (
                  <div key={champ} className="relative group">
                    <ChampionIcon name={champ} version={version} size={56} />
                    <div className="absolute -bottom-1.5 -right-1.5 bg-red-500 text-[11px] font-black text-white px-2 py-0.5 rounded-md border border-black/50 shadow-lg">
                      {count}
                    </div>
                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg pointer-events-none border border-red-500/50">
                      <span className="text-[10px] font-black text-white text-center px-1 uppercase leading-tight">{champ}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-4">
        {/* Roster Stats */}
        <section className="space-y-6 col-span-1">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="w-1.5 h-8 bg-purple-500 rounded-full"></span>
            Roster
          </h2>
          <div className="bg-surface-light/30 border border-white/10 rounded-2xl overflow-hidden shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-surface/80 border-b border-white/10 text-gray-400 font-black uppercase tracking-widest">
                <tr>
                  <th className="px-4 py-3 text-left">Player</th>
                  <th className="px-4 py-3 text-center">G</th>
                  <th className="px-4 py-3 text-right">WR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {report.roster_stats.map((stat) => (
                  <tr key={stat.Player} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-bold text-white">{stat.Player}</td>
                    <td className="px-4 py-3 text-center font-mono font-bold text-gray-300">{stat.Games}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn("font-black", stat.WinRate >= 50 ? 'text-green-400' : 'text-red-400')}>
                        {stat.WinRate.toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Champion Pools */}
        <section className="space-y-6 col-span-2">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="w-1.5 h-8 bg-yellow-500 rounded-full"></span>
            Player Champion Pools
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {Object.entries(report.champion_pools_by_player).map(([player, champions]) => (
              <div key={player} className="bg-surface-light/30 border border-white/10 rounded-2xl p-4 shadow-sm">
                <h3 className="text-xs font-black text-gray-300 mb-4 uppercase tracking-[0.2em] border-b border-white/10 pb-2">{player}</h3>
                <div className="space-y-2.5">
                  {champions.slice(0, 5).map((champ) => (
                    <div key={champ.Champion} className="flex items-center gap-3 text-xs">
                      <ChampionIcon name={champ.Champion} version={version} size={28} />
                      <span className="flex-1 font-bold text-gray-100 truncate">{champ.Champion}</span>
                      <div className="flex gap-3 font-mono font-bold">
                        <span className="text-gray-500">{champ.Games}G</span>
                        <span className={cn(parseFloat(champ.WinRate) >= 50 ? 'text-green-400' : 'text-red-400')}>
                          {champ.WinRate}%
                        </span>
                        <span className="text-primary">{champ.KDA}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Match History Section */}
      {report.match_history && report.match_history.length > 0 && (
        <section className="space-y-6 pt-12 border-t border-white/10">
          <h2 className="text-3xl font-black text-white flex items-center gap-4 uppercase tracking-tighter">
            <span className="w-2 h-10 bg-primary rounded-full"></span>
            Match History & Draft Analysis
          </h2>
          <div className="bg-surface-light/5 backdrop-blur-sm rounded-[40px] p-1 border border-white/5 shadow-2xl">
             <div className="bg-background/40 rounded-[39px] p-8">
                <DraftHistoryDisplay drafts={report.match_history} />
             </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default ReportDisplay;

