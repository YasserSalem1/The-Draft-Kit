'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CompactTeamSelector } from '@/components/features/CompactTeamSelector';
import { TEAMS } from '@/lib/data/teams';
import { X, FolderPlus, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TeamLogo } from '@/components/ui/TeamLogo';

interface CreateFolderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (name: string, teamAId?: string, teamBId?: string) => void;
}

export function CreateFolderModal({ isOpen, onClose, onCreate }: CreateFolderModalProps) {
    const [name, setName] = useState('');
    const [teamAId, setTeamAId] = useState<string>('');
    const [teamBId, setTeamBId] = useState<string>('');

    const teamA = TEAMS.find(t => t.id === teamAId);
    const teamB = TEAMS.find(t => t.id === teamBId);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        onCreate(name.trim(), teamAId || undefined, teamBId || undefined);
        // Reset
        setName('');
        setTeamAId('');
        setTeamBId('');
        onClose();
    };

    // Auto-generate name if teams selected and name is empty
    const handleTeamSelect = (side: 'A' | 'B', id: string) => {
        if (side === 'A') setTeamAId(id);
        else setTeamBId(id);

        // Optional: Smart Naming logic could go here
        // e.g. if (name === '' && id && otherId) setName(`${t1.short} vs ${t2.short}`)
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-50"
                    >
                        <div className="bg-[#090A0F] border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                            {/* Header */}
                            <div className="p-6 border-b border-white/5 bg-gradient-to-r from-white/5 to-transparent flex items-center justify-between rounded-t-2xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                                        <FolderPlus className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">New Matchup</h2>
                                        <p className="text-xs text-gray-500">Create a folder to organize your series</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-white/5 rounded-full text-gray-500 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Body */}
                            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                {/* Name Input */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Folder Name</label>
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="e.g. Worlds Finals, Scrim Block A..."
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                                    />
                                </div>

                                {/* Team Selection */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Matchup (Optional)</label>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 space-y-2">
                                            <CompactTeamSelector
                                                placeholder="Select Blue Side"
                                                selectedTeamId={teamAId}
                                                onSelect={(id) => handleTeamSelect('A', id)}
                                                className="h-11"
                                            />
                                        </div>
                                        <div className="text-gray-600 font-bold italic">VS</div>
                                        <div className="flex-1 space-y-2">
                                            <CompactTeamSelector
                                                placeholder="Select Red Side"
                                                selectedTeamId={teamBId}
                                                onSelect={(id) => handleTeamSelect('B', id)}
                                                className="h-11"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Preview / Validation Visual */}
                                {(teamA || teamB) && (
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-2">
                                        {teamA ? (
                                            <div className="flex flex-col items-center gap-1">
                                                <TeamLogo team={teamA} className="w-12 h-12 text-sm" />
                                                <span className="text-xs font-bold text-gray-400">{teamA.shortName}</span>
                                            </div>
                                        ) : (
                                            <div className="w-12 h-12 rounded-full border-2 border-dashed border-white/10" />
                                        )}

                                        <div className="h-px w-10 bg-white/10" />

                                        {teamB ? (
                                            <div className="flex flex-col items-center gap-1">
                                                <TeamLogo team={teamB} className="w-12 h-12 text-sm" />
                                                <span className="text-xs font-bold text-gray-400">{teamB.shortName}</span>
                                            </div>
                                        ) : (
                                            <div className="w-12 h-12 rounded-full border-2 border-dashed border-white/10" />
                                        )}
                                    </div>
                                )}
                            </form>

                            {/* Footer */}
                            <div className="p-4 border-t border-white/5 bg-black/20 flex justify-end gap-3 rounded-b-2xl">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={!name.trim()}
                                    className={cn(
                                        "px-6 py-2 rounded-lg text-sm font-bold text-black flex items-center gap-2 transition-all",
                                        name.trim()
                                            ? "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                                            : "bg-gray-800 text-gray-500 cursor-not-allowed"
                                    )}
                                >
                                    Create Matchup
                                    {name.trim() && <ArrowRight className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
