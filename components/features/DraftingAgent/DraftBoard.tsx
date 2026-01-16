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
}

export function DraftBoard({
    blueTeam,
    redTeam,
    currentStep,
    phase,
    ddragonVersion,
    recommendations = [],
    swapPreview,
    onPickSwap
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
            {/* Bans Section - Compact */}
            <div className="flex items-center justify-between w-full px-4 py-2 bg-black/20 border-y border-white/5 backdrop-blur-md shrink-0 z-20">
                <div className="flex items-center gap-4">
                    <span className="text-blue-400/50 text-xs font-bold uppercase tracking-wider">Blue Bans</span>
                    <div className="flex gap-1">
                        {blueTeam.bans.map((ban, i) => renderBanSlot(ban, i, 'blue'))}
                    </div>
                </div>

                <div className="flex items-center gap-4 flex-row-reverse">
                    <span className="text-red-400/50 text-xs font-bold uppercase tracking-wider">Red Bans</span>
                    <div className="flex gap-1">
                        {redTeam.bans.map((ban, i) => renderBanSlot(ban, i, 'red'))}
                    </div>
                </div>
            </div>

            {/* Main Draft Area - Fits Height */}
            <div className="flex-1 w-full grid grid-cols-[1fr_500px_1fr] gap-4 items-stretch px-4 py-2 min-h-0">
                {/* Blue Team Picks */}
                <div className="flex flex-col h-full px-8">
                    <h2 className="text-blue-400 text-2xl font-black uppercase tracking-wider mb-2 flex items-center gap-4 shrink-0">
                        {blueTeam.name}
                        <div className="w-2 h-8 bg-blue-500 rounded-full" />
                    </h2>
                    <div className="flex-1 flex flex-col justify-between min-h-0">
                        {blueTeam.picks.map((pick, i) => renderPickSlot(pick, i, 'blue'))}
                    </div>
                </div>

                {/* Center Column: Recommendations & Status */}
                <div className="h-full flex flex-col items-center justify-center gap-4 relative py-2 min-h-0">

                    {/* Recommendations List (Horizontal Icons in Center) */}
                    <div className="flex-1 flex flex-col items-center justify-center gap-2 min-h-0 overflow-hidden w-full">
                        {recommendations.length > 0 && (
                            <div className="flex items-center justify-center gap-2 mb-1 shrink-0">
                                <span className={selectedSlot ? "text-green-400 animate-pulse uppercase tracking-widest text-xs font-bold" : "text-amber-400 uppercase tracking-widest text-xs font-bold"}>
                                    {selectedSlot ? "Click to Swap" : "Suggested"}
                                </span>
                            </div>
                        )}

                        <div className="flex flex-wrap justify-center gap-3 overflow-y-auto w-full px-4">
                            <AnimatePresence>
                                {recommendations.slice(0, 5).map((champ, idx) => (
                                    <motion.div
                                        key={champ}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className={`
                                            relative group cursor-pointer w-16 h-16 rounded-lg overflow-hidden 
                                            border-2 transition-all shrink-0
                                            ${selectedSlot ? 'border-green-500/50 hover:border-green-400 hover:scale-110 shadow-[0_0_15px_rgba(74,222,128,0.3)]' : 'border-amber-500/50 hover:border-amber-400 bg-black/40 hover:bg-white/10'}
                                        `}
                                        title={champ}
                                        onClick={() => handleRecommendationClick(champ)}
                                    >
                                        <img
                                            src={getChampionImage(champ, 'icon') || ''}
                                            alt={champ}
                                            className="w-full h-full object-cover transform transition-transform"
                                        />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Red Team Picks */}
                <div className="flex flex-col h-full px-8">
                    <h2 className="text-red-400 text-2xl font-black uppercase tracking-wider mb-2 flex items-center gap-4 flex-row-reverse shrink-0">
                        {redTeam.name}
                        <div className="w-2 h-8 bg-red-500 rounded-full" />
                    </h2>
                    <div className="flex-1 flex flex-col justify-between min-h-0">
                        {redTeam.picks.map((pick, i) => renderPickSlot(pick, i, 'red'))}
                    </div>
                </div>
            </div>
        </div>
    );
}
