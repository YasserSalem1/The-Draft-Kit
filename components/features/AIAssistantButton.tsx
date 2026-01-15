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
        <div className="flex justify-center relative z-50">
            <motion.button
                onClick={onClick}
                layout
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                    "relative overflow-hidden flex items-center gap-4 px-8 h-[60px] rounded-full transition-all duration-500 group border",
                    isActive
                        ? "bg-black/80 border-red-500 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)]"
                        : "bg-[#0f172a] border-[#a855f7]/50 text-white shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:shadow-[0_0_50px_rgba(168,85,247,0.5)] hover:border-[#a855f7]"
                )}
            >
                {/* Gradient Stroke / Border Effect */}
                {!isActive && (
                    <div className="absolute inset-0 rounded-full p-[1px] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-50 group-hover:opacity-100 transition-opacity -z-10" />
                )}

                {/* Animated Background Gradient */}
                <div className={cn(
                    "absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-20 transition-opacity duration-700",
                    isActive ? "from-red-900 to-black" : "from-blue-600 via-purple-600 to-pink-600"
                )} />

                {/* Icon Box */}
                <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center relative z-10 transition-colors shadow-lg",
                    isActive ? "bg-red-500 text-white" : "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-purple-500/20"
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
                                className="relative"
                            >
                                <Bot className="w-5 h-5 fill-current" />
                                <div className="absolute inset-0 animate-ping opacity-50 bg-white rounded-full" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Text Content */}
                <div className="flex flex-col items-start relative z-10 text-left">
                    <div className="flex items-center gap-2">
                        <span className={cn(
                            "text-base font-black tracking-wider uppercase",
                            isActive ? "text-red-500" : "bg-gradient-to-r from-blue-200 to-purple-200 bg-clip-text text-transparent"
                        )}>
                            {isActive ? "Close Intelligence" : "Intelligence"}
                        </span>
                        {!isActive && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-gradient-to-r from-purple-500 to-pink-600 text-white uppercase tracking-widest">Pro</span>}
                    </div>
                </div>
            </motion.button>
        </div>
    );
}
