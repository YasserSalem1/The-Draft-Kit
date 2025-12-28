'use client';

import { SCOUTING_DATA } from '@/lib/data/scouting';
import { TEAMS } from '@/lib/data/teams';
import { cn } from '@/lib/utils';
import { Target, TrendingUp, AlertTriangle, Ban } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Champion, getChampions, getLatestVersion, getChampionIconUrl } from '@/lib/api/ddragon';

interface ScoutingStatsProps {
    blueTeam: typeof TEAMS[0];
    redTeam: typeof TEAMS[0];
}

export function ScoutingStats({ blueTeam, redTeam }: ScoutingStatsProps) {
    const blueReport = SCOUTING_DATA.t1;
    const redReport = SCOUTING_DATA.geng;

    const [champions, setChampions] = useState<Record<string, Champion>>({});
    const [version, setVersion] = useState<string>('');

    useEffect(() => {
        async function loadData() {
            const [v, champs] = await Promise.all([getLatestVersion(), getChampions()]);
            setVersion(v);
            const champMap: Record<string, Champion> = {};
            champs.forEach(c => champMap[c.name] = c);
            setChampions(champMap);
        }
        loadData();
    }, []);

    return (
        <div className="h-full flex flex-col gap-8 p-6 overflow-y-auto w-full max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-center uppercase tracking-widest text-primary/80">Match Intelligence</h2>

            <div className="grid grid-cols-2 gap-12">
                {/* BLUE TEAM */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4 pb-4 border-b border-white/5">
                        <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center font-bold text-white text-lg">{blueTeam.shortName}</div>
                        <div>
                            <h3 className="text-xl font-bold text-primary uppercase">{blueTeam.name}</h3>
                            <div className="text-xs text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2 mt-1">
                                <Target className="w-3 h-3" /> {blueReport.overview}
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <TeamStats report={blueReport} color="blue" champions={champions} version={version} />
                </div>

                {/* RED TEAM */}
                <div className="space-y-6">
                    <div className="flex items-center justify-end gap-4 pb-4 border-b border-white/5 text-right">
                        <div>
                            <h3 className="text-xl font-bold text-red-500 uppercase">{redTeam.name}</h3>
                            <div className="text-xs text-gray-400 font-bold uppercase tracking-widest flex items-center justify-end gap-2 mt-1">
                                {redReport.overview} <Target className="w-3 h-3" />
                            </div>
                        </div>
                        <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center font-bold text-white text-lg">{redTeam.shortName}</div>
                    </div>

                    {/* Stats */}
                    <TeamStats report={redReport} color="red" champions={champions} version={version} />
                </div>
            </div>
        </div>
    );
}

function TeamStats({ report, color, champions, version }: { report: typeof SCOUTING_DATA.t1, color: 'blue' | 'red', champions: Record<string, Champion>, version: string }) {
    const isBlue = color === 'blue';
    const textColor = isBlue ? "text-primary" : "text-red-500";
    const borderColor = isBlue ? "border-primary" : "border-red-500";

    return (
        <div className="space-y-8">
            {/* PICKS */}
            <div className="space-y-4">
                <div className={cn("text-xs font-bold uppercase tracking-widest flex items-center gap-2", textColor)}>
                    <TrendingUp className="w-4 h-4" /> Potential Picks
                </div>
                <div className="flex flex-wrap gap-4">
                    {report.famousPicks?.map((pick, i) => {
                        const champion = champions[pick.name];
                        if (!champion) return null;
                        return (
                            <div key={i} className="flex flex-col items-center gap-2 group">
                                <div className={cn("relative w-16 h-16 rounded-2xl overflow-hidden border-2 transition-all shadow-lg", borderColor, "group-hover:scale-110 group-hover:shadow-primary/50")}>
                                    <img
                                        src={getChampionIconUrl(version, champion.image.full)}
                                        alt={pick.name}
                                        className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-110"
                                    />
                                    {/* Subtle gradient for contrast if needed, but keeping it clean for now */}
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{pick.name}</span>
                                    <span className={cn("text-sm font-black tabular-nums leading-none", textColor)}>{pick.rate}%</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* BANS */}
            <div className="space-y-4">
                <div className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-gray-400">
                    <Ban className="w-4 h-4" /> Likely Bans
                </div>
                <div className="flex flex-wrap gap-4">
                    {report.popularBans?.map((ban, i) => {
                        const champion = champions[ban.name];
                        if (!champion) return null;
                        return (
                            <div key={i} className="flex flex-col items-center gap-2 group">
                                <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-red-900/50 grayscale group-hover:grayscale-0 transition-all opacity-70 group-hover:opacity-100">
                                    <img
                                        src={getChampionIconUrl(version, champion.image.full)}
                                        alt={ban.name}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-transparent transition-colors">
                                        <Ban className="w-6 h-6 text-red-500/60" />
                                    </div>
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{ban.name}</span>
                                    <span className="text-sm font-bold text-red-500 tabular-nums leading-none">{ban.rate}%</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    )
}
