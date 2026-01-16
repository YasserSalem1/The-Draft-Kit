'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Volume2, VolumeX, Mic, Square, LayoutGrid, Sparkles } from 'lucide-react';
import Link from 'next/link';

import { DraftBoard } from '@/components/features/DraftingAgent/DraftBoard';
import { getLatestVersion } from '@/lib/api/ddragon';
import { getSavedSeries, SavedSeries } from '@/lib/persistence/storage';
import { TEAMS } from '@/lib/data/teams';
import { TeamLogo } from '@/components/ui/TeamLogo';

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
    const [currentMessage, setCurrentMessage] = useState('Hey coach, Let\'s review one of your recent Drafts.');
    const [userTranscript, setUserTranscript] = useState('');
    const [recommendations, setRecommendations] = useState<string[]>([]);
    const [ddragonVersion, setDdragonVersion] = useState('14.1.1');
    const [recentDrafts, setRecentDrafts] = useState<SavedSeries[]>([]);
    const [selectionMode, setSelectionMode] = useState(true);

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
        const series = getSavedSeries();
        setRecentDrafts(series.sort((a, b) => b.timestamp - a.timestamp).slice(0, 3));
        playTTS("Hey coach, Let's review one of your recent Drafts.");
    }, []);

    const playTTS = async (text: string) => {
        if (isMuted) return;
        if (audioRef.current && !audioRef.current.paused) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }

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
                    try { await audioRef.current.play(); } catch (e) { }
                }
            }
        } catch (error) {
            console.error('TTS error:', error);
        }
    };

    const handleSelectDraft = async (series: SavedSeries) => {
        setSelectionMode(false);
        setIsProcessing(true);
        setCurrentMessage(`Loading draft: ${series.name || 'Series'}...`);

        const game = series.games[series.games.length - 1];
        const d = game.draftState;
        const blueTeamName = TEAMS.find(t => t.id === series.blueTeamId)?.name || 'Blue Team';
        const redTeamName = TEAMS.find(t => t.id === series.redTeamId)?.name || 'Red Team';

        const mapChamps = (list: any[]) => list.map(c => c ? c.name : null);
        const mappedState = {
            blue_team: {
                name: blueTeamName,
                bans: mapChamps(d.blueBans || Array(5).fill(null)),
                picks: mapChamps(d.bluePicks || Array(5).fill(null))
            },
            red_team: {
                name: redTeamName,
                bans: mapChamps(d.redBans || Array(5).fill(null)),
                picks: mapChamps(d.redPicks || Array(5).fill(null))
            },
            current_step: d.currentStepIndex || 0,
            phase: 'complete',
            team_comp: ''
        };

        try {
            const response = await fetch(`${API_BASE}/draft/load`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(mappedState),
            });

            if (response.ok) {
                const data = await response.json();
                setDraftState(data.draft_state);

                const chatResponse = await fetch(`${API_BASE}/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: "" }),
                });

                if (chatResponse.ok) {
                    const chatData = await chatResponse.json();
                    setCurrentMessage(chatData.response);
                    if (chatData.recommendations) setRecommendations(chatData.recommendations);
                    playTTS(chatData.response);
                }
            }
        } catch (e) {
            console.error(e);
            setCurrentMessage("Failed to load draft. Please try again.");
        } finally {
            setIsProcessing(false);
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
                                playTTS(chatData.response);
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
        if (isRecording) stopRecording();
        else startRecording();
    };

    const resetDraft = async () => {
        setSelectionMode(true);
        setCurrentMessage("Hey coach, Let's review one of your recent Drafts.");
        setRecentDrafts(getSavedSeries().sort((a, b) => b.timestamp - a.timestamp).slice(0, 3));
    };

    const getChampId = (name: string) => {
        const specialCases: Record<string, string> = {
            "Lee Sin": "LeeSin", "Miss Fortune": "MissFortune", "Twisted Fate": "TwistedFate",
            "Dr. Mundo": "DrMundo", "Jarvan IV": "JarvanIV", "Rek'Sai": "RekSai",
            "Kha'Zix": "Khazix", "Vel'Koz": "VelKoz", "Cho'Gath": "Chogath",
            "Kog'Maw": "KogMaw", "Kai'Sa": "Kaisa", "Bel'Veth": "Belveth", "K'Sante": "KSante",
            "Wukong": "MonkeyKing"
        };
        return specialCases[name] || name?.replace(/[^a-zA-Z0-9]/g, '') || '';
    };

    const handlePickSwap = async (side: 'blue' | 'red', index: number, champion: string) => {
        // 1. Optimistically update local state
        const updatedState = { ...draftState };
        const teamKey = side === 'blue' ? 'blue_team' : 'red_team';
        updatedState[teamKey].picks[index] = champion;
        setDraftState(updatedState);

        // 2. Sync with backend
        try {
            // Re-construct the full draft state object required by backend load
            // We reuse handleSelectDraft logic's payload format more or less
            // But here we just send the updatedState which matches the DraftState interface
            // The backend /draft/load endpoint expects the structure we have in `updatedState` 
            // (blue_team, red_team, current_step, phase) if we align it. 
            // Wait, server.py /draft/load expects { blue_team, red_team ... }. 
            // Our local `draftState` matches that structure exactly.

            const response = await fetch(`${API_BASE}/draft/load`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedState),
            });

            if (response.ok) {
                // Optionally fetch new recommendations or chat context after swap
                // For now, let's just confirm it loaded.
                console.log("Draft state synced with backend.");

                // Trigger a short "thinking" update to get new recommendations based on swap?
                // Let's call chat with empty message to refresh context/recommendations
                const chatResponse = await fetch(`${API_BASE}/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: `I swapped a pick to ${champion}. What do you think?` }),
                });

                if (chatResponse.ok) {
                    const chatData = await chatResponse.json();
                    setCurrentMessage(chatData.response);
                    if (chatData.recommendations) setRecommendations(chatData.recommendations);
                    // playTTS(chatData.response); // Optional: speak the reaction
                }
            }
        } catch (error) {
            console.error("Failed to sync swap:", error);
            setCurrentMessage("Failed to sync the swap with the coach.");
        }
    };

    return (
        <main className="h-screen bg-[#0a0b10] flex flex-col relative overflow-hidden">
            <audio ref={audioRef} className="hidden" />

            {/* Header */}
            <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/20 backdrop-blur-md">
                <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                    <span className="text-sm font-medium">Back</span>
                </Link>

                <h1 className="text-xl font-bold text-white uppercase tracking-widest flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    Draft <span className="text-amber-400">Coach</span>
                </h1>

                <div className="flex items-center gap-3">
                    <button
                        onClick={resetDraft}
                        className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                        title="Pick New Draft"
                    >
                        <LayoutGrid className="w-5 h-5" />
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

            {/* Content Plane */}
            <div className="flex-1 flex flex-col relative z-10 min-h-0">
                <AnimatePresence mode="wait">
                    {selectionMode ? (
                        <motion.div
                            key="selection"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="flex-1 flex flex-col items-center justify-center gap-8 w-full max-w-7xl mx-auto p-8"
                        >
                            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Select a Draft to Review</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                                {recentDrafts.map((series) => {
                                    const blueTeam = TEAMS.find(t => t.id === series.blueTeamId);
                                    const redTeam = TEAMS.find(t => t.id === series.redTeamId);
                                    const lastGame = series.games[series.games.length - 1];
                                    const draft = lastGame?.draftState || { bluePicks: [], redPicks: [], blueBans: [], redBans: [] };

                                    return (
                                        <motion.button
                                            key={series.id}
                                            onClick={() => handleSelectDraft(series)}
                                            whileHover={{ scale: 1.02, y: -5 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center gap-6 hover:bg-white/10 hover:border-amber-500/50 transition-all group shadow-2xl relative overflow-hidden"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                            {/* Header */}
                                            <div className="flex items-center gap-4 relative z-10">
                                                {blueTeam && <TeamLogo team={blueTeam} className="w-12 h-12 rounded-lg shadow-lg" />}
                                                <span className="text-xl font-black text-white/20 italic">VS</span>
                                                {redTeam && <TeamLogo team={redTeam} className="w-12 h-12 rounded-lg shadow-lg" />}
                                            </div>

                                            {/* Teams */}
                                            <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors relative z-10">
                                                {series.name || `${blueTeam?.shortName} vs ${redTeam?.shortName}`}
                                            </h3>

                                            {/* Picks Strip */}
                                            <div className="flex gap-4 relative z-10">
                                                {/* Blue Picks */}
                                                <div className="flex gap-0.5">
                                                    {draft.bluePicks.slice(0, 5).map((p: any, i: number) => (
                                                        <div key={`bp-${i}`} className="w-8 h-8 bg-blue-900/40 rounded border border-blue-500/30 overflow-hidden">
                                                            {p && (
                                                                <img
                                                                    src={`https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/champion/${getChampId(p.name)}.png`}
                                                                    className="w-full h-full object-cover scale-110"
                                                                    alt={p.name}
                                                                />
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="w-px h-8 bg-white/10" />

                                                {/* Red Picks */}
                                                <div className="flex gap-0.5">
                                                    {draft.redPicks.slice(0, 5).map((p: any, i: number) => (
                                                        <div key={`rp-${i}`} className="w-8 h-8 bg-red-900/40 rounded border border-red-500/30 overflow-hidden">
                                                            {p && (
                                                                <img
                                                                    src={`https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/champion/${getChampId(p.name)}.png`}
                                                                    className="w-full h-full object-cover scale-110"
                                                                    alt={p.name}
                                                                />
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Bans Small */}
                                            <div className="flex gap-8 relative z-10 opacity-60 scale-90">
                                                <div className="flex gap-0.5">
                                                    {draft.blueBans.slice(0, 5).map((b: any, i: number) => (
                                                        <div key={`bb-${i}`} className="w-5 h-5 bg-black/40 rounded border border-white/10 overflow-hidden grayscale relative">
                                                            {b && (
                                                                <img src={`https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/champion/${getChampId(b.name)}.png`} className="w-full h-full object-cover" alt="" />
                                                            )}
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <div className="w-full h-[1px] bg-red-500/50 rotate-45" />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="flex gap-0.5">
                                                    {draft.redBans.slice(0, 5).map((b: any, i: number) => (
                                                        <div key={`rb-${i}`} className="w-5 h-5 bg-black/40 rounded border border-white/10 overflow-hidden grayscale relative">
                                                            {b && (
                                                                <img src={`https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/champion/${getChampId(b.name)}.png`} className="w-full h-full object-cover" alt="" />
                                                            )}
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <div className="w-full h-[1px] bg-red-500/50 rotate-45" />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <span className="text-xs text-gray-500 mt-2 relative z-10 font-mono uppercase tracking-widest">
                                                {new Date(series.timestamp).toLocaleDateString()}
                                            </span>
                                        </motion.button>
                                    );
                                })}
                            </div>
                            {recentDrafts.length === 0 && (
                                <p className="text-gray-500">No recent drafts found. Create one in the Library!</p>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="draft"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3 }}
                            className="flex-1 w-full h-full min-h-0"
                        >
                            <DraftBoard
                                blueTeam={draftState.blue_team}
                                redTeam={draftState.red_team}
                                currentStep={draftState.current_step}
                                phase={draftState.phase}
                                ddragonVersion={ddragonVersion}
                                recommendations={recommendations}
                                onPickSwap={handlePickSwap}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom Voice Interface */}
            <div className="relative z-20 flex flex-col items-center gap-4 pb-6 pt-2 bg-gradient-to-t from-black/80 to-transparent">
                <AnimatePresence mode="wait">
                    {userTranscript && (
                        <motion.div
                            key="transcript"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="absolute bottom-full mb-4 max-w-xl text-center px-4 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full backdrop-blur-md"
                        >
                            <p className="text-blue-300 text-xs italic truncate">
                                "{userTranscript}"
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentMessage}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="max-w-3xl text-center px-8 py-3 bg-black/40 border border-white/10 rounded-2xl backdrop-blur-md shadow-2xl"
                    >
                        <p className="text-white/90 text-lg font-medium leading-relaxed">
                            {isProcessing ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" />
                                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                                </span>
                            ) : currentMessage}
                        </p>
                    </motion.div>
                </AnimatePresence>

                <div className="flex items-center gap-4">
                    <motion.button
                        onClick={handleMicClick}
                        disabled={isProcessing}
                        whileHover={{ scale: isProcessing ? 1 : 1.05 }}
                        whileTap={{ scale: isProcessing ? 1 : 0.95 }}
                        className={`
                            relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300
                            ${isRecording
                                ? 'bg-red-500 shadow-[0_0_40px_rgba(239,68,68,0.6)]'
                                : isProcessing
                                    ? 'bg-amber-600 shadow-[0_0_30px_rgba(245,158,11,0.4)]'
                                    : 'bg-white hover:bg-gray-200 shadow-[0_0_30px_rgba(255,255,255,0.2)]'
                            }
                            ${isProcessing ? 'cursor-wait' : 'cursor-pointer'}
                        `}
                    >
                        <div className="relative z-10">
                            {isProcessing ? (
                                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : isRecording ? (
                                <Square className="w-6 h-6 text-white fill-white" />
                            ) : (
                                <Mic className="w-6 h-6 text-black" />
                            )}
                        </div>
                    </motion.button>
                </div>
            </div>

            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute top-[-30%] left-[-20%] w-[70%] h-[70%] bg-blue-900/10 rounded-full blur-[200px]" />
                <div className="absolute bottom-[-30%] right-[-20%] w-[70%] h-[70%] bg-red-900/10 rounded-full blur-[200px]" />
            </div>
        </main>
    );
}
