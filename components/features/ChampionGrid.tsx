'use client';

import { useState, useEffect, useMemo } from 'react';
import { Champion, getChampions, getLatestVersion, getChampionIconUrl } from '@/lib/api/ddragon';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useDraft } from '@/lib/draft/draft-context';
import { useSeries } from '@/lib/draft/series-context';

const ROLES = ['All', 'Fighter', 'Tank', 'Mage', 'Assassin', 'Marksman', 'Support'];

export function ChampionGrid({
    altAddSide,
    onAddAlternative,
}: {
    altAddSide?: 'blue' | 'red' | null;
    onAddAlternative?: (champion: Champion) => void;
} = {}) {
    const [champions, setChampions] = useState<Champion[]>([]);
    const [version, setVersion] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeRole, setActiveRole] = useState('All');

    useEffect(() => {
        async function init() {
            const v = await getLatestVersion();
            const data = await getChampions();
            setVersion(v);
            setChampions(data);
            setLoading(false);
        }
        init();
    }, []);

    const { selectChampion, unavailableChampionIds, isStarted, currentStep } = useDraft();
    const { fearlessBans } = useSeries();

    const handleChampionClick = (champion: Champion) => {
        // Alternative add mode overrides draft behavior
        if (altAddSide && onAddAlternative) {
            onAddAlternative(champion);
            return;
        }
        // If draft not started, or champion taken, or fearless banned, do nothing
        if (!isStarted || unavailableChampionIds.has(champion.id) || fearlessBans.has(champion.id)) return;
        selectChampion(champion);
    };

    const filteredChampions = useMemo(() => {
        return champions.filter(c => {
            const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
            const matchesRole = activeRole === 'All' || c.tags.includes(activeRole);
            if (altAddSide) {
                // In alt mode, ignore availability and fearless bans entirely
                return matchesSearch && matchesRole;
            }
            const isAvailable = !unavailableChampionIds.has(c.id);
            return matchesSearch && matchesRole && isAvailable;
        });
    }, [champions, search, activeRole, unavailableChampionIds, fearlessBans, altAddSide]);

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-gray-400">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                <p>Summoning Champions...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#0C0E14] relative overflow-hidden">
            {/* Background Texture */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent opacity-50 pointer-events-none" />

            {/* Controls */}
            <div className="p-4 border-b border-white/5 flex flex-col gap-4 relative z-20 bg-[#0C0E14]/95 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-4">
                    {/* Collapsible Search */}
                    <div className="relative flex items-center">
                        <AnimatePresence mode="wait">
                            {!search && (
                                <motion.button
                                    initial={{ width: 40, opacity: 0 }}
                                    animate={{ width: 40, opacity: 1 }}
                                    exit={{ width: 0, opacity: 0 }}
                                    onClick={() => document.getElementById('champ-search')?.focus()}
                                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors border border-white/10"
                                >
                                    <Search className="w-4 h-4" />
                                </motion.button>
                            )}
                        </AnimatePresence>

                        <motion.div
                            className="relative"
                            animate={{ width: search ? 300 : 200 }}
                        >
                            <input
                                id="champ-search"
                                type="text"
                                placeholder="Search..."
                                className="w-full bg-black/40 border border-white/10 rounded-full pl-4 pr-10 py-2.5 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all shadow-inner"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                        </motion.div>
                    </div>

                    {/* Role Filters */}
                    <div className="flex gap-1 overflow-x-auto no-scrollbar scroll-smooth">
                        {ROLES.map(role => (
                            <button
                                key={role}
                                onClick={() => setActiveRole(role)}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all duration-300 whitespace-nowrap border flex items-center gap-2",
                                    activeRole === role
                                        ? "bg-primary text-white border-primary shadow-[0_0_15px_rgba(59,130,246,0.3)] scale-105"
                                        : "bg-white/5 text-gray-400 border-white/5 hover:border-white/20 hover:text-white hover:bg-white/10"
                                )}
                            >
                                {role}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-3">
                    <AnimatePresence>
                        {filteredChampions.map((champ) => {
                            const isUnavailable = unavailableChampionIds.has(champ.id);
                            const isFearlessBanned = fearlessBans.has(champ.id);
                            const isDisabled = altAddSide ? false : (isUnavailable || isFearlessBanned);

                            return (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{
                                        opacity: isDisabled ? 0.3 : 1,
                                        scale: 1,
                                        filter: isDisabled ? 'grayscale(100%)' : 'none'
                                    }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    key={champ.id}
                                    className={cn(
                                        "aspect-square relative group",
                                        isDisabled ? "cursor-not-allowed" : "cursor-pointer"
                                    )}
                                    onClick={() => !isDisabled && handleChampionClick(champ)}
                                >
                                    {/* Fearless Ban Indicator (not shown in alt mode) */}
                                    {!altAddSide && isFearlessBanned && (
                                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50">
                                            <Lock className="w-4 h-4 text-gray-400" />
                                        </div>
                                    )}

                                    <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/20 transition-colors duration-200 rounded border border-primary/50 z-10" />

                                    {/* Image */}
                                    <div className="w-full h-full rounded border border-white/10 overflow-hidden bg-black relative">
                                        <img
                                            src={getChampionIconUrl(version, champ.image.full)}
                                            alt={champ.name}
                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                            loading="lazy"
                                        />
                                    </div>

                                    {/* Name Tooltip */}
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm px-1 py-0.5 text-[10px] text-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 truncate z-20 pointer-events-none">
                                        {champ.name}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
                {filteredChampions.length === 0 && (
                    <div className="text-center py-20 text-gray-500">
                        No champions found.
                    </div>
                )}
            </div>
        </div>
    );
}
