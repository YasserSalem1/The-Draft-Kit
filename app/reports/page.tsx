'use client';

import { useState } from 'react';
import { TEAMS, Team } from '@/lib/data/teams';
import { SCOUTING_DATA, ScoutingReportData } from '@/lib/data/scouting';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Download, FileText, ChevronRight, TrendingUp, Target, Shield, Zap, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ReportsPage() {
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [reportData, setReportData] = useState<ScoutingReportData | null>(null);

    const handleSelectTeam = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const teamId = e.target.value;
        const team = TEAMS.find(t => t.id === teamId);
        setSelectedTeam(team || null);

        // Mock fetching scouting data - in real app this would be an API call
        if (team) {
            // For demo, we just use 't1' data if key matches, else default to 't1' or 'geng' for variety if avail
            // or just hardcode checking if data exists in SCOUTING_DATA
            const key = team.id as keyof typeof SCOUTING_DATA;
            setReportData(SCOUTING_DATA[key] || SCOUTING_DATA['t1']); // Fallback to T1 data for demo
        } else {
            setReportData(null);
        }
    };

    return (
        <main className="min-h-screen bg-background text-foreground flex flex-col p-6 md:p-12 relative overflow-hidden">

            {/* Back to Hub */}
            <Link href="/" className="absolute top-8 left-8 text-gray-500 hover:text-white flex items-center gap-2 transition-colors z-20">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Back to Hub</span>
            </Link>

            <div className="max-w-7xl w-full mx-auto relative z-10 space-y-12">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-end justify-between gap-6 border-b border-white/5 pb-8">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2">
                            <span className="text-primary">Team</span> Intelligence
                        </h1>
                        <p className="text-gray-400 max-w-xl">
                            Generate deep-dive analytical reports on team performance, draft tendencies, and strategic priorities.
                        </p>
                    </div>

                    {/* Team Selector */}
                    <div className="w-full md:w-auto relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 group-hover:text-primary transition-colors" />
                        <select
                            onChange={handleSelectTeam}
                            value={selectedTeam?.id || ''}
                            className="w-full md:w-80 bg-surface-light border border-white/10 rounded-xl py-3 pl-10 pr-4 appearance-none outline-none focus:border-primary/50 transition-all font-bold text-gray-200 cursor-pointer hover:bg-white/5"
                        >
                            <option value="">Select Team for Analysis...</option>
                            {TEAMS.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Content Area */}
                <AnimatePresence mode="wait">
                    {!selectedTeam ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-24 text-gray-600 space-y-4 border border-dashed border-white/5 rounded-3xl"
                        >
                            <Target className="w-16 h-16 opacity-20" />
                            <p className="text-lg font-medium">Select a team above to generate report</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={selectedTeam.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="space-y-8"
                        >
                            {/* Report Header Card */}
                            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-surface-light/30 p-8">
                                <div className="absolute top-0 right-0 p-32 bg-primary/10 rounded-full blur-3xl" />

                                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                                    <div className="flex items-center gap-6">
                                        <div className="w-24 h-24 rounded-2xl bg-surface flex items-center justify-center border border-white/10 shadow-lg">
                                            <span className="text-3xl font-bold">{selectedTeam.shortName}</span>
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-bold text-white mb-2">{selectedTeam.name}</h2>
                                            <div className="flex items-center gap-2">
                                                <span className="px-3 py-1 bg-primary/20 text-primary text-xs font-bold uppercase tracking-widest rounded border border-primary/20">LCK</span>
                                                <span className="px-3 py-1 bg-green-500/10 text-green-400 text-xs font-bold uppercase tracking-widest rounded border border-green-500/10">Active</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-colors border border-white/5">
                                            <FileText className="w-4 h-4" /> Save Report
                                        </button>
                                        <button className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-colors shadow-lg shadow-primary/25">
                                            <Download className="w-4 h-4" /> Download PDF
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                                {/* Win Rate Card */}
                                <div className="esport-card p-6 flex flex-col justify-between h-full bg-surface-light/20">
                                    <div>
                                        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4 text-green-400" /> Win Rates
                                        </h3>
                                        <div className="flex items-end justify-between mb-2">
                                            <span className="text-5xl font-black text-white">68%</span>
                                            <span className="text-green-400 font-bold mb-1">+4.2%</span>
                                        </div>
                                        <div className="w-full bg-surface-light h-2 rounded-full overflow-hidden mb-6">
                                            <div className="bg-green-500 h-full w-[68%]" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                                        <div>
                                            <div className="text-xs text-gray-500 uppercase font-bold">Blue Side</div>
                                            <div className="text-xl font-bold text-primary">72%</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500 uppercase font-bold">Red Side</div>
                                            <div className="text-xl font-bold text-red-400">54%</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Overview / Strategy */}
                                <div className="esport-card p-6 md:col-span-2 bg-surface-light/20">
                                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-purple-400" /> Strategic Identity
                                    </h3>
                                    <div className="space-y-6">
                                        <div>
                                            <h4 className="text-white font-bold mb-2">Overview</h4>
                                            <p className="text-gray-400 leading-relaxed text-sm">
                                                {reportData?.overview || "No data available."}
                                            </p>
                                        </div>

                                        <div>
                                            <h4 className="text-white font-bold mb-3">Key Priorities</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {reportData?.strategies?.map((strat, i) => (
                                                    <span key={i} className="px-3 py-1.5 bg-surface border border-white/10 rounded-lg text-xs text-gray-300">
                                                        {strat}
                                                    </span>
                                                )) || <span className="text-gray-500 text-sm">No strategies recorded.</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Report Sections Row */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                                {/* Player Tendencies */}
                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                        <Zap className="w-5 h-5 text-yellow-400" /> Player Tendencies
                                    </h3>
                                    <div className="space-y-3">
                                        {reportData?.tendencies?.map((item, i) => (
                                            <div key={i} className="flex items-center gap-4 p-4 bg-surface-light/30 border border-white/5 rounded-xl hover:border-white/10 transition-colors">
                                                <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center font-bold text-gray-500 text-xs border border-white/5">
                                                    {item.role[0]}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between mb-1">
                                                        <span className="font-bold text-white">{item.name}</span>
                                                        <span className="text-xs text-gray-500 font-bold uppercase">{item.role}</span>
                                                    </div>
                                                    <div className="text-sm text-gray-400">{item.tendency}</div>
                                                </div>
                                            </div>
                                        )) || <div className="text-gray-500">No player data.</div>}
                                    </div>
                                </div>

                                {/* Draft Preferences & Bans */}
                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                        <Target className="w-5 h-5 text-red-400" /> Priority Picks & Bans
                                    </h3>

                                    <div className="p-6 bg-surface-light/30 border border-white/5 rounded-xl">
                                        <h4 className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-4">Highest Priority Picks</h4>
                                        <div className="space-y-3">
                                            {reportData?.famousPicks?.map((pick, i) => (
                                                <div key={i} className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded bg-gray-800" /> {/* Avatar Placeholder */}
                                                        <span className="font-medium text-gray-200">{pick.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3 w-32">
                                                        <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                                            <div className="h-full bg-primary" style={{ width: `${pick.rate}%` }} />
                                                        </div>
                                                        <span className="text-xs font-mono text-gray-400 w-8">{pick.rate}%</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="p-6 bg-surface-light/30 border border-white/5 rounded-xl">
                                        <h4 className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-4">Common Bans Against</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {reportData?.popularBans?.map((ban, i) => (
                                                <div key={i} className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                                                    <span className="text-red-300 font-medium text-sm">{ban.name}</span>
                                                    <span className="text-red-500/50 text-xs font-mono">{ban.rate}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                            </div>

                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Decorative */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
        </main>
    );
}
