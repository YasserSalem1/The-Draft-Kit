'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TEAMS, Team, Region } from '@/lib/data/teams';
import { Check, ChevronDown, Search, Globe, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TeamLogo } from '@/components/ui/TeamLogo';

interface CompactTeamSelectorProps {
    placeholder?: string;
    selectedTeamId: string | undefined;
    onSelect: (teamId: string) => void;
    className?: string;
}

const REGIONS: { label: string; value: Region | 'ALL' }[] = [
    { label: 'All', value: 'ALL' },
    { label: 'LCK', value: 'LCK' },
    { label: 'LPL', value: 'LPL' },
    { label: 'LEC', value: 'LEC' },
    { label: 'Americas', value: 'LTA North' }, // Simplified label
    { label: 'Pacific', value: 'LCP' },
];

export function CompactTeamSelector({ placeholder = "Select Team", selectedTeamId, onSelect, className }: CompactTeamSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeRegion, setActiveRegion] = useState<Region | 'ALL'>('ALL');
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selectedTeam = useMemo(() => TEAMS.find(t => t.id === selectedTeamId), [selectedTeamId]);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Focus input on open
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Filter logic
    const filteredTeams = useMemo(() => {
        return TEAMS.filter((t) => {
            // Region Filter
            if (activeRegion !== 'ALL') {
                if (activeRegion === 'LTA North' && (t.region === 'LTA North' || t.region === 'LTA South')) {
                    // include both
                }
                else if (t.region !== activeRegion) return false;
            }

            // Search Filter
            if (searchTerm) {
                const lower = searchTerm.toLowerCase();
                return t.name.toLowerCase().includes(lower) || t.shortName.toLowerCase().includes(lower);
            }

            return true;
        });
    }, [activeRegion, searchTerm]);

    return (
        <div className={cn("relative w-full", className)} ref={wrapperRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-full flex items-center justify-between bg-black/30 border rounded px-2 py-1.5 text-xs transition-all",
                    isOpen ? "border-primary/50 ring-1 ring-primary/20" : "border-white/10 hover:border-white/20",
                    !selectedTeam && "text-gray-500"
                )}
            >
                {selectedTeam ? (
                    <div className="flex items-center gap-2 overflow-hidden">
                        <TeamLogo team={selectedTeam} className="w-4 h-4 text-[8px]" />
                        <span className="truncate font-medium text-white">{selectedTeam.shortName}</span>
                    </div>
                ) : (
                    <span className="truncate">{placeholder}</span>
                )}
                <div className="flex items-center gap-1 ml-1 shrink-0">
                    {selectedTeam && (
                        <div
                            role="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelect('');
                            }}
                            className="p-0.5 hover:bg-white/10 rounded-full text-gray-500 hover:text-white"
                        >
                            <X className="w-3 h-3" />
                        </div>
                    )}
                    <ChevronDown className={cn("w-3 h-3 text-gray-500 transition-transform", isOpen && "rotate-180")} />
                </div>
            </button>

            {/* Dropdown Popover */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute top-full left-0 right-0 mt-1 z-50 bg-[#111] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[300px]"
                    >
                        {/* Search & Filter Header */}
                        <div className="p-2 border-b border-white/10 space-y-2 bg-[#15151A] shrink-0">
                            <div className="relative">
                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-md py-1 pl-7 pr-2 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50"
                                />
                            </div>
                            <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
                                {REGIONS.map(r => (
                                    <button
                                        key={r.value}
                                        onClick={() => setActiveRegion(r.value)}
                                        className={cn(
                                            "px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap transition-colors",
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
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-1 space-y-0.5">
                            {filteredTeams.length > 0 ? (
                                filteredTeams.map((team) => (
                                    <button
                                        key={team.id}
                                        onClick={() => {
                                            onSelect(team.id);
                                            setIsOpen(false);
                                            setSearchTerm('');
                                        }}
                                        className={cn(
                                            "w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/5 transition-colors text-left group",
                                            selectedTeamId === team.id && "bg-primary/10"
                                        )}
                                    >
                                        <TeamLogo team={team} className="w-5 h-5 text-[8px]" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className={cn("text-xs font-bold", selectedTeamId === team.id ? "text-primary" : "text-gray-300 group-hover:text-white")}>{team.shortName}</span>
                                                <span className="text-[10px] text-gray-600 truncate">{team.name}</span>
                                            </div>
                                        </div>
                                        {selectedTeamId === team.id && <Check className="w-3 h-3 text-primary shrink-0" />}
                                    </button>
                                ))
                            ) : (
                                <div className="py-4 text-center text-gray-600 text-[10px]">
                                    No teams found
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
