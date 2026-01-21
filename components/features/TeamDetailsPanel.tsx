'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Team } from '@/lib/data/teams';
import { X, Users, Activity, Shield, Sword, BarChart3, PieChart, TrendingUp, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScoutingReportData } from '@/lib/data/scouting';
import { ChampionIcon } from '@/components/ui/ChampionIcon';
import { useEffect, useState } from 'react';
import { getLatestVersion, getChampionIconUrl } from '@/lib/api/ddragon';

interface TeamDetailsPanelProps {
    team: Team | null;
    side?: 'blue' | 'red';
    onClose: () => void;
    report?: ScoutingReportData | null;
}

export function TeamDetailsPanel({ team, side, onClose, report }: TeamDetailsPanelProps) {
    const [version, setVersion] = useState<string>('14.23.1');

    useEffect(() => {
        getLatestVersion().then(setVersion);
    }, []);

    if (!team) return null;

    const winRate = (report?.roster_stats || []).reduce((acc, curr) => acc + curr.WinRate, 0) / ((report?.roster_stats || []).length || 1);

    // Calculate side-specific win rates if available in roster_stats or games
    // Assuming roster_stats might not have side info, let's look at most_picked_champions_by_slot as a proxy for side preference
    // Actually, scouting.ts has most_picked_champions_by_slot: { blue1: [], red1_red2: [] }

    const blueBansCount = report?.most_banned_champions?.by_blue_side?.length || 0;
    const redBansCount = report?.most_banned_champions?.by_red_side?.length || 0;

    // Aggregate top bans by the team (Bans this team makes)
    const topBansByTeam = [
        ...(report?.most_banned_champions?.by_blue_side || []),
        ...(report?.most_banned_champions?.by_red_side || [])
    ].reduce((acc, curr) => {
        const existing = acc.find(b => b.champion === curr.champion);
        if (existing) {
            existing.count += curr.count;
        } else {
            acc.push({ ...curr });
        }
        return acc;
    }, [] as any[]).sort((a, b) => b.count - a.count).slice(0, 5);

    // Aggregate top bans against this team
    const topBansAgainstTeam = [
        ...(report?.most_banned_champions?.against_blue_side || []),
        ...(report?.most_banned_champions?.against_red_side || [])
    ].reduce((acc, curr) => {
        const existing = acc.find(b => b.champion === curr.champion);
        if (existing) {
            existing.count += curr.count;
        } else {
            acc.push({ ...curr });
        }
        return acc;
    }, [] as any[]).sort((a, b) => b.count - a.count).slice(0, 5);

    return (
        <AnimatePresence>
            {team && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                    />

                    {/* Side Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#0C0E14] border-l border-white/10 z-50 shadow-2xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="relative h-48 shrink-0 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0C0E14]" />
                            <div
                                className="absolute inset-0 opacity-20"
                                style={{ backgroundColor: team.color }}
                            />

                            <button
                                onClick={onClose}
                                className="absolute top-6 right-6 p-2 rounded-full bg-black/40 hover:bg-white/10 text-white transition-colors z-20"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            <div className="absolute bottom-6 left-6 z-10">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-bold tracking-widest uppercase border border-white/10">
                                        {team.region}
                                    </span>
                                    <span className="text-primary font-bold tracking-widest text-sm flex items-center gap-1">
                                        <Users className="w-3 h-3" /> TEAM REPORT
                                    </span>
                                </div>
                                <h2 className="text-4xl font-bold text-white uppercase italic tracking-tighter">{team.name}</h2>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar pb-24">
                            {report ? (
                                <>
                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                                            <div className="text-gray-500 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                                <Activity className="w-4 h-4" /> Avg WR
                                            </div>
                                            <div className="text-2xl font-bold text-white">
                                                {winRate.toFixed(1)}%
                                            </div>
                                        </div>
                                        <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                                            <div className="text-gray-500 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                                <BarChart3 className="w-4 h-4" /> Games
                                            </div>
                                            <div className="text-2xl font-bold text-white">
                                                {report.games_count}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Side Strategy */}
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4" /> Draft Priorities
                                        </h3>
                                        <div className="grid grid-cols-1 gap-4">
                                            {side === 'blue' || !side ? (
                                                <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Blue Side Priority</div>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <div className="text-xs text-gray-400 font-medium">B1 / Power Picks</div>
                                                        <div className="space-y-2">
                                                            {report.most_picked_champions_by_slot?.blue1?.length > 0 ? (
                                                                report.most_picked_champions_by_slot.blue1.slice(0, 5).map((item: [string, number], idx: number) => (
                                                                    <div key={idx} className="flex items-center justify-between">
                                                                        <div className="flex items-center gap-2">
                                                                            <ChampionIcon name={item[0]} version={version} size={24} />
                                                                            <span className="text-sm font-bold text-white truncate">{item[0]}</span>
                                                                        </div>
                                                                        <span className="text-xs font-bold text-blue-400">{item[1]} Picks</span>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <span className="text-sm font-bold text-gray-600">No Data</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : null}

                                            {side === 'red' || !side ? (
                                                <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <div className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Red Side Priority</div>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <div className="text-xs text-gray-400 font-medium">R1 / R2 Response</div>
                                                        <div className="space-y-2">
                                                            {report.most_picked_champions_by_slot?.red1_red2?.length > 0 ? (
                                                                report.most_picked_champions_by_slot.red1_red2.slice(0, 5).map((item: [string, number], idx: number) => (
                                                                    <div key={idx} className="flex items-center justify-between">
                                                                        <div className="flex items-center gap-2">
                                                                            <ChampionIcon name={item[0]} version={version} size={24} />
                                                                            <span className="text-sm font-bold text-white truncate">{item[0]}</span>
                                                                        </div>
                                                                        <span className="text-xs font-bold text-red-400">{item[1]} Picks</span>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <span className="text-sm font-bold text-gray-600">No Data</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>

                                    {/* Player Tendencies */}
                                    {report.tendencies && report.tendencies.length > 0 && (
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <Users className="w-4 h-4" /> Player Tendencies
                                            </h3>
                                            <div className="space-y-2">
                                                {report.tendencies.map((t, idx) => (
                                                    <div key={idx} className="p-3 bg-white/5 border border-white/5 rounded-lg flex flex-col gap-1">
                                                        <span className="text-xs font-black text-primary uppercase tracking-wider">{t.name}</span>
                                                        <p className="text-sm text-gray-300 leading-snug">{t.tendency}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Comfort Picks */}
                                    {report.famousPicks && report.famousPicks.length > 0 && (
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <Trophy className="w-4 h-4" /> Comfort Picks
                                            </h3>
                                            <div className="grid grid-cols-1 gap-2">
                                                {report.famousPicks.map((pick, idx) => (
                                                    <div key={idx} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg border border-white/5">
                                                        <ChampionIcon name={pick.name} version={version} size={32} />
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="text-sm font-bold text-white">{pick.name}</span>
                                                                <span className="text-xs font-bold text-green-400">{pick.rate}% PRES</span>
                                                            </div>
                                                            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                                                <div className="h-full bg-green-500" style={{ width: `${pick.rate}%` }} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Bans Section */}
                                    <div className="space-y-6">
                                        {/* Top Bans By Team */}
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <Shield className="w-4 h-4" /> Bans by {team.shortName}
                                            </h3>
                                            <div className="space-y-3">
                                                {topBansByTeam.length > 0 ? topBansByTeam.map((ban) => (
                                                    <div key={`by-${ban.champion}`} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                                                        <ChampionIcon name={ban.champion} version={version} size={40} />
                                                        <div className="flex-1">
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-bold text-sm text-white">{ban.champion}</span>
                                                                <span className="text-xs font-bold text-amber-500">{ban.count} Bans</span>
                                                            </div>
                                                            <div className="flex gap-2 mt-1">
                                                                <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-amber-500/50"
                                                                        style={{ width: `${(ban.count / report.games_count) * 100}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )) : (
                                                    <div className="text-xs text-gray-600 italic p-4 bg-white/5 rounded-xl border border-dashed border-white/10 text-center">
                                                        No ban data available
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Top Bans Against Team */}
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <Sword className="w-4 h-4" /> Bans against {team.shortName}
                                            </h3>
                                            <div className="space-y-3">
                                                {topBansAgainstTeam.length > 0 ? topBansAgainstTeam.map((ban) => (
                                                    <div key={`against-${ban.champion}`} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                                                        <ChampionIcon name={ban.champion} version={version} size={40} />
                                                        <div className="flex-1">
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-bold text-sm text-white">{ban.champion}</span>
                                                                <span className="text-xs font-bold text-red-500">{ban.count} Bans</span>
                                                            </div>
                                                            <div className="flex gap-2 mt-1">
                                                                <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-red-500/50"
                                                                        style={{ width: `${(ban.count / report.games_count) * 100}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )) : (
                                                    <div className="text-xs text-gray-600 italic p-4 bg-white/5 rounded-xl border border-dashed border-white/10 text-center">
                                                        No ban data available
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Player Pools */}
                                    {report.champion_pools_by_player && Object.keys(report.champion_pools_by_player).length > 0 && (
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <PieChart className="w-4 h-4" /> Champion Pools
                                            </h3>
                                            <div className="space-y-6">
                                                {Object.entries(report.champion_pools_by_player).map(([player, champs]) => (
                                                    <div key={player} className="space-y-2">
                                                        <span className="text-xs font-black text-white px-2 py-1 rounded bg-white/10 uppercase">{player}</span>
                                                        <div className="flex flex-wrap gap-2">
                                                            {champs.slice(0, 5).map((c, i) => (
                                                                <div key={i} className="flex items-center gap-2 p-1 pr-3 bg-black/40 border border-white/5 rounded-full" title={`${c.Games} Games, ${c.WinRate}% WR`}>
                                                                    <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10">
                                                                        <img src={getChampionIconUrl(version, c.Champion)} className="w-full h-full object-cover" />
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[10px] font-bold text-gray-300 leading-none">{c.Champion}</span>
                                                                        <span className="text-[9px] font-bold text-gray-500 leading-none">{c.WinRate}% WR</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-4">
                                    <Users className="w-12 h-12 opacity-20" />
                                    <p className="text-sm font-medium italic">No team intelligence data available.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
