'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, RefreshCw } from 'lucide-react';

interface DraftDisplayProps {
    blueTeam: {
        name: string;
        picks: string[];
    };
    redTeam: {
        name: string;
        picks: string[];
    };
    swapPreview?: {
        team: 'blue' | 'red';
        oldChampion: string;
        newChampion: string;
    } | null;
    ddragonVersion?: string;
    isVisible: boolean;
    onClose?: () => void;
}

export function DraftDisplay({
    blueTeam,
    redTeam,
    swapPreview,
    ddragonVersion = '14.1.1',
    isVisible,
    onClose,
}: DraftDisplayProps) {
    const getChampionId = (name: string) => {
        return name.replace(/[^a-zA-Z0-9]/g, '').replace(' ', '');
    };

    const getChampionIconUrl = (name: string) => {
        return `https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/champion/${getChampionId(name)}.png`;
    };

    const renderTeamPicks = (team: typeof blueTeam, side: 'blue' | 'red') => {
        const isBlue = side === 'blue';
        const positions = ['TOP', 'JGL', 'MID', 'ADC', 'SUP'];

        return (
            <div className={`flex flex-col gap-3 ${isBlue ? '' : 'items-end'}`}>
                <h3
                    className={`text-lg font-bold uppercase tracking-wider ${isBlue ? 'text-blue-400' : 'text-red-400'
                        }`}
                >
                    {team.name}
                </h3>

                <div className="flex flex-col gap-2">
                    {positions.map((pos, idx) => {
                        const champion = team.picks[idx];
                        const isSwapping =
                            swapPreview &&
                            swapPreview.team === side &&
                            swapPreview.oldChampion === champion;

                        return (
                            <motion.div
                                key={pos}
                                layout
                                className={`flex items-center gap-3 ${isBlue ? '' : 'flex-row-reverse'}`}
                            >
                                <span className="text-[10px] text-gray-500 font-bold w-8 text-center">
                                    {pos}
                                </span>

                                <AnimatePresence mode="popLayout">
                                    {champion ? (
                                        <motion.div
                                            key={champion}
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0.8, opacity: 0, x: isBlue ? -20 : 20 }}
                                            className="relative"
                                        >
                                            <div
                                                className={`
                          w-14 h-14 rounded-lg overflow-hidden border-2
                          ${isBlue ? 'border-blue-500/50' : 'border-red-500/50'}
                          ${isSwapping ? 'animate-pulse' : ''}
                        `}
                                            >
                                                <img
                                                    src={getChampionIconUrl(champion)}
                                                    alt={champion}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src =
                                                            'https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/Teemo.png';
                                                    }}
                                                />
                                            </div>

                                            {/* Swap Preview Arrow */}
                                            {isSwapping && swapPreview && (
                                                <motion.div
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className="absolute -right-8 top-1/2 -translate-y-1/2 flex items-center gap-1"
                                                >
                                                    <ArrowRight className="w-4 h-4 text-amber-400" />
                                                    <div className="w-14 h-14 rounded-lg overflow-hidden border-2 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                                                        <img
                                                            src={getChampionIconUrl(swapPreview.newChampion)}
                                                            alt={swapPreview.newChampion}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                </motion.div>
                                            )}
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className={`
                        w-14 h-14 rounded-lg border-2 border-dashed
                        ${isBlue ? 'border-blue-500/30' : 'border-red-500/30'}
                        flex items-center justify-center
                      `}
                                        >
                                            <span className="text-lg text-gray-600">?</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-surface-light/50 border border-white/10 rounded-2xl p-6 backdrop-blur-sm"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <RefreshCw className="w-5 h-5 text-amber-400" />
                            Current Draft
                        </h2>
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="text-gray-500 hover:text-white transition-colors text-sm"
                            >
                                Hide
                            </button>
                        )}
                    </div>

                    <div className="flex justify-between gap-8">
                        {renderTeamPicks(blueTeam, 'blue')}

                        <div className="flex items-center">
                            <div className="w-px h-full bg-gradient-to-b from-transparent via-white/20 to-transparent" />
                            <span className="px-4 text-gray-600 font-bold text-sm">VS</span>
                            <div className="w-px h-full bg-gradient-to-b from-transparent via-white/20 to-transparent" />
                        </div>

                        {renderTeamPicks(redTeam, 'red')}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
