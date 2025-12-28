'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIAssistantButtonProps {
    isActive: boolean;
    onClick: () => void;
}

export function AIAssistantButton({ isActive, onClick }: AIAssistantButtonProps) {
    return (
        <div className="flex justify-center my-4 relative z-50">
            <motion.button
                onClick={onClick}
                layout
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                    "relative overflow-hidden flex items-center gap-4 px-8 h-[68px] rounded-2xl transition-all duration-500 group",
                    isActive
                        ? "bg-red-500/10 border border-red-500/50 hover:bg-red-500/20 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                        : "bg-gradient-to-r from-primary/90 to-blue-600/90 hover:from-primary hover:to-blue-500 text-white shadow-[0_0_25px_rgba(59,130,246,0.4)] border border-white/20"
                )}
            >
                {/* Pulsing Ring Effect (Only when not active) */}
                {!isActive && (
                    <span className="absolute inset-0 rounded-2xl border border-white/40 animate-ping opacity-20" />
                )}

                {/* Glow Background */}
                <div className={cn(
                    "absolute inset-0 bg-white/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                    isActive ? "bg-red-500/20" : "bg-white/20"
                )} />

                {/* Icon Box */}
                <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center relative z-10 transition-colors",
                    isActive ? "bg-red-500 text-white" : "bg-white/20 backdrop-blur-sm text-white"
                )}>
                    <AnimatePresence mode='wait'>
                        {isActive ? (
                            <motion.div
                                key="close"
                                initial={{ rotate: -90, opacity: 0 }}
                                animate={{ rotate: 0, opacity: 1 }}
                                exit={{ rotate: 90, opacity: 0 }}
                            >
                                <X className="w-5 h-5 font-bold" />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="bot"
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.5, opacity: 0 }}
                            >
                                <Bot className="w-6 h-6 fill-current" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Text Content */}
                <div className="flex flex-col items-start relative z-10 text-left">
                    <span className={cn(
                        "text-lg font-bold tracking-wide uppercase",
                        isActive ? "text-red-500" : "text-white"
                    )}>
                        {isActive ? "Exit AI Mode" : "AI Draft Assistant"}
                    </span>
                    {!isActive && (
                        <span className="text-[10px] font-medium text-white/80 uppercase tracking-wider">
                            Analyze draft & recommend best pick
                        </span>
                    )}
                </div>
            </motion.button>
        </div>
    );
}
