'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DraftBoardProps {
    blueTeam: {
        name: string;
        bans: (string | null)[];
        picks: (string | null)[];
    };
    redTeam: {
        name: string;
        bans: (string | null)[];
        picks: (string | null)[];
    };
    currentStep: number;
    phase: string;
    ddragonVersion: string;
}

const ROLES = ['TOP', 'JGL', 'MID', 'ADC', 'SUP'];

export function DraftBoard({
    blueTeam,
    redTeam,
    currentStep,
    phase,
    ddragonVersion,
}: DraftBoardProps) {
    const getChampionId = (name: string) => {
        // Handle special cases
        const specialCases: Record<string, string> = {
            "Lee Sin": "LeeSin",
            "Miss Fortune": "MissFortune",
            "Twisted Fate": "TwistedFate",
            "Dr. Mundo": "DrMundo",
            "Jarvan IV": "JarvanIV",
            "Rek'Sai": "RekSai",
            "Kha'Zix": "Khazix",
            "Vel'Koz": "VelKoz",
            "Cho'Gath": "Chogath",
            "Kog'Maw": "KogMaw",
            "Kai'Sa": "Kaisa",
            "Bel'Veth": "Belveth",
            "K'Sante": "KSante",
        };
        return specialCases[name] || name?.replace(/[^a-zA-Z0-9]/g, '') || '';
    };

    const getChampionIconUrl = (name: string | null) => {
        if (!name) return null;
        return `https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/champion/${getChampionId(name)}.png`;
    };

    const renderBanSlot = (champion: string | null, index: number, side: 'blue' | 'red') => (
        <motion.div
            key={`${side}-ban-${index}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`
                relative w-12 h-12 rounded-lg
                ${champion ? 'overflow-hidden' : 'border-2 border-dashed overflow-hidden'}
                ${side === 'blue' ? 'border-blue-500/40' : 'border-red-500/40'}
                bg-black/50
            `}
        >
            {champion && (
                <>
                    <img
                        src={getChampionIconUrl(champion) || ''}
                        alt={champion}
                        className="w-full h-full object-cover grayscale brightness-50"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    {/* Red X overlay */}
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 48 48">
                        <line x1="8" y1="8" x2="40" y2="40" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
                        <line x1="40" y1="8" x2="8" y2="40" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                </>
            )}
        </motion.div>
    );

    const renderPickSlot = (champion: string | null, role: string, index: number, side: 'blue' | 'red') => (
        <motion.div
            key={`${side}-pick-${index}`}
            layout
            className={`
                flex items-center gap-3
                ${side === 'blue' ? 'flex-row' : 'flex-row-reverse'}
            `}
        >
            {/* Role Label */}
            <span className={`
                text-xs font-bold uppercase tracking-wider w-10 text-center
                ${side === 'blue' ? 'text-blue-400' : 'text-red-400'}
            `}>
                {role}
            </span>

            {/* Champion Slot */}
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className={`
                    w-20 h-20 rounded-xl overflow-hidden relative
                    ${champion ? 'shadow-lg' : 'border-2 border-dashed'}
                    ${side === 'blue'
                        ? champion ? 'border-2 border-blue-500 shadow-blue-500/30' : 'border-blue-500/30'
                        : champion ? 'border-2 border-red-500 shadow-red-500/30' : 'border-red-500/30'
                    }
                    bg-black/50
                `}
            >
                <AnimatePresence>
                    {champion ? (
                        <motion.img
                            key={champion}
                            initial={{ opacity: 0, scale: 1.3 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.3 }}
                            src={getChampionIconUrl(champion) || ''}
                            alt={champion}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="w-full h-full flex items-center justify-center"
                        >
                            <span className="text-2xl text-gray-600">?</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Champion Name */}
            <span className={`
                text-sm font-medium w-24 truncate
                ${side === 'blue' ? 'text-left' : 'text-right'}
                ${champion ? 'text-white' : 'text-gray-600'}
            `}>
                {champion || '—'}
            </span>
        </motion.div>
    );

    return (
        <div className="flex flex-col items-center gap-8">
            {/* Phase Indicator */}
            <motion.div
                key={phase}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
            >
                <span className="text-amber-400 text-sm font-bold uppercase tracking-widest">
                    {phase === 'complete' ? '🏆 Draft Complete' : `Step ${currentStep + 1}/20`}
                </span>
            </motion.div>

            {/* Bans Section */}
            <div className="flex items-center gap-8">
                {/* Blue Bans */}
                <div className="flex gap-2">
                    {blueTeam.bans.map((ban, i) => renderBanSlot(ban, i, 'blue'))}
                </div>

                <span className="text-gray-600 text-xs font-bold uppercase">BANS</span>

                {/* Red Bans */}
                <div className="flex gap-2">
                    {redTeam.bans.map((ban, i) => renderBanSlot(ban, i, 'red'))}
                </div>
            </div>

            {/* Main Draft Board */}
            <div className="flex items-start gap-16">
                {/* Blue Team */}
                <div className="flex flex-col gap-4">
                    <h2 className="text-blue-400 text-xl font-bold text-center uppercase tracking-wider mb-2">
                        {blueTeam.name}
                    </h2>
                    {ROLES.map((role, i) => renderPickSlot(blueTeam.picks[i], role, i, 'blue'))}
                </div>

                {/* VS Divider */}
                <div className="flex flex-col items-center justify-center h-[400px]">
                    <div className="w-px h-full bg-gradient-to-b from-transparent via-white/20 to-transparent" />
                    <span className="absolute text-4xl font-black text-gray-700">VS</span>
                </div>

                {/* Red Team */}
                <div className="flex flex-col gap-4">
                    <h2 className="text-red-400 text-xl font-bold text-center uppercase tracking-wider mb-2">
                        {redTeam.name}
                    </h2>
                    {ROLES.map((role, i) => renderPickSlot(redTeam.picks[i], role, i, 'red'))}
                </div>
            </div>
        </div>
    );
}
