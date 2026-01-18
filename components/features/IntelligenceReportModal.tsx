'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { X, BrainCircuit } from 'lucide-react';
import { getChampionIconUrl, getLatestVersion, getChampions, Champion } from '@/lib/api/ddragon';

interface IntelligenceReportModalProps {
    onClose: () => void;
    blueTeam: any;
    redTeam: any;
    blueReport?: any;
    redReport?: any;
}

export function IntelligenceReportModal({ onClose, blueTeam, redTeam, blueReport, redReport }: IntelligenceReportModalProps) {
    const [version, setVersion] = useState('');
    const [champions, setChampions] = useState<Champion[]>([]);

    useEffect(() => {
        async function init() {
            try {
                const v = await getLatestVersion();
                const data = await getChampions();
                setVersion(v);
                setChampions(data);
            } catch (err) {
                console.error("Failed to load champion data", err);
            }
        }
        init();
    }, []);

    const getChampImage = (name: string) => {
        const champ = champions.find(c => c.name.toLowerCase() === name.toLowerCase());
        if (!champ) {
            // Try fuzzy match or finding by partial name if exact match fails
            const fuzzy = champions.find(c => c.name.toLowerCase().includes(name.toLowerCase()));
            if (fuzzy) return getChampionIconUrl(version, fuzzy.image.full);
            return '';
        }
        return getChampionIconUrl(version, champ.image.full);
    };

    const renderChampItem = (name: string, count?: number, label?: string, large = false) => {
        const imageUrl = getChampImage(name);
        return (
            <div className={`flex flex-col items-center gap-2 group ${large ? 'w-full' : ''}`}>
                <div className={`${large ? 'w-16 h-16' : 'w-10 h-10'} rounded-2xl overflow-hidden border border-white/10 group-hover:border-amber-400 transition-colors shadow-lg relative`}>
                    {imageUrl && <img src={imageUrl} alt={name} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" />}
                    {count !== undefined && (
                        <div className="absolute bottom-0 right-0 bg-black/80 backdrop-blur text-white text-[10px] font-bold px-1.5 py-0.5 rounded-tl-lg">
                            {count}
                        </div>
                    )}
                </div>
                <span className={`${large ? 'text-[10px]' : 'text-[9px]'} text-gray-400 uppercase font-bold truncate w-full text-center group-hover:text-white transition-colors`}>{label || name}</span>
            </div>
        );
    };

    const matchPlayerToPool = (playerName: string, teamPools: Record<string, any[]>) => {
        // Simple fuzzy match or direct match
        if (!teamPools) return [];
        // Try exact match first
        if (teamPools[playerName]) return teamPools[playerName];

        // Try case insensitive
        const key = Object.keys(teamPools).find(k => k.toLowerCase() === playerName.toLowerCase());
        if (key) return teamPools[key];

        return [];
    };

    const getPlayerStats = (playerName: string, groupedStats: any) => {
        if (!groupedStats) return null;
        // Search across all roles
        for (const role in groupedStats) {
            const playerFn = groupedStats[role].find((p: any) => p.name?.toLowerCase() === playerName.toLowerCase());
            if (playerFn) return playerFn;
        }
        return null;
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-8"
        >
            <button onClick={onClose} className="absolute top-8 right-8 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors">
                <X className="w-6 h-6" />
            </button>

            <div className="max-w-6xl w-full h-[85vh] bg-[#0C0E14] border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl relative">

                {/* Header */}
                <div className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-gradient-to-r from-cyan-900/20 to-transparent">
                    <div className="flex items-center">
                        <BrainCircuit className="w-8 h-8 text-cyan-400 mr-4" />
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Intelligence Report</h2>
                            <div className="text-xs font-bold text-cyan-500 uppercase tracking-widest">Pre-Match Strategy Analysis</div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                    <div className="grid grid-cols-2 gap-12">
                        {/* Blue Side Scouting */}
                        <div className="space-y-10">
                            <div className="flex items-center gap-4 border-b border-blue-500/20 pb-4">
                                <h3 className="text-3xl font-black text-blue-500 uppercase italic tracking-tighter">{blueTeam.shortName} Habits</h3>
                                <span className="text-xs text-gray-500 font-bold uppercase tracking-widest ml-auto bg-blue-500/10 px-3 py-1 rounded-full">
                                    {blueReport?.games_count || 0} Games Analyzed
                                </span>
                            </div>

                            {/* DRAFT HABITS GRID */}
                            <div className="grid grid-cols-2 gap-8">
                                {/* BANS BY THEM */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                        Most Banned By Them
                                    </h4>
                                    <div className="grid grid-cols-3 gap-3">
                                        {blueReport?.most_banned_champions?.by_blue_side?.slice(0, 6).map((ban: any, i: number) => (
                                            <div key={i}>{renderChampItem(ban.champion, ban.count, undefined, true)}</div>
                                        )) || <span className="text-gray-600 text-xs col-span-3">No Data</span>}
                                    </div>
                                </div>

                                {/* TARGET BANS */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                                        Target Bans
                                    </h4>
                                    <div className="grid grid-cols-3 gap-3">
                                        {blueReport?.most_banned_champions?.against_blue_side?.slice(0, 6).map((ban: any, i: number) => (
                                            <div key={i}>{renderChampItem(ban.champion, ban.count, undefined, true)}</div>
                                        )) || <span className="text-gray-600 text-xs col-span-3">No Data</span>}
                                    </div>
                                </div>
                            </div>

                            {/* PRIORITY PICKS */}
                            <div className="bg-blue-900/5 rounded-2xl p-6 border border-blue-500/10">
                                <h4 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    Priority First Picks (B1)
                                </h4>
                                <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                                    {blueReport?.most_picked_champions_by_slot?.blue1?.slice(0, 8).map(([champ, count]: [string, number], i: number) => (
                                        <div key={i} className="min-w-[4rem]">{renderChampItem(champ, count, undefined, true)}</div>
                                    )) || <span className="text-gray-600 text-xs">No Data</span>}
                                </div>
                            </div>

                            {/* DRAFT PICK NATURE */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Draft Pick Nature</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Blind Picks */}
                                    <div className="bg-blue-900/10 border border-blue-500/10 rounded-xl p-4">
                                        <h5 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <span className="w-1 h-1 bg-blue-400 rounded-full"></span>
                                            Safety (Blind Picks)
                                        </h5>
                                        <div className="grid grid-cols-3 gap-2">
                                            {blueReport?.blind_pick_champions_frequency?.slice(0, 6).map(([name, count]: [string, number], i: number) => (
                                                <div key={i}>
                                                    {renderChampItem(name, count, undefined)}
                                                </div>
                                            )) || <span className="text-gray-600 text-[10px] col-span-3">No Data</span>}
                                        </div>
                                    </div>

                                    {/* Counter Picks */}
                                    <div className="bg-red-900/10 border border-red-500/10 rounded-xl p-4">
                                        <h5 className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <span className="w-1 h-1 bg-red-400 rounded-full"></span>
                                            Answers (Counter Picks)
                                        </h5>
                                        <div className="grid grid-cols-3 gap-2">
                                            {blueReport?.counter_pick_champions_frequency?.slice(0, 6).map(([name, count]: [string, number], i: number) => (
                                                <div key={i}>
                                                    {renderChampItem(name, count, undefined)}
                                                </div>
                                            )) || <span className="text-gray-600 text-[10px] col-span-3">No Data</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Red Side Scouting */}
                        <div className="space-y-10">
                            <div className="flex items-center gap-4 border-b border-red-500/20 pb-4">
                                <h3 className="text-3xl font-black text-red-500 uppercase italic tracking-tighter">{redTeam.shortName} Habits</h3>
                                <span className="text-xs text-gray-500 font-bold uppercase tracking-widest ml-auto bg-red-500/10 px-3 py-1 rounded-full">
                                    {redReport?.games_count || 0} Games Analyzed
                                </span>
                            </div>

                            {/* DRAFT HABITS GRID */}
                            <div className="grid grid-cols-2 gap-8">
                                {/* BANS BY THEM */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                                        Most Banned By Them
                                    </h4>
                                    <div className="grid grid-cols-3 gap-3">
                                        {redReport?.most_banned_champions?.by_red_side?.slice(0, 6).map((ban: any, i: number) => (
                                            <div key={i}>{renderChampItem(ban.champion, ban.count, undefined, true)}</div>
                                        )) || <span className="text-gray-600 text-xs col-span-3">No Data</span>}
                                    </div>
                                </div>

                                {/* TARGET BANS */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                                        Target Bans
                                    </h4>
                                    <div className="grid grid-cols-3 gap-3">
                                        {redReport?.most_banned_champions?.against_red_side?.slice(0, 6).map((ban: any, i: number) => (
                                            <div key={i}>{renderChampItem(ban.champion, ban.count, undefined, true)}</div>
                                        )) || <span className="text-gray-600 text-xs col-span-3">No Data</span>}
                                    </div>
                                </div>
                            </div>

                            {/* PRIORITY PICKS */}
                            <div className="bg-red-900/5 rounded-2xl p-6 border border-red-500/10">
                                <h4 className="text-xs font-black text-red-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    Priority Rotation Picks (R1/R2)
                                </h4>
                                <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                                    {redReport?.most_picked_champions_by_slot?.red1_red2?.slice(0, 8).map(([champ, count]: [string, number], i: number) => (
                                        <div key={i} className="min-w-[4rem]">{renderChampItem(champ, count, undefined, true)}</div>
                                    )) || <span className="text-gray-600 text-xs">No Data</span>}
                                </div>
                            </div>

                            {/* DRAFT PICK NATURE */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Draft Pick Nature</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Blind Picks */}
                                    <div className="bg-blue-900/10 border border-blue-500/10 rounded-xl p-4">
                                        <h5 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <span className="w-1 h-1 bg-blue-400 rounded-full"></span>
                                            Safety (Blind Picks)
                                        </h5>
                                        <div className="grid grid-cols-3 gap-2">
                                            {redReport?.blind_pick_champions_frequency?.slice(0, 6).map(([name, count]: [string, number], i: number) => (
                                                <div key={i}>
                                                    {renderChampItem(name, count, undefined)}
                                                </div>
                                            )) || <span className="text-gray-600 text-[10px] col-span-3">No Data</span>}
                                        </div>
                                    </div>

                                    {/* Counter Picks */}
                                    <div className="bg-red-900/10 border border-red-500/10 rounded-xl p-4">
                                        <h5 className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <span className="w-1 h-1 bg-red-400 rounded-full"></span>
                                            Answers (Counter Picks)
                                        </h5>
                                        <div className="grid grid-cols-3 gap-2">
                                            {redReport?.counter_pick_champions_frequency?.slice(0, 6).map(([name, count]: [string, number], i: number) => (
                                                <div key={i}>
                                                    {renderChampItem(name, count, undefined)}
                                                </div>
                                            )) || <span className="text-gray-600 text-[10px] col-span-3">No Data</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
