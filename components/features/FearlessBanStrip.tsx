'use client';

import { motion } from 'framer-motion';
import { useSeries } from '@/lib/draft/series-context';
import { getChampionIconUrl } from '@/lib/api/ddragon';
import { useEffect, useState } from 'react';
import { getLatestVersion, Champion, getChampions } from '@/lib/api/ddragon';
import { Lock } from 'lucide-react';

export function FearlessBanStrip() {
    const { format, fearlessBans, games } = useSeries();
    const [version, setVersion] = useState('');
    const [allChampions, setAllChampions] = useState<Record<string, Champion>>({});

    useEffect(() => {
        async function loadData() {
            const v = await getLatestVersion();
            setVersion(v);
            const champs = await getChampions();
            const champMap: Record<string, Champion> = {};
            champs.forEach(c => champMap[c.id] = c);
            setAllChampions(champMap);
        }
        loadData();
    }, []);

    if (format === 'BO1' || fearlessBans.size === 0) return null;

    return (
        <div className="w-full bg-black/40 border-t border-white/5 py-3 px-8 flex flex-col gap-3 relative z-20 overflow-hidden">
            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest shrink-0 mb-1">
                <Lock className="w-3 h-3" />
                <span>Fearless Bans</span>
            </div>

            <div className="flex flex-col gap-3">
                {games.map((game, gameIdx) => {
                    const gamePicks = [
                        ...game.draftState.bluePicks.filter(c => c).map(c => c!.id),
                        ...game.draftState.redPicks.filter(c => c).map(c => c!.id)
                    ];

                    if (gamePicks.length === 0) return null;

                    return (
                        <div key={`game-fearless-${gameIdx}`} className="flex items-center gap-3">
                            <div className="text-[9px] font-black text-white/30 uppercase tracking-tighter shrink-0 w-12">
                                Game {gameIdx + 1}
                            </div>
                            <div className="h-4 w-px bg-white/10 shrink-0" />
                            <div className="flex flex-wrap items-center gap-2">
                                {gamePicks.map((champId) => {
                                    const champ = allChampions[champId];
                                    if (!champ) return null;
                                    return (
                                        <motion.div
                                            key={`${gameIdx}-${champId}`}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="relative w-8 h-8 rounded border border-white/10 overflow-hidden grayscale opacity-50 hover:opacity-100 hover:grayscale-0 transition-all cursor-help group"
                                        >
                                            <img
                                                src={getChampionIconUrl(version, champ.image.full)}
                                                alt={champ.name}
                                                className="w-full h-full object-cover"
                                            />
                                            {/* Tooltip */}
                                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/90 text-[10px] text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                                                {champ.name} (Game {gameIdx + 1})
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
