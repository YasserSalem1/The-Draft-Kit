'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Volume2, VolumeX, Mic, Square, RotateCcw, Eye, EyeOff, Sparkles } from 'lucide-react';
import Link from 'next/link';

import { DraftBoard } from '@/components/features/DraftingAgent/DraftBoard';
import { getLatestVersion, getChampionIconUrl } from '@/lib/api/ddragon';

interface DraftState {
    blue_team: { name: string; bans: (string | null)[]; picks: (string | null)[] };
    red_team: { name: string; bans: (string | null)[]; picks: (string | null)[] };
    current_step: number;
    phase: string;
}

const API_BASE = 'http://localhost:5002';

export default function DraftingAgentPage() {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [showDraft, setShowDraft] = useState(true);
    const [currentMessage, setCurrentMessage] = useState('');
    const [userTranscript, setUserTranscript] = useState('');
    const [recommendations, setRecommendations] = useState<string[]>([]);
    const [ddragonVersion, setDdragonVersion] = useState('14.1.1');
    const [draftState, setDraftState] = useState<DraftState>({
        blue_team: { name: '', bans: [null, null, null, null, null], picks: [null, null, null, null, null] },
        red_team: { name: '', bans: [null, null, null, null, null], picks: [null, null, null, null, null] },
        current_step: 0,
        phase: 'setup',
    });

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        getLatestVersion().then(setDdragonVersion);
        fetchInitialGreeting();
    }, []);

    const fetchInitialGreeting = async () => {
        setIsProcessing(true);
        try {
            const response = await fetch(`${API_BASE}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ initial: true }),
            });

            if (response.ok) {
                const data = await response.json();
                setCurrentMessage(data.response);
                setDraftState(data.draft_state);
                if (data.recommendations) {
                    setRecommendations(data.recommendations);
                }

                if (!isMuted) {
                    await playTTS(data.response);
                }
            }
        } catch (error) {
            console.error('Failed to get initial greeting:', error);
            setCurrentMessage("Hey Coach! What teams are we drafting for today?");
        } finally {
            setIsProcessing(false);
        }
    };

    const playTTS = async (text: string) => {
        try {
            const response = await fetch(`${API_BASE}/tts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.audio && audioRef.current) {
                    const audioData = atob(data.audio);
                    const arrayBuffer = new ArrayBuffer(audioData.length);
                    const view = new Uint8Array(arrayBuffer);
                    for (let i = 0; i < audioData.length; i++) {
                        view[i] = audioData.charCodeAt(i);
                    }
                    const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
                    audioRef.current.src = URL.createObjectURL(blob);
                    audioRef.current.play();
                }
            }
        } catch (error) {
            console.error('TTS error:', error);
        }
    };

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });

            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                setIsProcessing(true);
                const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });

                const formData = new FormData();
                formData.append('audio', audioBlob, 'recording.webm');

                try {
                    const sttResponse = await fetch(`${API_BASE}/stt`, {
                        method: 'POST',
                        body: formData,
                    });

                    if (sttResponse.ok) {
                        const sttData = await sttResponse.json();
                        if (sttData.text) {
                            setUserTranscript(sttData.text);
                            const chatResponse = await fetch(`${API_BASE}/chat`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ message: sttData.text }),
                            });

                            if (chatResponse.ok) {
                                const chatData = await chatResponse.json();
                                setCurrentMessage(chatData.response);
                                setDraftState(chatData.draft_state);
                                if (chatData.recommendations) {
                                    setRecommendations(chatData.recommendations);
                                }

                                if (!isMuted) {
                                    await playTTS(chatData.response);
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.error('Processing error:', error);
                    setCurrentMessage("Sorry, I didn't catch that. Try again?");
                } finally {
                    setIsProcessing(false);
                }

                stream.getTracks().forEach((track) => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (error) {
            console.error('Failed to start recording:', error);
        }
    }, [isMuted]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    }, [isRecording]);

    const handleMicClick = () => {
        if (isProcessing) return;
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    const resetDraft = async () => {
        try {
            await fetch(`${API_BASE}/draft/reset`, { method: 'POST' });
            setDraftState({
                blue_team: { name: '', bans: [null, null, null, null, null], picks: [null, null, null, null, null] },
                red_team: { name: '', bans: [null, null, null, null, null], picks: [null, null, null, null, null] },
                current_step: 0,
                phase: 'setup',
            });
            setRecommendations([]);
            fetchInitialGreeting();
        } catch (error) {
            console.error('Reset error:', error);
        }
    };

    const getChampId = (name: string) => {
        const specialCases: Record<string, string> = {
            "Lee Sin": "LeeSin", "Miss Fortune": "MissFortune", "Twisted Fate": "TwistedFate",
            "Dr. Mundo": "DrMundo", "Jarvan IV": "JarvanIV", "Rek'Sai": "RekSai",
            "Kha'Zix": "Khazix", "Vel'Koz": "VelKoz", "Cho'Gath": "Chogath",
            "Kog'Maw": "KogMaw", "Kai'Sa": "Kaisa", "Bel'Veth": "Belveth", "K'Sante": "KSante",
        };
        return specialCases[name] || name?.replace(/[^a-zA-Z0-9]/g, '') || '';
    };

    return (
        <main className="h-screen bg-[#0a0b10] flex flex-col relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute top-[-30%] left-[-20%] w-[70%] h-[70%] bg-blue-900/10 rounded-full blur-[200px]" />
                <div className="absolute bottom-[-30%] right-[-20%] w-[70%] h-[70%] bg-red-900/10 rounded-full blur-[200px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50%] h-[50%] bg-amber-900/5 rounded-full blur-[150px]" />
            </div>

            <audio ref={audioRef} className="hidden" />

            {/* Header */}
            <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5">
                <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                    <span className="text-sm font-medium">Back</span>
                </Link>

                <h1 className="text-xl font-bold text-white uppercase tracking-widest">
                    Draft <span className="text-amber-400">Coach</span>
                </h1>

                <div className="flex items-center gap-3">
                    {/* Hide/Show Draft Toggle */}
                    <button
                        onClick={() => setShowDraft(!showDraft)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${showDraft
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                            : 'bg-purple-500/20 border-purple-500/50 text-purple-400'
                            }`}
                    >
                        {showDraft ? <EyeOff className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                        <span className="text-xs font-medium">{showDraft ? 'Hide Draft' : 'Suggestions'}</span>
                    </button>

                    <button
                        onClick={resetDraft}
                        className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                        title="Reset Draft"
                    >
                        <RotateCcw className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setIsMuted(!isMuted)}
                        className={`p-2 rounded-lg border transition-all ${isMuted
                            ? 'bg-white/5 border-white/10 text-gray-500'
                            : 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                            }`}
                    >
                        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center relative z-10 p-8">
                <AnimatePresence mode="wait">
                    {showDraft ? (
                        /* Draft Board View */
                        <motion.div
                            key="draft"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3 }}
                        >
                            <DraftBoard
                                blueTeam={draftState.blue_team}
                                redTeam={draftState.red_team}
                                currentStep={draftState.current_step}
                                phase={draftState.phase}
                                ddragonVersion={ddragonVersion}
                            />
                        </motion.div>
                    ) : (
                        /* Recommendations Portal View */
                        <motion.div
                            key="recommendations"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3 }}
                            className="flex flex-col items-center gap-6"
                        >
                            <h2 className="text-3xl font-bold text-amber-400 flex items-center gap-3 mb-4">
                                <Sparkles className="w-8 h-8" />
                                Coach's Suggestions
                            </h2>

                            {/* Champion Recommendations Grid */}
                            <div className="grid grid-cols-5 gap-6 max-w-4xl">
                                {recommendations.slice(0, 5).map((champ, idx) => (
                                    <motion.div
                                        key={champ}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="flex flex-col items-center gap-3 p-3 rounded-2xl bg-white/5 border border-amber-500/30 hover:border-amber-500/60 hover:bg-amber-500/10 transition-all cursor-pointer group"
                                    >
                                        <div className="w-32 h-32 rounded-xl overflow-hidden border-2 border-amber-500/50 group-hover:border-amber-400 transition-colors shadow-xl">
                                            <img
                                                src={`https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${getChampId(champ)}_0.jpg`}
                                                alt={champ}
                                                className="w-full h-full object-cover object-top"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = `https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/champion/${getChampId(champ)}.png`;
                                                }}
                                            />
                                        </div>
                                        <span className="text-lg text-white font-bold text-center">
                                            {champ}
                                        </span>
                                    </motion.div>
                                ))}
                            </div>

                            {recommendations.length === 0 && (
                                <p className="text-gray-500 italic">
                                    Talk to Coach to get personalized suggestions!
                                </p>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom Voice Interface */}
            <div className="relative z-10 flex flex-col items-center gap-4 pb-8">
                {/* User Transcript */}
                {userTranscript && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-xl text-center px-6 py-2 bg-blue-500/10 border border-blue-500/30 rounded-xl"
                    >
                        <p className="text-blue-300 text-sm italic">
                            🎤 You said: "{userTranscript}"
                        </p>
                    </motion.div>
                )}

                {/* AI Message */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentMessage}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="max-w-2xl text-center px-8 py-4 bg-surface-light/30 border border-amber-500/20 rounded-2xl backdrop-blur-sm"
                    >
                        <p className="text-white text-lg font-medium leading-relaxed">
                            {isProcessing ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" />
                                    <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                                    <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                                </span>
                            ) : currentMessage}
                        </p>
                    </motion.div>
                </AnimatePresence>

                {/* Mic Button */}
                <motion.button
                    onClick={handleMicClick}
                    disabled={isProcessing}
                    whileHover={{ scale: isProcessing ? 1 : 1.05 }}
                    whileTap={{ scale: isProcessing ? 1 : 0.95 }}
                    className={`
                        relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300
                        ${isRecording
                            ? 'bg-red-500 shadow-[0_0_40px_rgba(239,68,68,0.6)]'
                            : isProcessing
                                ? 'bg-amber-600 shadow-[0_0_30px_rgba(245,158,11,0.4)]'
                                : 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:shadow-[0_0_50px_rgba(245,158,11,0.6)]'
                        }
                        ${isProcessing ? 'cursor-wait' : 'cursor-pointer'}
                    `}
                >
                    <AnimatePresence>
                        {isRecording && (
                            <>
                                <motion.div
                                    initial={{ scale: 1, opacity: 0.6 }}
                                    animate={{ scale: 2, opacity: 0 }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                    className="absolute inset-0 rounded-full bg-red-500"
                                />
                                <motion.div
                                    initial={{ scale: 1, opacity: 0.4 }}
                                    animate={{ scale: 1.7, opacity: 0 }}
                                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                                    className="absolute inset-0 rounded-full bg-red-500"
                                />
                            </>
                        )}
                    </AnimatePresence>

                    <div className="relative z-10">
                        {isProcessing ? (
                            <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
                        ) : isRecording ? (
                            <Square className="w-10 h-10 text-white fill-white" />
                        ) : (
                            <Mic className="w-10 h-10 text-white" />
                        )}
                    </div>
                </motion.button>

                <p className="text-gray-500 text-sm">
                    {isRecording ? 'Listening... Click to stop' : 'Click to speak'}
                </p>
            </div>
        </main>
    );
}
