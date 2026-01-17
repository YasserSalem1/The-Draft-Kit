'use client';

import { motion } from 'framer-motion';
import { Player } from '@/lib/data/teams';
import { cn } from '@/lib/utils';
import { User, X } from 'lucide-react';
import { Champion, getChampionIconUrl, getLatestVersion } from '@/lib/api/ddragon';
import { useEffect, useState } from 'react';

interface PlayerCardProps {
    player: Player;
    teamColor: string;
    side: 'blue' | 'red';
    onClick?: () => void;
    onRemove?: () => void;
    isSelected?: boolean;
    pickedChampion?: Champion | null;
    isActiveTurn?: boolean;
    isLocked?: boolean;
}

export function PlayerCard({ player, teamColor, side, onClick, onRemove, isSelected, pickedChampion, isActiveTurn, isLocked = true }: PlayerCardProps) {
    const [version, setVersion] = useState('');

    useEffect(() => {
        getLatestVersion().then(setVersion);
    }, []);

    const isBlue = side === 'blue';
    const isPlaceholder = player.id.includes('placeholder');

    return (
        <motion.div
            className={cn(
                "relative w-full h-full overflow-hidden group cursor-pointer transition-all duration-300",
                "border-y border-transparent hover:border-white/20", // Cleaner border handling
                isActiveTurn
                    ? (isBlue ? "bg-gradient-to-r from-blue-900/60 to-transparent border-l-4 border-l-blue-400" : "bg-gradient-to-l from-red-900/60 to-transparent border-r-4 border-r-red-400")
                    : "bg-black/20"
            )}
            onClick={onClick}
            whileHover={{ scale: 1.01, backgroundColor: 'rgba(255,255,255,0.05)' }}
        >
            {/* Remove Button (Only during prep phase) */}
            {!isLocked && !isPlaceholder && onRemove && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}
                    className={cn(
                        "absolute top-2 z-30 p-1 rounded-full bg-black/40 hover:bg-red-500/80 text-white transition-all opacity-0 group-hover:opacity-100",
                        isBlue ? "right-2" : "left-2"
                    )}
                >
                    <X className="w-3 h-3" />
                </button>
            )}

            {/* FULL CARD CHAMPION BACKGROUND (Broadcast Style) */}
            {pickedChampion && (
                <div className="absolute inset-0 z-0">
                    <div className={cn(
                        "absolute inset-0 bg-gradient-to-r via-black/40 to-black/80 z-10",
                        isBlue ? "from-transparent" : "from-black/80 via-black/40 to-transparent"
                    )} />
                    {/* Centered Splash Slice */}
                    <img
                        src={`https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${pickedChampion.id}_0.jpg`}
                        className={cn(
                            "w-full h-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-105",
                            isBlue ? "object-[20%_20%]" : "object-[80%_20%]" // Shift focus based on side
                        )}
                        alt={pickedChampion.name}
                    />
                </div>
            )}

            {/* Content Container - Z-indexed above bg */}
            <div className={cn(
                "relative z-10 flex items-center h-full px-6 gap-5 w-full",
                !isBlue && "flex-row-reverse text-right"
            )}>
                {/* 1. Player Role & Name Block */}
                <div className="flex flex-col justify-center gap-1 z-20 drop-shadow-md">
                    {/* Role text removed */}
                    <span className="text-2xl font-black text-white uppercase tracking-tighter italic leading-none truncate max-w-[180px]">
                        {player.name}
                    </span>
                    {pickedChampion && pickedChampion.name !== player.name && (
                        <span className={cn(
                            "text-xs font-bold uppercase tracking-wider mt-1",
                            isBlue ? "text-blue-400" : "text-red-400"
                        )}>
                            {pickedChampion.name}
                        </span>
                    )}
                </div>

                {/* Spacer to push content to sides */}
                <div className="flex-1" />

                {/* 2. Selection Indicator / Icon (Optional supplementary UI) */}
                {!pickedChampion && (
                    <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center border-2 border-dashed opacity-30",
                        isBlue ? "border-blue-500 text-blue-500" : "border-red-500 text-red-500"
                    )}>
                        <User className="w-5 h-5" />
                    </div>
                )}
            </div>

            {/* Active Turn Flash */}
            {isActiveTurn && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.5, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className={cn(
                        "absolute inset-0 z-20 pointer-events-none",
                        isBlue ? "bg-blue-400/10" : "bg-red-400/10"
                    )}
                />
            )}
        </motion.div>
    );
}
