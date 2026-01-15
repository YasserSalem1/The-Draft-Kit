'use client';

import { motion } from 'framer-motion';
import { Player } from '@/lib/data/teams';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';
import { Champion, getChampionIconUrl, getLatestVersion } from '@/lib/api/ddragon';
import { useEffect, useState } from 'react';

interface PlayerCardProps {
    player: Player;
    teamColor: string;
    side: 'blue' | 'red';
    onClick?: () => void;
    isSelected?: boolean;
    pickedChampion?: Champion | null;
    isActiveTurn?: boolean;
}

export function PlayerCard({ player, teamColor, side, onClick, isSelected, pickedChampion, isActiveTurn }: PlayerCardProps) {
    const [version, setVersion] = useState('');

    useEffect(() => {
        getLatestVersion().then(setVersion);
    }, []);

    const isBlue = side === 'blue';

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
                    <span className={cn(
                        "text-[10px] font-black uppercase tracking-[0.2em]",
                        isBlue ? "text-blue-200" : "text-red-200"
                    )}>
                        {player.role}
                    </span>
                    <span className="text-2xl font-black text-white uppercase tracking-tighter italic leading-none truncate max-w-[180px]">
                        {player.name}
                    </span>
                    {pickedChampion && (
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
