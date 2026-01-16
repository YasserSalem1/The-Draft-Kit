import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Ban, Trophy } from 'lucide-react';
import { SavedSeries } from '@/lib/persistence/storage';
import { TEAMS } from '@/lib/data/teams';
import { TeamLogo } from '@/components/ui/TeamLogo';
import { getChampionIconUrl } from '@/lib/api/ddragon';
import { cn } from '@/lib/utils'; // Assuming this exists from prev context

export interface SeriesCardProps {
    series: SavedSeries;
    ddragonVersion: string;
    onDelete: (id: string) => void;
    onRename: (id: string, newName: string) => void;
}

const ROLE_ICONS = ['Top', 'Jungle', 'Mid', 'Bot', 'Support'];

export function SeriesCard({ series, ddragonVersion, onDelete, onRename }: SeriesCardProps) {
    const [activeGameIndex, setActiveGameIndex] = useState(0);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(series.name || '');

    // Sort games by date if needed, but usually they are pushed in order. 
    // Default to game 1 (index 0) or latest? User usually wants to see start or end. 
    // Let's default to 0 (Game 1).

    const activeGame = series.games[activeGameIndex] || series.games[0];
    const blueTeam = TEAMS.find(t => t.id === series.blueTeamId) || TEAMS[0];
    const redTeam = TEAMS.find(t => t.id === series.redTeamId) || TEAMS[1];

    if (!activeGame) return null;

    const bluePicks = activeGame.draftState.bluePicks || Array(5).fill(null);
    const redPicks = activeGame.draftState.redPicks || Array(5).fill(null);
    const blueBans = activeGame.draftState.blueBans || Array(5).fill(null);
    const redBans = activeGame.draftState.redBans || Array(5).fill(null);

    const isBlueWinner = activeGame.winner === 'blue';
    const isRedWinner = activeGame.winner === 'red';

    const handleRenameSubmit = () => {
        if (editName.trim() !== series.name) {
            onRename(series.id, editName);
        }
        setIsEditing(false);
    };

    return (
        <div className="group relative bg-[#0a0a0a] border border-white/5 hover:border-white/10 rounded-2xl overflow-hidden transition-all hover:shadow-2xl hover:shadow-black/50 hover:translate-y-[-2px]">
            {/* Header: Series Info & Game Selector */}
            <div className="flex items-center justify-between p-3 border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    {isEditing ? (
                        <input
                            autoFocus
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onBlur={handleRenameSubmit}
                            onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
                            className="bg-black/50 border border-white/20 rounded px-1.5 py-0.5 text-sm font-bold text-white focus:outline-none focus:border-primary/50 w-full max-w-[180px]"
                        />
                    ) : (
                        <div className="flex items-center gap-2 group/title min-w-0">
                            <h3
                                className="font-bold text-sm text-white group-hover:text-primary transition-colors truncate cursor-pointer max-w-[180px]"
                                onClick={() => {
                                    setEditName(series.name || 'Untitled Draft');
                                    setIsEditing(true);
                                }}
                            >
                                {series.name || 'Untitled Draft'}
                            </h3>
                            <span className="text-[10px] font-medium text-gray-500 px-1 py-px rounded bg-white/5 border border-white/5 whitespace-nowrap">{series.format}</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Game Tabs */}
                    {series.format !== 'BO1' && (
                        <div className="flex bg-black/50 rounded p-0.5 gap-0.5">
                            {series.games.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={(e) => { e.preventDefault(); setActiveGameIndex(idx); }}
                                    className={cn(
                                        "w-5 h-5 flex items-center justify-center text-[9px] font-bold rounded transition-all",
                                        activeGameIndex === idx
                                            ? "bg-white/10 text-white shadow-sm"
                                            : "text-gray-600 hover:text-gray-300 hover:bg-white/5"
                                    )}
                                >
                                    {idx + 1}
                                </button>
                            ))}
                        </div>
                    )}

                    <button
                        onClick={(e) => { e.preventDefault(); onDelete(series.id); }}
                        className="p-1.5 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            <Link href={`/review/${series.id}`} className="block relative z-10 p-4">
                <div className="flex gap-4">

                    {/* Blue Team Column */}
                    <div className="flex-1 flex flex-col gap-3">
                        <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                            <TeamLogo team={blueTeam} className="w-6 h-6" />
                            <div className="flex flex-col">
                                <span className={cn("text-xs font-bold leading-none", isBlueWinner ? "text-blue-200" : "text-gray-300")}>{blueTeam.shortName}</span>
                                {isBlueWinner && <span className="text-[8px] font-bold text-blue-500 uppercase tracking-wider">Win</span>}
                            </div>
                        </div>

                        {/* Picks */}
                        <div className="flex flex-col gap-1">
                            {bluePicks.map((pick, i) => (
                                <div key={i} className="flex items-center gap-2 group/pick h-10">
                                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 bg-black shadow-md group-hover/pick:border-blue-500/50 transition-all duration-300 shrink-0">
                                        {pick ? (
                                            <img src={getChampionIconUrl(ddragonVersion, pick.image.full)} className="w-full h-full object-cover scale-110" />
                                        ) : <div className="w-full h-full bg-white/5" />}
                                    </div>
                                    <span className="text-xs font-bold text-gray-300 truncate group-hover/pick:text-blue-200 transition-colors">{pick?.name || '-'}</span>
                                </div>
                            ))}
                        </div>

                        {/* Bans */}
                        <div className="flex gap-1 pt-2 border-t border-white/5 mt-1">
                            {blueBans.map((ban, i) => (
                                <div key={i} className="w-7 h-7 rounded bg-black/40 border border-white/5 grayscale opacity-50 relative overflow-hidden shrink-0">
                                    {ban ? <img src={getChampionIconUrl(ddragonVersion, ban.image.full)} className="w-full h-full object-cover" /> : <div className="bg-white/5 w-full h-full" />}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-[120%] h-[1px] bg-red-500/50 absolute rotate-45" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="w-px bg-white/5" />

                    {/* Red Team Column */}
                    <div className="flex-1 flex flex-col gap-3">
                        <div className="flex flex-row-reverse items-center gap-2 pb-1 border-b border-white/5">
                            <TeamLogo team={redTeam} className="w-6 h-6" />
                            <div className="flex flex-col items-end">
                                <span className={cn("text-xs font-bold leading-none", isRedWinner ? "text-red-200" : "text-gray-300")}>{redTeam.shortName}</span>
                                {isRedWinner && <span className="text-[8px] font-bold text-red-500 uppercase tracking-wider">Win</span>}
                            </div>
                        </div>

                        {/* Picks */}
                        <div className="flex flex-col items-end gap-1">
                            {redPicks.map((pick, i) => (
                                <div key={i} className="flex flex-row-reverse items-center gap-2 group/pick h-10">
                                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 bg-black shadow-md group-hover/pick:border-red-500/50 transition-all duration-300 shrink-0">
                                        {pick ? (
                                            <img src={getChampionIconUrl(ddragonVersion, pick.image.full)} className="w-full h-full object-cover scale-110" />
                                        ) : <div className="w-full h-full bg-white/5" />}
                                    </div>
                                    <span className="text-xs font-bold text-gray-300 truncate group-hover/pick:text-red-200 transition-colors">{pick?.name || '-'}</span>
                                </div>
                            ))}
                        </div>

                        {/* Bans */}
                        <div className="flex flex-row-reverse gap-1 pt-2 border-t border-white/5 mt-1">
                            {redBans.map((ban, i) => (
                                <div key={i} className="w-7 h-7 rounded bg-black/40 border border-white/5 grayscale opacity-50 relative overflow-hidden shrink-0">
                                    {ban ? <img src={getChampionIconUrl(ddragonVersion, ban.image.full)} className="w-full h-full object-cover" /> : <div className="bg-white/5 w-full h-full" />}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-[120%] h-[1px] bg-red-500/50 absolute rotate-45" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Link>
        </div>
    );
}
