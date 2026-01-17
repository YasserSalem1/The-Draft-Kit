'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TEAMS, Team, Region } from '@/lib/data/teams';
import { Check, ChevronDown, Search, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TeamSelectorProps {
    side: 'blue' | 'red';
    selectedTeam: Team | null;
    onSelect: (team: Team) => void;
    otherSelectedTeam: Team | null;
}

const REGIONS: { label: string; value: Region | 'ALL' }[] = [
    { label: 'All', value: 'ALL' },
    { label: 'LCK', value: 'LCK' },
    { label: 'LPL', value: 'LPL' },
    { label: 'LEC', value: 'LEC' },
    { label: 'LTA North', value: 'LTA North' },
    { label: 'LTA South', value: 'LTA South' },
];

export function TeamSelector({ side, selectedTeam, onSelect, otherSelectedTeam }: TeamSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeRegion, setActiveRegion] = useState<Region | 'ALL'>('ALL');

    // Filter logic
    const filteredTeams = useMemo(() => {
        return TEAMS.filter((t) => {
            // Exclude already selected
            if (t.id === otherSelectedTeam?.id) return false;

            // Region Filter
            if (activeRegion !== 'ALL') {
                if (t.region !== activeRegion) return false;
            }

            // Search Filter
            if (searchTerm) {
                const lower = searchTerm.toLowerCase();
                return t.name.toLowerCase().includes(lower) || t.shortName.toLowerCase().includes(lower);
            }

            return true;
        });
    }, [otherSelectedTeam, activeRegion, searchTerm]);

    return (
        <div className="relative w-full max-w-md">
            <motion.div
                className={cn(
                    "relative h-[400px] w-full rounded-2xl border cursor-pointer overflow-hidden group",
                    side === 'blue' ? "border-primary/20" : "border-red-500/20",
                    "hover:border-opacity-50 transition-colors duration-300",
                    "glass-panel"
                )}
                onClick={() => setIsOpen(true)} // Open strictly
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
            >
                {/* Background Gradient */}
                <div
                    className={cn(
                        "absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500",
                        side === 'blue' ? "bg-gradient-to-br from-primary to-transparent" : "bg-gradient-to-bl from-red-500 to-transparent"
                    )}
                />

                {/* Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
                    {selectedTeam ? (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="space-y-4"
                        >
                            <div
                                className="w-32 h-32 rounded-full flex items-center justify-center text-4xl font-bold bg-white/10 backdrop-blur-md shadow-2xl ring-4 ring-white/10 overflow-hidden"
                                style={{ color: selectedTeam.color }}
                            >
                                {selectedTeam.logo ? (
                                    <img src={selectedTeam.logo} alt={selectedTeam.shortName} className="w-full h-full object-contain p-4" />
                                ) : (
                                    selectedTeam.shortName
                                )}
                            </div>
                            <div>
                                <h3 className="text-3xl font-bold text-white tracking-widest uppercase">{selectedTeam.shortName}</h3>
                                <div className="flex items-center justify-center gap-2 mt-2">
                                    <span className="px-2 py-0.5 rounded bg-white/10 text-xs font-bold text-gray-300">{selectedTeam.region}</span>
                                    <p className="text-sm text-gray-400">Team {side === 'blue' ? '1' : '2'}</p>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="text-gray-500 group-hover:text-white transition-colors">
                            <div className="w-24 h-24 rounded-full border-2 border-dashed border-current mb-4 flex items-center justify-center mx-auto opacity-50">
                                <ChevronDown className="w-10 h-10" />
                            </div>
                            <span className="text-xl font-medium tracking-wide">Select {side === 'blue' ? 'Team 1' : 'Team 2'}</span>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Dropdown / Panel Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop to close */}
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                            onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="absolute top-0 left-0 w-full h-[500px] z-50 glass-panel rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col bg-[#111]"
                        >
                            {/* Header: Search & Filter */}
                            <div className="p-4 border-b border-white/10 space-y-4 bg-[#15151A]">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search teams..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50"
                                        autoFocus
                                    />
                                </div>
                                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                    {REGIONS.map(r => (
                                        <button
                                            key={r.value}
                                            onClick={() => setActiveRegion(r.value)}
                                            className={cn(
                                                "px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors",
                                                activeRegion === r.value
                                                    ? "bg-white text-black"
                                                    : "bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300"
                                            )}
                                        >
                                            {r.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* List */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                                {filteredTeams.length > 0 ? (
                                    filteredTeams.map((team) => (
                                        <div
                                            key={team.id}
                                            onClick={() => {
                                                onSelect(team);
                                                setIsOpen(false);
                                                setSearchTerm('');
                                            }}
                                            className="flex items-center p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group border border-transparent hover:border-white/5"
                                        >
                                            <div
                                                className="w-10 h-10 rounded-lg flex items-center justify-center text-[10px] font-black mr-4 bg-black/40 border border-white/5 overflow-hidden"
                                                style={{ color: team.color }}
                                            >
                                                {team.logo ? (
                                                    <img src={team.logo} alt={team.shortName} className="w-full h-full object-contain p-1.5" />
                                                ) : (
                                                    team.shortName
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-bold text-gray-200 group-hover:text-white">{team.shortName}</div>
                                                <div className="text-[10px] text-gray-500 uppercase font-bold">{team.region}</div>
                                            </div>
                                            {selectedTeam?.id === team.id && <Check className="w-5 h-5 text-primary" />}
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-40 text-gray-500 gap-2">
                                        <Globe className="w-8 h-8 opacity-20" />
                                        <p className="text-sm">No teams found</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
