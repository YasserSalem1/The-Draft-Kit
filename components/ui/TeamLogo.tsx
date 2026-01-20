'use client';

import { Team } from '@/lib/data/teams';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface TeamLogoProps {
    team?: Team; // Optional to handle potential missing data gracefully
    className?: string;
    fallbackClassName?: string; // Specific styling for the text fallback if needed
}

export function TeamLogo({ team, className, fallbackClassName }: TeamLogoProps) {
    const [error, setError] = useState(false);

    // Reset error state when team changes
    useEffect(() => {
        setError(false);
    }, [team?.id]);

    if (!team) {
        return <div className={cn("bg-white/10 rounded-full shrink-0 flex items-center justify-center", className)}>?</div>;
    }

    if (error || !team.logo) {
        return (
            <div
                className={cn(
                    "flex items-center justify-center rounded-full font-bold text-white shrink-0 overflow-hidden",
                    // Default font size adjustment based on common sizes, can be overridden by className
                    "text-[0.5em]",
                    className,
                    fallbackClassName
                )}
                style={{ backgroundColor: team.color }}
                title={team.name}
            >
                {team.shortName}
            </div>
        );
    }

    return (
        <img
            src={team.logo}
            alt={team.name}
            className={cn("object-contain shrink-0", className)}
            onError={() => setError(true)}
        />
    );
}
