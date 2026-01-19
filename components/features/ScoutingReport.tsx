'use client';

import { motion } from 'framer-motion';
import { SCOUTING_DATA } from '@/lib/data/scouting';
import { TEAMS } from '@/lib/data/teams';
import { cn } from '@/lib/utils';
import { Target, TrendingUp, Users, AlertTriangle, Play } from 'lucide-react';

interface ScoutingReportProps {
    blueTeam: typeof TEAMS[0];
    redTeam: typeof TEAMS[0];
    onInitializeDraft: () => void;
}

export function ScoutingReport({ blueTeam, redTeam, onInitializeDraft }: ScoutingReportProps) {
    // Mock data mapping - in a real app this would be more dynamic
    const blueReport = SCOUTING_DATA.t1; // Mock mapping
    const redReport = SCOUTING_DATA.geng; // Mock mapping

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute inset-0 z-50 bg-[#0C0E14] overflow-y-auto"
        >
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-bold tracking-widest uppercase text-gray-400">
                        Match Scouting Report
                    </h1>
                    <button
                        onClick={onInitializeDraft}
                        className="px-8 py-3 bg-primary hover:bg-primary/80 text-white font-bold rounded-full uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] hover:scale-105 flex items-center gap-2"
                    >
                        <Play className="w-5 h-5 fill-current" /> Initialize Draft
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Blue Team Report */}
                    <TeamReportCard team={blueTeam} report={blueReport} side="blue" />

                    {/* Red Team Report */}
                    <TeamReportCard team={redTeam} report={redReport} side="red" />
                </div>
            </div>
        </motion.div>
    );
}

function TeamReportCard({ team, report, side }: { team: typeof TEAMS[0], report: typeof SCOUTING_DATA.t1, side: 'blue' | 'red' }) {
    const isBlue = side === 'blue';
    const accentColor = isBlue ? 'text-primary' : 'text-red-500';
    const borderColor = isBlue ? 'border-primary/20' : 'border-red-500/20';
    const bgGradient = isBlue ? 'from-primary/5' : 'from-red-500/5';

    return (
        <div className={cn("glass-panel rounded-2xl p-6 border space-y-6 relative overflow-hidden", borderColor)}>
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                <div
                    className={cn("w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold shadow-lg", isBlue ? "bg-primary text-white" : "bg-red-600 text-white")}
                >
                    {team.shortName}
                </div>
                <div>
                    <h2 className="text-3xl font-bold text-white uppercase">{team.name}</h2>
                    <p className="text-gray-400 text-sm">{report.overview}</p>
                </div>
            </div>

            {/* Strategies */}
            <div className="space-y-3">
                <div className={cn("text-xs font-bold uppercase tracking-widest flex items-center gap-2", accentColor)}>
                    <Target className="w-4 h-4" /> Strategic Tendencies
                </div>
                <div className="grid grid-cols-1 gap-2">
                    {report.strategies.map((strat, i) => (
                        <div key={i} className="bg-white/5 rounded px-3 py-2 text-gray-300 text-sm flex items-center gap-2">
                            <span className={cn("w-1 h-1 rounded-full", isBlue ? "bg-primary" : "bg-red-500")} />
                            {strat}
                        </div>
                    ))}
                </div>
            </div>

            {/* Player Tendencies */}
            <div className="space-y-3">
                <div className={cn("text-xs font-bold uppercase tracking-widest flex items-center gap-2", accentColor)}>
                    <Users className="w-4 h-4" /> Player Insights
                </div>
                <div className="grid grid-cols-1 gap-2">
                    {report.tendencies.map((player, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                            <div className="flex items-center gap-3">
                                <span className="text-white font-bold">{player.name}</span>
                            </div>
                            <span className="text-xs text-gray-400 italic">{player.tendency}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Famous Picks & Bans */}
            <div className="grid grid-cols-2 gap-8 pt-4 border-t border-white/5">
                <div className="space-y-4">
                    <div className={cn("text-xs font-bold uppercase tracking-widest flex items-center gap-2", accentColor)}>
                        <TrendingUp className="w-4 h-4" /> Potential Picks
                    </div>
                    <div className="space-y-3">
                        {report.famousPicks?.map((pick, i) => (
                            <div key={i} className="space-y-1">
                                <div className="flex justify-between text-xs font-bold">
                                    <span className="text-gray-200">{pick.name}</span>
                                    <span className={isBlue ? "text-primary" : "text-red-400"}>{pick.rate}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        style={{ width: `${pick.rate}%` }}
                                        className={cn("h-full rounded-full", isBlue ? "bg-primary" : "bg-red-500")}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className={cn("text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-gray-500")}>
                        <AlertTriangle className="w-4 h-4" /> Likely Bans
                    </div>
                    <div className="space-y-3">
                        {report.popularBans?.map((ban, i) => (
                            <div key={i} className="space-y-1">
                                <div className="flex justify-between text-xs font-bold">
                                    <span className="text-gray-400">{ban.name}</span>
                                    <span className="text-gray-500">{ban.rate}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        style={{ width: `${ban.rate}%` }}
                                        className="h-full rounded-full bg-gray-600"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Actionable Insight */}
            <div className={cn("mt-6 p-4 rounded-xl border relative overflow-hidden", borderColor)}>
                <div className={cn("absolute inset-0 bg-gradient-to-br opacity-20", bgGradient, "to-transparent")} />
                <div className="relative z-10">
                    <div className={cn("text-xs font-bold uppercase tracking-widest flex items-center gap-2 mb-2", accentColor)}>
                        <AlertTriangle className="w-4 h-4" /> Coach&apos;s Key to Victory
                    </div>
                    <p className="text-white text-lg font-medium leading-relaxed">
                        &quot;{report.insight}&quot;
                    </p>
                </div>
            </div>
        </div>
    )
}
