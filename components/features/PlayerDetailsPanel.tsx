'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Player } from '@/lib/data/teams';
import { X, User, Activity, Zap, Shield, Sword, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScoutingReportData } from '@/lib/data/scouting';
import { ChampionIcon } from '@/components/ui/ChampionIcon';
import { useEffect, useState } from 'react';
import { getLatestVersion } from '@/lib/api/ddragon';

interface PlayerDetailsPanelProps {
    player: Player | null;
    onClose: () => void;
    teamName: string;
    teamColor: string;
    report?: ScoutingReportData | null;
}

export function PlayerDetailsPanel({ player, onClose, teamName, teamColor, report }: PlayerDetailsPanelProps) {
    const [version, setVersion] = useState<string>('14.23.1');

    useEffect(() => {
        getLatestVersion().then(setVersion);
    }, []);

    const playerReport = report?.champion_pools_by_player[player?.nickname || ''];
    const playerTendency = report?.tendencies?.find(t => t.name === player?.nickname);

    return (
        <AnimatePresence>
            {player && (
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
                                style={{ backgroundColor: teamColor }}
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
                                        {teamName}
                                    </span>
                                    <span className="text-primary font-bold tracking-widest text-sm flex items-center gap-1">
                                        <Activity className="w-3 h-3" /> LIVE STATS
                                    </span>
                                </div>
                                <h2 className="text-4xl font-bold text-white uppercase italic tracking-tighter">{player.nickname || player.name}</h2>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">

                            {playerReport ? (
                                <>
                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                                            <div className="text-gray-500 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                                <Activity className="w-4 h-4" /> Win Rate
                                            </div>
                                            <div className="text-2xl font-bold text-white">
                                                {playerReport[0]?.WinRate}% <span className="text-sm text-gray-500 font-normal">avg</span>
                                            </div>
                                        </div>
                                        <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                                            <div className="text-gray-500 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                                <TrendingUp className="w-4 h-4" /> Avg KDA
                                            </div>
                                            <div className="text-2xl font-bold text-white">
                                                {playerReport[0]?.KDA} <span className="text-sm text-gray-500 font-normal">ratio</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Champion Pool */}
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Signature Picks</h3>
                                        <div className="space-y-3">
                                            {playerReport.slice(0, 5).map((champ) => (
                                                <div key={champ.Champion} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                                                    <ChampionIcon name={champ.Champion} version={version} size={40} />
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-bold text-sm text-white">{champ.Champion}</span>
                                                            <span className="text-xs font-bold text-primary">{champ.WinRate}% WR</span>
                                                        </div>
                                                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                                                            {champ.Games} Games played • {champ.KDA} KDA
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Player Insight */}
                                    {playerTendency && (
                                        <div className="p-6 rounded-xl bg-gradient-to-br from-primary/5 to-transparent border border-primary/20 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                                <Activity className="w-24 h-24" />
                                            </div>
                                            <h3 className="text-primary font-bold tracking-widest uppercase mb-2 text-sm">Player Insight</h3>
                                            <p className="text-gray-300 text-sm leading-relaxed">
                                                {playerTendency.tendency}
                                            </p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-4">
                                    <User className="w-12 h-12 opacity-20" />
                                    <p className="text-sm font-medium italic">No performance data available for this player.</p>
                                </div>
                            )}

                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
