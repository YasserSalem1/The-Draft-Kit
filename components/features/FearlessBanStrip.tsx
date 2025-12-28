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
        <div className="w-full bg-[#090A0F] border-b border-white/5 py-2 px-6 flex items-center gap-4 overflow-x-auto no-scrollbar relative z-20">
            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest shrink-0">
                <Lock className="w-3 h-3" />
                <span>Fearless Bans</span>
            </div>

            <div className="h-4 w-px bg-white/10 shrink-0" />

            <div className="flex items-center gap-2">
                {Array.from(fearlessBans).map((champId) => {
                    const champ = allChampions[champId];
                    if (!champ) return null;
                    return (
                        <motion.div
                            key={champId}
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
                                {champ.name} (Restricted)
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
