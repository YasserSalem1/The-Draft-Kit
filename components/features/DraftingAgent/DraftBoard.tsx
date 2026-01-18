'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayerCard } from '@/components/ui/PlayerCard'; // Import PlayerCard

interface DraftBoardProps {
    blueTeam: {
        name: string;
        bans: (string | null)[];
        picks: (string | null)[];
    };
    redTeam: {
        name: string;
        bans: (string | null)[];
        picks: (string | null)[];
    };
    currentStep: number;
    phase: string;
    ddragonVersion: string;
    recommendations?: string[];
    swapPreview?: {
        side: 'blue' | 'red';
        index: number;
        newChampion: string;
    } | null;
    onPickSwap?: (side: 'blue' | 'red', index: number, champion: string) => void;
    coachMessage?: string;
}

export function DraftBoard({
    blueTeam,
    redTeam,
    currentStep,
    phase,
    ddragonVersion,
    recommendations = [],
    swapPreview,
    onPickSwap,
    coachMessage
}: DraftBoardProps) {
    const [selectedSlot, setSelectedSlot] = React.useState<{ side: 'blue' | 'red', index: number } | null>(null);

    const getChampionId = (name: string) => {
        const specialCases: Record<string, string> = {
            "Lee Sin": "LeeSin", "Miss Fortune": "MissFortune", "Twisted Fate": "TwistedFate",
            "Dr. Mundo": "DrMundo", "Jarvan IV": "JarvanIV", "Rek'Sai": "RekSai",
            "Kha'Zix": "Khazix", "Vel'Koz": "VelKoz", "Cho'Gath": "Chogath",
            "Kog'Maw": "KogMaw", "Kai'Sa": "Kaisa", "Bel'Veth": "Belveth", "K'Sante": "KSante",
            "Wukong": "MonkeyKing"
        };
        return specialCases[name] || name?.replace(/[^a-zA-Z0-9]/g, '') || '';
    };

    const getChampionImage = (name: string | null, type: 'icon' | 'loading' = 'loading') => {
        if (!name) return null;
        const id = getChampionId(name);
        if (type === 'icon') {
            return `https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/champion/${id}.png`;
        }
        return `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${id}_0.jpg`;
    };

    const handleRecommendationClick = (champion: string) => {
        if (selectedSlot && onPickSwap) {
            onPickSwap(selectedSlot.side, selectedSlot.index, champion);
            setSelectedSlot(null); // Deselect after swap
        }
    };

    const renderBanSlot = (champion: string | null, index: number, side: 'blue' | 'red') => (
        <motion.div
            key={`${side}-ban-${index}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`
                relative w-10 h-10 rounded-lg
                ${champion ? 'overflow-hidden' : 'border-2 border-dashed overflow-hidden'}
                ${side === 'blue' ? 'border-blue-500/40' : 'border-red-500/40'}
                bg-black/50
            `}
        >
            {champion && (
                <>
                    <img
                        src={getChampionImage(champion, 'icon') || ''}
                        alt={champion}
                        className="w-full h-full object-cover grayscale brightness-50"
                    />
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 48 48">
                        <line x1="8" y1="8" x2="40" y2="40" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
                        <line x1="40" y1="8" x2="8" y2="40" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                </>
            )}
        </motion.div>
    );

    const renderPickSlot = (champion: string | null, index: number, side: 'blue' | 'red') => {
        // Use Champion Name as the primary display text instead of Player Number
        const displayName = champion || '';

        const player = {
            id: `${side}-player-${index}`,
            name: displayName,
            role: 'fill' as any,
        };

        const pickedChampion = champion ? {
            id: getChampionId(champion),
            name: champion,
            // Add other required Champion props if necessary or mock them
            key: '',
            title: '',
            image: { full: '', sprite: '', group: '', x: 0, y: 0, w: 0, h: 0 },
            tags: [],
            partype: '',
            stats: {} as any
        } : null;

        return (
            <motion.div
                key={`${side}-pick-${index}`}
                className={`w-full flex-1 min-h-0 cursor-pointer transition-all duration-200 ${selectedSlot?.side === side && selectedSlot?.index === index ? 'ring-2 ring-amber-400 scale-[1.02] z-10' : 'hover:bg-white/5'}`}
                onClick={() => setSelectedSlot({ side, index })}
            >
                <div className="h-full py-0.5 pointer-events-none">
                    <PlayerCard
                        player={player}
                        teamColor={side === 'blue' ? 'blue' : 'red'}
                        side={side}
                        pickedChampion={pickedChampion}
                        isActiveTurn={false}
                    />
                </div>
            </motion.div>
        );
    };

    return (
        <div className="flex flex-col items-center w-full h-full overflow-hidden">
            {/* Main Draft Area - Fits Height */}
            <div className="flex-1 w-full grid grid-cols-[540px_1fr_540px] gap-4 items-stretch px-8 py-4 min-h-0">
                {/* Blue Team Picks */}
                <div className="flex flex-col h-full px-0">
                    <div className="flex flex-col gap-2 mb-4 shrink-0">
                        <h2 className="text-blue-400 text-2xl font-black uppercase tracking-wider flex items-center gap-4">
                            {blueTeam.name}
                            <div className="w-2 h-8 bg-blue-500 rounded-full" />
                        </h2>
                        {/* Blue Bans */}
                        <div className="flex items-center gap-2">
                            <span className="text-blue-400/50 text-xs font-bold uppercase tracking-wider">Bans</span>
                            <div className="flex gap-1">
                                {blueTeam.bans.map((ban, i) => renderBanSlot(ban, i, 'blue'))}
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 flex flex-col justify-between min-h-0">
                        {blueTeam.picks.map((pick, i) => renderPickSlot(pick, i, 'blue'))}
                    </div>
                </div>

                {/* Center Column: Recommendations Only */}
                <div className="flex flex-col items-center justify-center gap-6 h-full py-2 min-h-0 relative px-2">

                    {/* Coach Message Bubble */}
                    <AnimatePresence mode="wait">
                        {coachMessage && (
                            <motion.div
                                key={coachMessage}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="w-full max-w-[450px] bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 backdrop-blur-sm shrink-0"
                            >
                                <p className="text-amber-400 text-xs font-medium leading-relaxed text-center">
                                    {coachMessage}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Recommendations List (Wrapped 3-2 Layout) */}
                    <div className="flex-1 flex flex-col items-center justify-center w-full min-h-0">
                        {recommendations.length > 0 && (
                            <div className="flex items-center justify-center gap-2 mb-4 shrink-0">
                                <span className={selectedSlot ? "text-green-400 animate-pulse uppercase tracking-widest text-sm font-bold" : "text-amber-400 uppercase tracking-widest text-sm font-bold"}>
                                    {selectedSlot ? "Click to Swap" : "Suggested"}
                                </span>
                            </div>
                        )}

                        {/* Constrained width to force 3 items then 2 items wrap */}
                        <div className="flex flex-row flex-wrap justify-center items-center gap-4 w-full max-w-[500px]">
                            <AnimatePresence>
                                {recommendations.slice(0, 5).map((champ, idx) => (
                                    <motion.div
                                        key={champ}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className={`
                                            group cursor-pointer flex flex-col items-center
                                            transition-all shrink-0 hover:z-10 hover:scale-105
                                        `}
                                        onClick={() => handleRecommendationClick(champ)}
                                    >
                                        {/* Card Container */}
                                        <div className={`
                                            relative w-[140px] h-[240px] rounded-lg overflow-hidden border-2 shadow-xl bg-black
                                            ${selectedSlot ? 'border-green-500 shadow-[0_0_20px_rgba(74,222,128,0.4)]' : 'border-amber-500/30 hover:border-amber-400/80'}
                                        `}>
                                            {/* Image (Full Vertical) */}
                                            <img
                                                src={`https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${getChampionId(champ)}_0.jpg`}
                                                alt={champ}
                                                className="w-full h-full object-cover"
                                            />

                                            {/* Hover Highlight */}
                                            <div className={`absolute inset-0 border-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity ${selectedSlot ? 'border-green-400' : 'border-amber-400'}`} />
                                        </div>

                                        {/* Name Below Card */}
                                        <div className="mt-2 px-3 py-1 bg-black/60 border border-white/10 rounded-full backdrop-blur-sm">
                                            <span className={`text-xs font-bold uppercase tracking-wider ${selectedSlot ? 'text-green-300' : 'text-amber-100'}`}>
                                                {champ}
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Red Team Picks */}
                <div className="flex flex-col h-full px-0">
                    <div className="flex flex-col gap-2 mb-4 shrink-0 items-end">
                        <h2 className="text-red-400 text-2xl font-black uppercase tracking-wider flex items-center gap-4 flex-row-reverse">
                            {redTeam.name}
                            <div className="w-2 h-8 bg-red-500 rounded-full" />
                        </h2>
                        {/* Red Bans */}
                        <div className="flex items-center gap-2 flex-row-reverse">
                            <span className="text-red-400/50 text-xs font-bold uppercase tracking-wider">Bans</span>
                            <div className="flex gap-1">
                                {redTeam.bans.map((ban, i) => renderBanSlot(ban, i, 'red'))}
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 flex flex-col justify-between min-h-0">
                        {redTeam.picks.map((pick, i) => renderPickSlot(pick, i, 'red'))}
                    </div>
                </div>
            </div>
        </div>
    );
}
