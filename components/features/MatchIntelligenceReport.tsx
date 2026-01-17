'use client';

import { useState, useEffect } from 'react';
import { Champion, getChampions, getLatestVersion, getChampionIconUrl } from '@/lib/api/ddragon';
import { cn } from '@/lib/utils';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface MatchIntelligenceReportProps {
    blueTeam: { name: string; players: any[] };
    redTeam: { name: string; players: any[] };
}

interface StrategyData {
    blue_ban_phase_1: string[];
    red_ban_phase_1: string[];
    blue_pick_phase_1: string[];
    red_pick_phase_1: string[];
    blue_ban_phase_2: string[];
    red_ban_phase_2: string[];
    blue_pick_phase_2: string[];
    red_pick_phase_2: string[];
}

export function MatchIntelligenceReport({ blueTeam, redTeam }: MatchIntelligenceReportProps) {
    const [strategy, setStrategy] = useState<StrategyData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [champions, setChampions] = useState<Record<string, Champion>>({});
    const [version, setVersion] = useState<string>('');

    useEffect(() => {
        async function loadResources() {
            const [v, champs] = await Promise.all([getLatestVersion(), getChampions()]);
            setVersion(v);
            const champMap: Record<string, Champion> = {};
            champs.forEach(c => champMap[c.name] = c); // Map by name for easier lookup
            // Also map by ID or key if needed, but names seem consistent in this project
            champs.forEach(c => champMap[c.id] = c);
            setChampions(champMap);
        }
        loadResources();
    }, []);

    const fetchStrategy = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('http://localhost:5001/strategy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ blueTeam, redTeam }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setStrategy(data);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to load strategy');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (blueTeam && redTeam) {
            fetchStrategy();
        }
    }, [blueTeam.name, redTeam.name]);

    if (loading && !strategy) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-gray-400 gap-4">
                <Loader2 className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-xs uppercase tracking-widest font-bold">Summoning Draft Intelligence...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-red-400 gap-4 border border-red-500/20 rounded-xl bg-red-500/5">
                <AlertTriangle className="w-8 h-8" />
                <p className="text-xs uppercase tracking-widest font-bold">Strategy Analysis Failed</p>
                <p className="text-xs font-mono opacity-70">{error}</p>
                <button onClick={fetchStrategy} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 rounded text-xs uppercase font-bold tracking-widest transition-colors mt-2">
                    <RefreshCw className="w-3 h-3" /> Retry
                </button>
            </div>
        );
    }

    if (!strategy) return null;

    return (
        <div className="space-y-12">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold uppercase tracking-tighter bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">Match Intelligence</h2>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
                {/* BLUE TEAM COLUMN */}
                <div className="space-y-8">
                    <TeamHeader name={blueTeam.shortName || blueTeam.name} side="blue" />

                    <PhaseSection
                        title="Phase 1 Bans"
                        champs={strategy.blue_ban_phase_1}
                        side="blue"
                        type="ban"
                        allChamps={champions}
                        version={version}
                    />
                    <PhaseSection
                        title="Phase 1 Picks"
                        champs={strategy.blue_pick_phase_1}
                        side="blue"
                        type="pick"
                        allChamps={champions}
                        version={version}
                    />
                    <PhaseSection
                        title="Phase 2 Bans"
                        champs={strategy.blue_ban_phase_2}
                        side="blue"
                        type="ban"
                        allChamps={champions}
                        version={version}
                    />
                    <PhaseSection
                        title="Phase 2 Picks"
                        champs={strategy.blue_pick_phase_2}
                        side="blue"
                        type="pick"
                        allChamps={champions}
                        version={version}
                    />
                </div>

                {/* RED TEAM COLUMN */}
                <div className="space-y-8">
                    <TeamHeader name={redTeam.shortName || redTeam.name} side="red" />

                    <PhaseSection
                        title="Phase 1 Bans"
                        champs={strategy.red_ban_phase_1}
                        side="red"
                        type="ban"
                        allChamps={champions}
                        version={version}
                    />
                    <PhaseSection
                        title="Phase 1 Picks"
                        champs={strategy.red_pick_phase_1}
                        side="red"
                        type="pick"
                        allChamps={champions}
                        version={version}
                    />
                    <PhaseSection
                        title="Phase 2 Bans"
                        champs={strategy.red_ban_phase_2}
                        side="red"
                        type="ban"
                        allChamps={champions}
                        version={version}
                    />
                    <PhaseSection
                        title="Phase 2 Picks"
                        champs={strategy.red_pick_phase_2}
                        side="red"
                        type="pick"
                        allChamps={champions}
                        version={version}
                    />
                </div>
            </div>
        </div>
    );
}

function TeamHeader({ name, side }: { name: string, side: 'blue' | 'red' }) {
    const isBlue = side === 'blue';
    return (
        <div className={cn(
            "flex items-center gap-4 pb-4 border-b",
            isBlue ? "border-primary/20 flex-row" : "border-red-500/20 flex-row-reverse text-right"
        )}>
            <div className={cn(
                "px-3 py-1 rounded text-xs font-bold uppercase tracking-widest",
                isBlue ? "bg-primary text-white" : "bg-red-600 text-white"
            )}>
                {side} Team
            </div>
            <h3 className={cn(
                "text-2xl font-black uppercase tracking-tight",
                isBlue ? "text-primary" : "text-red-500"
            )}>
                {name}
            </h3>
        </div>
    )
}

function PhaseSection({
    title,
    champs,
    side,
    type,
    allChamps,
    version
}: {
    title: string,
    champs: string[],
    side: 'blue' | 'red',
    type: 'pick' | 'ban',
    allChamps: Record<string, Champion>,
    version: string
}) {
    if (!champs || champs.length === 0) return null;

    // Limit to 5
    const displayChamps = champs.slice(0, 5);
    const isBlue = side === 'blue';
    const isBan = type === 'ban';

    return (
        <div className={cn("space-y-3", !isBlue && "text-right")}>
            <div className={cn(
                "text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2",
                !isBlue && "justify-end flex-row-reverse",
                isBan ? "text-gray-500" : (isBlue ? "text-primary/80" : "text-red-400")
            )}>
                {title}
            </div>

            <div className={cn(
                "flex flex-wrap gap-3",
                !isBlue && "justify-end"
            )}>
                {displayChamps.map((name, i) => {
                    // Try exact name or key
                    const champ = allChamps[name] || Object.values(allChamps).find(c => c.name.toLowerCase() === name.toLowerCase());

                    return (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className="group relative"
                        >
                            <div className={cn(
                                "w-12 h-12 rounded-lg overflow-hidden border transition-all duration-300 relative",
                                isBan ? "grayscale opacity-60 hover:grayscale-0 hover:opacity-100" : "",
                                isBlue
                                    ? "border-primary/30 hover:border-primary hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                                    : "border-red-500/30 hover:border-red-500 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                            )}>
                                {champ ? (
                                    <img
                                        src={getChampionIconUrl(version, champ.image.full)}
                                        alt={name}
                                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gray-800 flex items-center justify-center text-[8px] font-bold uppercase text-gray-500">
                                        {name.substring(0, 3)}
                                    </div>
                                )}

                                {isBan && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="w-[120%] h-[2px] bg-red-600/50 -rotate-45 transform" />
                                    </div>
                                )}
                            </div>
                            <div className={cn(
                                "absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase tracking-wider text-gray-400 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity",
                                isBan && "text-red-400"
                            )}>
                                {name}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    )
}
