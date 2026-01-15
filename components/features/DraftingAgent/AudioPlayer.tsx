'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { motion } from 'framer-motion';

interface AudioPlayerProps {
    audioBase64: string | null;
    format?: string;
    isMuted: boolean;
    onMuteToggle: () => void;
    onPlaybackComplete?: () => void;
}

export function AudioPlayer({
    audioBase64,
    format = 'wav',
    isMuted,
    onMuteToggle,
    onPlaybackComplete,
}: AudioPlayerProps) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        if (audioBase64 && !isMuted) {
            playAudio(audioBase64, format);
        }
    }, [audioBase64, isMuted]);

    const playAudio = async (base64: string, format: string) => {
        try {
            const audioData = atob(base64);
            const arrayBuffer = new ArrayBuffer(audioData.length);
            const view = new Uint8Array(arrayBuffer);
            for (let i = 0; i < audioData.length; i++) {
                view[i] = audioData.charCodeAt(i);
            }

            const blob = new Blob([arrayBuffer], { type: `audio/${format}` });
            const url = URL.createObjectURL(blob);

            if (audioRef.current) {
                audioRef.current.src = url;
                audioRef.current.play();
                setIsPlaying(true);
            }
        } catch (error) {
            console.error('Failed to play audio:', error);
        }
    };

    return (
        <>
            <audio
                ref={audioRef}
                onEnded={() => {
                    setIsPlaying(false);
                    onPlaybackComplete?.();
                }}
                className="hidden"
            />

            <motion.button
                onClick={onMuteToggle}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`
          w-12 h-12 rounded-full flex items-center justify-center
          transition-all duration-300 border
          ${isMuted
                        ? 'bg-white/5 border-white/10 text-gray-500 hover:text-gray-300'
                        : 'bg-amber-500/20 border-amber-500/50 text-amber-400 hover:text-amber-300'
                    }
        `}
            >
                {isMuted ? (
                    <VolumeX className="w-5 h-5" />
                ) : (
                    <Volume2 className={`w-5 h-5 ${isPlaying ? 'animate-pulse' : ''}`} />
                )}
            </motion.button>
        </>
    );
}
