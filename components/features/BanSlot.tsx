'use client';

import { Champion, getChampionIconUrl, getLatestVersion } from '@/lib/api/ddragon';
import { cn } from '@/lib/utils';
import { Ban } from 'lucide-react';
import { useEffect, useState } from 'react';

interface BanSlotProps {
    champion: Champion | null;
    isActive?: boolean;
    side: 'blue' | 'red';
}

export function BanSlot({ champion, isActive, side }: BanSlotProps) {
    const [version, setVersion] = useState('');

    useEffect(() => {
        getLatestVersion().then(setVersion);
    }, []);

    return (
        <div
            className={cn(
                "relative w-10 h-10 md:w-12 md:h-12 rounded border transition-all duration-300 overflow-hidden",
                isActive ? (side === 'blue' ? "border-primary ring-2 ring-primary/30" : "border-red-500 ring-2 ring-red-500/30") : "border-white/10 bg-black/40",
            )}
        >
            {champion ? (
                <>
                    <img
                        src={getChampionIconUrl(version, champion.image.full)}
                        alt={champion.name}
                        className="w-full h-full object-cover grayscale opacity-70"
                    />
                    {/* Ban Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <Ban className="w-6 h-6 text-red-500/80" />
                    </div>
                </>
            ) : (
                isActive && (
                    <div className={cn("absolute inset-0 animate-pulse bg-current opacity-20", side === 'blue' ? "text-primary" : "text-red-500")} />
                )
            )}
        </div>
    );
}
