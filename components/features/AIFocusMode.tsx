'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Bot, AlertTriangle, TrendingUp, CheckCircle2, BrainCircuit, RefreshCw } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { getChampionIconUrl, getLatestVersion, getChampions, Champion } from '@/lib/api/ddragon';
import { useDraft } from '@/lib/draft/draft-context';
// import { MOCK_AI_DATA } from '@/lib/data/ai-recommendations'; // Removed MOCK

export interface AIFocusModeProps {
    blueTeam: any;
    redTeam: any;
    blueReport?: any;
    redReport?: any;
    recommendations: any[];
    isLoading: boolean;
    error: string | null;
    isTakeover?: boolean;
    aiActionMessage?: string | null;
}

export function AIFocusMode({
    blueTeam,
    redTeam,
    blueReport,
    redReport,
    recommendations = [],
    isLoading = false,
    error = null,
    isTakeover = false,
    aiActionMessage = null
}: AIFocusModeProps) {
    const [version, setVersion] = useState('');
    const [champions, setChampions] = useState<Champion[]>([]);

    // Get Draft State
    const {
        currentStep, selectChampion, isStarted
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

    // Fetching logic removed - now handled by parent


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

            {/* TAKEOVER MODE DISPLAY */}
            {isTakeover ? (
                <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300 space-y-6">
                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full animate-pulse" />
                        <BrainCircuit className="w-32 h-32 text-blue-400 relative z-10 animate-pulse" />
                    </div>
                    <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter animate-pulse text-center">
                        {aiActionMessage ? aiActionMessage : (isLoading ? "AI Analyze & Execution..." : "AI Taking Over...")}
                    </h2>
                    <p className="text-blue-400 font-bold uppercase tracking-widest text-sm">Autonomous Mode Active</p>
                </div>
            ) : (
                <>
                    {recommendations.length === 0 && !isLoading && !error && !((isStarted && !currentStep)) && (
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
                    ) : isLoading ? (
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
                                            {/* Champ Image & Info - Main Pick (25%) */}
                                            <div className="w-1/4 relative bg-black/20 group-hover:bg-black/40 transition-colors shrink-0 border-r border-white/5">
                                                {getChampImage(rec.championName) && (
                                                    <img
                                                        src={`https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${rec.championName.replace(/[^a-zA-Z0-9]/g, '')}_0.jpg`}
                                                        alt={rec.championName}
                                                        className="absolute inset-0 w-full h-full object-cover object-top opacity-60 group-hover:opacity-100 transition-opacity duration-700"
                                                    />
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent" />
                                                <div className="absolute inset-x-0 bottom-0 p-4">
                                                    <div className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-1 drop-shadow-md">Recommended</div>
                                                    <h4 className="text-xl font-black text-white truncate shadow-black drop-shadow-2xl leading-none uppercase italic tracking-tighter">{rec.championName}</h4>
                                                </div>
                                            </div>

                                            {/* Lookahead / Next Pick Preview - Prominent (75%) */}
                                            <div className="flex-1 p-6 flex flex-col justify-center items-center bg-black/40 relative">
                                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
                                                    <Bot className="w-64 h-64 text-white" />
                                                </div>

                                                <div className="relative z-10 w-full">
                                                    <div className="text-[10px] text-gray-400 uppercase font-black mb-6 tracking-[0.3em] text-center opacity-70">Projected Opponent Response</div>
                                                    <div className="flex items-center justify-center gap-4">
                                                        {rec.opponentResponses && rec.opponentResponses.length > 0 ? (
                                                            rec.opponentResponses.slice(0, 5).map((opResp: any, idx: number) => {
                                                                const opName = typeof opResp === 'string' ? opResp : opResp.championName;
                                                                return (
                                                                    <div
                                                                        key={opName}
                                                                        className="group/op relative"
                                                                        title={opName}
                                                                    >
                                                                        <motion.div
                                                                            initial={{ scale: 0, y: 10 }}
                                                                            animate={{ scale: 1, y: 0 }}
                                                                            transition={{
                                                                                type: "spring",
                                                                                stiffness: 260,
                                                                                damping: 20,
                                                                                delay: 0.1 + (idx * 0.05)
                                                                            }}
                                                                            className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 ring-2 ring-black/50 shadow-2xl group-hover/op:ring-red-500/50 group-hover/op:scale-110 transition-all duration-300"
                                                                        >
                                                                            <img
                                                                                src={getChampImage(opName)}
                                                                                alt={opName}
                                                                                className="w-full h-full object-cover"
                                                                            />
                                                                        </motion.div>
                                                                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover/op:opacity-100 transition-all duration-300 whitespace-nowrap translate-y-2 group-hover/op:translate-y-0 z-50">
                                                                            <span className="text-[10px] font-black text-white uppercase tracking-widest bg-black/95 px-3 py-1 rounded-full border border-white/10 shadow-xl">{opName}</span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })
                                                        ) : (
                                                            <div className="text-gray-600 text-[10px] font-black uppercase tracking-widest italic opacity-50">Simulation Unavailable</div>
                                                        )}
                                                    </div>
                                                </div>
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
                </>
            )}
        </motion.div>
    );
}
