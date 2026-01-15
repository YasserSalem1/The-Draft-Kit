'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Bot, User } from 'lucide-react';

interface ChatMessageProps {
    role: 'user' | 'assistant';
    content: string;
    championsHighlighted?: string[];
    ddragonVersion?: string;
}

export function ChatMessage({
    role,
    content,
    championsHighlighted = [],
    ddragonVersion = '14.1.1',
}: ChatMessageProps) {
    const isAI = role === 'assistant';

    // Convert champion name to DDragon format (remove spaces, special chars)
    const getChampionId = (name: string) => {
        return name.replace(/[^a-zA-Z0-9]/g, '').replace(' ', '');
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex gap-4 ${isAI ? 'flex-row' : 'flex-row-reverse'}`}
        >
            {/* Avatar */}
            <div
                className={`
          w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
          ${isAI
                        ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                        : 'bg-white/10'
                    }
        `}
            >
                {isAI ? (
                    <Bot className="w-5 h-5 text-white" />
                ) : (
                    <User className="w-5 h-5 text-gray-300" />
                )}
            </div>

            {/* Message Content */}
            <div
                className={`
          max-w-[80%] rounded-2xl px-5 py-4
          ${isAI
                        ? 'bg-surface-light/50 border border-amber-500/20 text-gray-100'
                        : 'bg-white/5 border border-white/10 text-gray-300'
                    }
        `}
            >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>

                {/* Champion Icons */}
                {championsHighlighted.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-white/10">
                        {championsHighlighted.map((champ) => (
                            <motion.div
                                key={champ}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                className="relative group"
                            >
                                <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                                    <img
                                        src={`https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/champion/${getChampionId(champ)}.png`}
                                        alt={champ}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                </div>
                                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] text-amber-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                    {champ}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
