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

    return (
        <motion.div
            className={cn(
                "relative w-full h-24 md:h-32 glass-panel rounded-lg overflow-hidden group cursor-pointer border transition-all duration-300",
                isSelected ? "border-current bg-white/5" : "border-white/5 hover:border-white/20",
                isActiveTurn ? "ring-2 ring-yellow-400/50 animate-pulse border-yellow-400" : "" // Active turn highlighter
            )}
            style={{ borderColor: isSelected ? teamColor : (isActiveTurn ? '#facc15' : undefined) }}
            onClick={onClick}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
            {/* Background Gradient */}
            <div
                className={cn(
                    "absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-20 transition-opacity duration-300",
                    side === 'blue' ? "from-black via-transparent to-transparent" : "from-transparent via-transparent to-black" // Flipped for red side visual balance if needed, or keeping generic. 
                    // Actually let's make it direction dependent
                    // Left side (blue team) -> highlight left. Right side (red team) -> highlight right?
                    // Let's just do a subtle colored glow
                )}
                style={{ backgroundColor: teamColor, opacity: isSelected ? 0.1 : 0 }}
            />

            {/* Picked Champion Background (Full Art) - Simplified to just color/gradient for now, maybe add splash art later if available */}
            {pickedChampion && (
                <div className="absolute inset-0 overflow-hidden">
                    {/* Using icon slightly blurred and zoomed as background for now */}
                    <img
                        src={getChampionIconUrl(version, pickedChampion.image.full)}
                        className="w-full h-full object-cover opacity-30 blur-sm scale-150 grayscale"
                        alt=""
                    />
                </div>
            )}

            <div className={cn("flex items-center h-full px-4 gap-4 relative z-10", side === 'red' ? "flex-row-reverse text-right" : "")}>
                {/* Photo / Avatar */}
                <div className={cn(
                    "relative w-16 h-16 md:w-20 md:h-20 rounded-full bg-black/40 border flex-shrink-0 flex items-center justify-center overflow-hidden transition-all duration-500",
                    pickedChampion ? "border-primary shadow-[0_0_15px_rgba(59,130,246,0.5)]" : "border-white/10"
                )}>
                    {pickedChampion ? (
                        <img
                            src={getChampionIconUrl(version, pickedChampion.image.full)}
                            alt={pickedChampion.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <User className="w-8 h-8 text-gray-500" />
                    )}
                </div>

                {/* Info */}
                <div className="flex-1">
                    <p className="text-xs text-gray-500 font-bold tracking-wider uppercase">{player.role}</p>
                    <h3 className="text-lg md:text-xl font-bold text-white leading-tight group-hover:text-primary transition-colors duration-300">
                        {player.name}
                    </h3>
                    {pickedChampion && (
                        <p className="text-sm font-bold text-primary mt-1 uppercase tracking-widest">{pickedChampion.name}</p>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
