'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Bot, AlertTriangle, TrendingUp, CheckCircle2, BrainCircuit, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getChampionIconUrl, getLatestVersion, getChampions, Champion } from '@/lib/api/ddragon';
import { useDraft } from '@/lib/draft/draft-context';
// import { MOCK_AI_DATA } from '@/lib/data/ai-recommendations'; // Removed MOCK

export interface AIFocusModeProps {
    blueTeam: any; // Type 'Team' from '@/lib/data/teams' ideally, but 'any' avoids circular dep issues if simplistic
    redTeam: any;
}

export function AIFocusMode({ blueTeam, redTeam }: AIFocusModeProps) {
    const [version, setVersion] = useState('');
    const [champions, setChampions] = useState<Champion[]>([]);
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Get Draft State
    const {
        blueBans, redBans, bluePicks, redPicks,
        currentStep, currentStepIndex, selectChampion
    } = useDraft();

    useEffect(() => {
        async function init() {
            const v = await getLatestVersion();
            const data = await getChampions();
            setVersion(v);
            setChampions(data);
        }
        init();
    }, []);

    // Fetch Predictions from Python Server
    const fetchPredictions = async () => {
        setLoading(true);
        setError(null);
        try {
            // Construct payload with REAL team info
            const payload = {
                currentStepIndex,
                blueBans,
                redBans,
                bluePicks,
                redPicks,
                blueTeam: {
                    name: blueTeam.name,
                    players: blueTeam.players
                },
                redTeam: {
                    name: redTeam.name,
                    players: redTeam.players
                }
            };

            const res = await fetch('http://localhost:5001/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("AI Server Error");

            const data = await res.json();
            setRecommendations(data.recommendations || []);
        } catch (err) {
            console.error(err);
            setError("Failed to connect to AI Server. Is 'python AI/server.py' running?");
        } finally {
            setLoading(false);
        }
    };

    // Auto-fetch on mount or step change
    useEffect(() => {
        fetchPredictions();
    }, [currentStepIndex]); // Re-fetch when draft advances

    const getChampImage = (name: string) => {
        const champ = champions.find(c => c.name === name);
        if (!champ) return '';
        return getChampionIconUrl(version, champ.image.full);
    };

    const handleRecommendationClick = (rec: any) => {
        const champ = champions.find(c => c.name === rec.championName);
        if (champ) {
            selectChampion(champ);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 z-20 bg-black/80 backdrop-blur-md flex flex-col p-6 overflow-y-auto custom-scrollbar"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-8 border-b border-primary/20 pb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                        <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-widest uppercase">AI Draft Assistant</h2>
                        <p className="text-primary text-xs font-bold uppercase tracking-[0.2em] animate-pulse">
                            {loading ? "Thinking..." : "Live Recommendations"}
                        </p>
                    </div>
                </div>

                {/* Winrate Impact */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={fetchPredictions}
                        disabled={loading}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={cn("w-5 h-5 text-gray-400", loading && "animate-spin")} />
                    </button>

                    <div className="flex items-center gap-6 bg-black/40 px-6 py-3 rounded-xl border border-white/10">
                        <div className="text-right">
                            <div className="text-xs text-primary font-bold uppercase">Confidence</div>
                            <div className="text-2xl font-bold text-primary flex items-center gap-1">
                                <TrendingUp className="w-5 h-5" />
                                {recommendations[0]?.winRate || 0}%
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-8 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5" />
                    {error}
                </div>
            )}

            {/* Recommendations Grid */}
            <h3 className="text-gray-400 font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                Strategic Recommendations
            </h3>

            {recommendations.length === 0 && !loading && !error && (
                <div className="text-center text-gray-500 py-10">
                    No recommendations available for this step.
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {recommendations.map((rec, i) => (
                    <motion.div
                        key={rec.championName}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * i }}
                        className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-primary/50 transition-colors group relative cursor-pointer hover:bg-white/10 active:scale-95"
                        onClick={() => handleRecommendationClick(rec)}
                    >
                        {/* Rank Badge */}
                        <div className="absolute top-0 right-0 bg-white/10 px-3 py-1 rounded-bl-xl text-xs font-bold text-white z-10 backdrop-blur-sm">
                            #{i + 1}
                        </div>

                        <div className="p-4 flex flex-col gap-4 h-full">
                            {/* Champ Header */}
                            <div className="flex items-center gap-3">
                                <div className="w-14 h-14 rounded-lg bg-black overflow-hidden border border-white/20 group-hover:border-primary transition-colors relative">
                                    {getChampImage(rec.championName) && (
                                        <img
                                            src={getChampImage(rec.championName)}
                                            alt={rec.championName}
                                            className="w-full h-full object-cover"
                                        />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-lg font-bold text-white truncate">{rec.championName}</h4>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">{rec.role}</p>
                                </div>
                            </div>

                            {/* Reasoning */}
                            <div className="flex-1 bg-black/20 rounded-lg p-3 space-y-2">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                    <BrainCircuit className="w-3 h-3" /> AI Analysis
                                </div>
                                <ul className="space-y-1">
                                    {rec.reasoning.map((r: string, idx: number) => (
                                        <li key={idx} className="text-[10px] text-gray-300 flex items-start gap-1.5 leading-snug">
                                            <span className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                                            {r}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}
