'use client';

import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IntelligenceReportButtonProps {
    isActive: boolean;
    onClick: () => void;
}

export function IntelligenceReportButton({ isActive, onClick }: IntelligenceReportButtonProps) {
    return (
        <div className="flex justify-center relative z-50">
            <motion.button
                onClick={onClick}
                layout
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                    "relative overflow-hidden flex items-center gap-4 px-6 h-[50px] rounded-full transition-all duration-500 group border",
                    isActive
                        ? "bg-black/80 border-cyan-500 text-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.4)]"
                        : "bg-[#0f172a] border-cyan-500/50 text-white shadow-[0_0_30px_rgba(6,182,212,0.2)] hover:shadow-[0_0_50px_rgba(6,182,212,0.4)] hover:border-cyan-500"
                )}
            >
                {/* Gradient Stroke / Border Effect */}
                {!isActive && (
                    <div className="absolute inset-0 rounded-full p-[1px] bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 opacity-50 group-hover:opacity-100 transition-opacity -z-10" />
                )}

                {/* Animated Background Gradient */}
                <div className={cn(
                    "absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-20 transition-opacity duration-700",
                    isActive ? "from-cyan-900 to-black" : "from-cyan-600 via-blue-600 to-indigo-600"
                )} />

                {/* Icon Box */}
                <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center relative z-10 transition-colors shadow-lg",
                    isActive ? "bg-cyan-500 text-white" : "bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-blue-500/20"
                )}>
                    <FileText className="w-4 h-4" />
                </div>

                {/* Text Content */}
                <div className="flex flex-col items-start relative z-10 text-left">
                    <span className={cn(
                        "text-sm font-black tracking-wider uppercase",
                        isActive ? "text-cyan-500" : "bg-gradient-to-r from-cyan-200 to-blue-200 bg-clip-text text-transparent"
                    )}>
                        Intelligence Report
                    </span>
                </div>
            </motion.button>
        </div>
    );
}
