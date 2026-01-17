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
        currentStep, currentStepIndex, selectChampion, isStarted
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
        // Don't fetch if draft is complete
        if (!currentStep) return;

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
                    name: blueTeam.shortName || blueTeam.name,
                    players: blueTeam.players
                },
                redTeam: {
                    name: redTeam.shortName || redTeam.name,
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
            className="absolute inset-0 z-20 bg-black/80 backdrop-blur-md flex flex-col p-6 h-full"
        >


            {/* Error Message */}
            {error && (
                <div className="mb-8 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5" />
                    {error}
                </div>
            )}



            {recommendations.length === 0 && !loading && !error && !((isStarted && !currentStep)) && (
                <div className="text-center text-gray-500 py-10">
                    No recommendations available for this step.
                </div>
            )}

            {/* Drafted State */}
            {/* Drafted State or Loading or List */}
            {(isStarted && !currentStep) ? (
                <div className="flex-1 flex flex-col items-center justify-start pt-32 animate-in fade-in zoom-in duration-500 space-y-4">
                    <h2 className="text-5xl font-black text-white uppercase italic tracking-tighter glow-text text-center">
                        Drafted
                    </h2>
                    <div className="text-center text-gray-500">
                        No recommendations available for this step.
                    </div>
                </div>
            ) : loading ? (
                <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300 space-y-6">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                        <BrainCircuit className="w-20 h-20 text-primary relative z-10 animate-pulse" />
                    </div>
                    <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter animate-pulse text-center">
                        Generating Recommendation...
                    </h2>
                </div>
            ) : (
                <div className="flex flex-col h-full">
                    {/* New Header */}
                    <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter glow-text text-center mb-4 shrink-0">
                        <span className="text-primary">Intelligence</span> Recommendation
                    </h2>

                    {/* Recommendations List */}
                    {recommendations.length > 0 ? (
                        <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col gap-2 min-h-0 pb-2">
                            {recommendations.map((rec, i) => (
                                <motion.div
                                    key={rec.championName}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 * i }}
                                    className="bg-white/5 border border-white/10 rounded-lg overflow-hidden hover:border-primary/50 transition-all duration-300 group relative cursor-pointer hover:bg-white/10 active:scale-[0.99] flex items-stretch flex-1 min-h-[60px]" // Reduced border radius and added min-height constraint
                                    onClick={() => handleRecommendationClick(rec)}
                                >
                                    {/* Champ Image & Info - Larger Loading Art */}
                                    <div className="w-48 relative border-r border-white/5 bg-black/20 group-hover:bg-black/40 transition-colors shrink-0">
                                        {getChampImage(rec.championName) && (
                                            <img
                                                src={`https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${rec.championName.replace(/[^a-zA-Z0-9]/g, '')}_0.jpg`}
                                                alt={rec.championName}
                                                className="absolute inset-0 w-full h-full object-cover object-top opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                                            />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                                        <div className="absolute inset-x-0 bottom-0 p-3">
                                            <h4 className="text-xl font-black text-white truncate shadow-black drop-shadow-lg leading-none uppercase italic tracking-tighter">{rec.championName}</h4>
                                        </div>
                                    </div>

                                    {/* Reasoning Content - Cleaner & Smaller */}
                                    <div className="flex-1 p-3 flex flex-col justify-between overflow-hidden">
                                        <p className="text-xs text-gray-300 leading-snug font-light line-clamp-3 mb-2">
                                            {Array.isArray(rec.reasoning) && rec.reasoning.length > 0
                                                ? rec.reasoning.join('. ')
                                                : "Top strategic fit for current draft state."}
                                        </p>

                                        {/* Lookahead / Next Pick Preview */}
                                        {rec.opponentResponses && rec.opponentResponses.length > 0 && (
                                            <div className="mt-auto pt-2 border-t border-white/5">
                                                <div className="text-[10px] text-gray-500 uppercase font-bold mb-1 tracking-wider">Potential Response</div>
                                                <div className="flex items-center gap-1">
                                                    {rec.opponentResponses.slice(0, 5).map((opName: string) => (
                                                        <div key={opName} className="w-6 h-6 rounded-full overflow-hidden border border-white/10 ring-1 ring-black/50" title={opName}>
                                                            <img
                                                                src={getChampImage(opName)}
                                                                alt={opName}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 py-10">
                            No recommendations available.
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    );
}
