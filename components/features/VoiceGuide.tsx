'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';

const PAGE_EXPLANATIONS: Record<string, string> = {
    '/': "Welcome to the Drafting Hub. Here you can start new drafts, view reports, and manage your library.",
    '/draft': "This is the drafting interface. Select champions, manage bans, and use the AI assistant to optimize your team.",
    '/draft/new': "This is the drafting setup. Choose your teams and get ready to start.",
    '/library': "This is your series library. View past drafts, organize folders, and analyze your team's history.",
    '/reports': "Here are your intelligence reports. Analyze stats and opponent tendencies.",
    '/review': "Review your game performance and analyze draft impact.",
    '/drafting-agent': "This is the Coach Agent. Chat with the AI to get strategic advice and draft insights."
};

export function VoiceGuide() {
    const [enabled, setEnabled] = useState(false);
    const pathname = usePathname();
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const hasPlayedRef = useRef<string | null>(null);

    // Initial Greeting on Enable
    useEffect(() => {
        if (enabled && hasPlayedRef.current !== pathname) {
            playExplanation(pathname);
        } else if (!enabled) {
            stopAudio();
        }
    }, [enabled, pathname]);

    const playExplanation = async (path: string) => {
        const text = PAGE_EXPLANATIONS[path] || "Welcome.";
        hasPlayedRef.current = path;

        try {
            stopAudio(); // Stop any current audio

            const res = await fetch('http://localhost:5002/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });

            const data = await res.json();
            if (data.audio) {
                const audio = new Audio(`data:audio/wav;base64,${data.audio}`);
                audioRef.current = audio;
                audio.play().catch(e => console.error("Audio playback error:", e));
            }
        } catch (e) {
            console.error("Voice Guide Error:", e);
        }
    };

    const stopAudio = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
    };

    return (
        <button
            onClick={() => setEnabled(!enabled)}
            className={cn(
                "fixed top-4 right-6 z-[100] w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl backdrop-blur-md border",
                enabled
                    ? "bg-primary text-white border-primary shadow-[0_0_20px_rgba(59,130,246,0.4)]"
                    : "bg-black/40 text-gray-500 border-white/10 hover:bg-black/60 hover:text-white"
            )}
            title={enabled ? "Disable Voice Guide" : "Enable Voice Guide"}
        >
            {enabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
    );
}
