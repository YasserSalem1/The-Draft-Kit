'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
}

export function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    isDestructive = false
}: ConfirmationModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm z-50"
                    >
                        <div className="bg-[#090A0F] border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
                            <div className="p-6 flex flex-col items-center text-center space-y-4">
                                <div className={cn(
                                    "w-12 h-12 rounded-full flex items-center justify-center border",
                                    isDestructive ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-primary/10 border-primary/20 text-primary"
                                )}>
                                    <AlertTriangle className="w-6 h-6" />
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold text-white">{title}</h3>
                                    <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
                                </div>
                            </div>

                            <div className="flex border-t border-white/10 divide-x divide-white/10">
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-4 text-sm font-bold text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
                                >
                                    {cancelText}
                                </button>
                                <button
                                    onClick={() => {
                                        onConfirm();
                                        onClose();
                                    }}
                                    className={cn(
                                        "flex-1 py-4 text-sm font-bold transition-colors hover:bg-white/5",
                                        isDestructive ? "text-red-500 hover:text-red-400" : "text-primary hover:text-primary/80"
                                    )}
                                >
                                    {confirmText}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
