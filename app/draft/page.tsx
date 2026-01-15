'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { TEAMS, Player } from '@/lib/data/teams';
import { PlayerCard } from '@/components/ui/PlayerCard';
import { ChampionGrid } from '@/components/features/ChampionGrid';
import { PlayerDetailsPanel } from '@/components/features/PlayerDetailsPanel';
import { BanSlot } from '@/components/features/BanSlot';
import { DraftControls } from '@/components/features/DraftControls';
import { ScoutingReport } from '@/components/features/ScoutingReport';
import { ScoutingStats } from '@/components/features/ScoutingStats';
import { DraftProvider, useDraft } from '@/lib/draft/draft-context';
import { SeriesProvider, useSeries } from '@/lib/draft/series-context';
import { saveSeries } from '@/lib/persistence/storage';
import { FearlessBanStrip } from '@/components/features/FearlessBanStrip';
import { AIAssistantButton } from '@/components/features/AIAssistantButton';
import { AIFocusMode } from '@/components/features/AIFocusMode';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { TeamLogo } from '@/components/ui/TeamLogo';

import { IntelligenceReportButton } from '@/components/features/IntelligenceReportButton';
import { IntelligenceReportModal } from '@/components/features/IntelligenceReportModal';

type ViewMode = 'SCOUTING' | 'DRAFT';

interface DraftHeaderProps {
    isStarted: boolean;
    viewMode: ViewMode;
    aiMode: boolean;
    setAiMode: (mode: boolean) => void;
    onOpenReport: () => void;
}

function DraftHeader({ isStarted, viewMode, aiMode, setAiMode, onOpenReport }: DraftHeaderProps) {
    const { format, blueWins, redWins, currentGameIndex } = useSeries();

    return (
        <header className="absolute top-0 left-0 w-full h-[48px] flex items-center justify-between px-6 z-50 pointer-events-none">
            <div className="pointer-events-auto flex items-center gap-4">
                <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">
                    <ArrowLeft className="w-3 h-3" />
                    Exit Series
                </Link>
                <div className="w-px h-4 bg-white/10" />
                <span className="text-gray-500 text-xs font-mono uppercase">
                    {format} • Game {currentGameIndex + 1}
                </span>
                {/* Scores Removed as requested */}
            </div>

            {/* Center Status - AI Button */}
            <div className="absolute left-1/2 top-4 -translate-x-1/2 flex items-center gap-4 pointer-events-auto">
                {isStarted && viewMode === 'DRAFT' && (
                    <AIAssistantButton isActive={aiMode} onClick={() => setAiMode(!aiMode)} />
                )}
                {isStarted && viewMode === 'DRAFT' && (
                    <IntelligenceReportButton isActive={false} onClick={onOpenReport} />
                )}
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-4 pointer-events-auto">
                <div className="w-px h-4 bg-white/10" />

                {/* Minimal Controls */}
                <DraftControls />
            </div>
        </header>
    );
}

function DraftPageContent() {
    const router = useRouter(); // Initialize router
    const searchParams = useSearchParams();
    const blueTeamId = searchParams.get('blue');
    const redTeamId = searchParams.get('red');
    const folderId = searchParams.get('folderId'); // Get folderId

    const blueTeam = TEAMS.find(t => t.id === blueTeamId) || TEAMS[0];
    const redTeam = TEAMS.find(t => t.id === redTeamId) || (TEAMS[1] || TEAMS[0]);

    const { startDraft, resetDraft, currentStep: draftStep, blueBans, redBans, bluePicks, redPicks, currentStep, isStarted } = useDraft();
    const {
        format: currentFormat,
        games,
        isSeriesComplete,
        blueWins,
        redWins,
        initializeSeries,
        completeGame,
        currentAlternatives,
        addAlternative,
        removeAlternative,
    } = useSeries();

    const [viewMode, setViewMode] = useState<ViewMode>('SCOUTING');
    const [aiMode, setAiMode] = useState(false);
    const [showReport, setShowReport] = useState(false); // Report Modal State
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
    const [selectedTeamMeta, setSelectedTeamMeta] = useState<{ name: string, color: string } | null>(null);

    useEffect(() => {
        const formatParam = searchParams.get('format');
        if (formatParam && (formatParam === 'BO1' || formatParam === 'BO3' || formatParam === 'BO5')) {
            if (formatParam !== currentFormat) {
                initializeSeries(formatParam as any);
            }
        }
    }, [searchParams, initializeSeries, currentFormat]);

    // Auto-close AI Mode when draft is complete
    useEffect(() => {
        if ((isStarted && !currentStep) || isSeriesComplete) {
            setAiMode(false);
        }
    }, [isStarted, currentStep, isSeriesComplete]);

    const handlePlayerClick = (player: Player, team: typeof blueTeam) => {
        setSelectedPlayer(player);
        setSelectedTeamMeta({ name: team.name, color: team.color });
    };

    const handleInitializeDraft = () => {
        startDraft();
        setViewMode('DRAFT');
    };

    const [altAddSide, setAltAddSide] = useState<'blue' | 'red' | null>(null);

    // Determine active turn for highlighting
    const isBlueTurn = currentStep?.side === 'blue';
    const isRedTurn = currentStep?.side === 'red';
    const isPickPhase = currentStep?.action === 'PICK';
    const currentPickIndex = currentStep?.index;

    // Helper to get current full draft state for saving
    const getCurrentState = () => ({
        isStarted: true,
        currentStepIndex: 20, // max
        blueBans: blueBans,
        redBans: redBans,
        bluePicks: bluePicks,
        redPicks: redPicks,
        unavailableChampionIds: new Set([...blueBans, ...redBans, ...bluePicks, ...redPicks].filter(c => c).map(c => c!.id))
    });

    const handleSaveSeries = (pendingGame?: { draftState: any, winner: 'blue' | 'red' | null }) => {
        const finalGames = pendingGame
            ? [...games, { ...pendingGame, alternatives: currentAlternatives }]
            : games;

        const seriesData = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            format: currentFormat,
            blueTeamId: blueTeam.id,
            redTeamId: redTeam.id,
            blueWins,
            redWins,
            games: finalGames,
            folderId: (folderId && folderId !== 'unfiled') ? folderId : undefined
        };
        saveSeries(seriesData as any);
        router.push('/library');
    };

    // Restore Winner Logic
    const handleGameComplete = (winner: 'blue' | 'red' | null) => {
        completeGame(winner as any, getCurrentState());
        resetDraft();
    };

    const tryAddAlternative = (side: 'blue' | 'red', champ: any) => {
        // Enforce: alternative must differ from own team picks in the same game
        const teamPicks = side === 'blue' ? bluePicks : redPicks;
        if (teamPicks.some(p => p?.id === champ.id)) return;
        // Cap of 5 enforced in context; also prevent adding if already at cap in UI
        addAlternative(side, champ);
    };

    return (
        <main className="h-screen w-full bg-[#090A0F] flex flex-col overflow-hidden relative selection:bg-primary/30">
            {/* Ambient Backgrounds - Perfectly Centered */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-0 w-[50vw] h-[50vw] bg-blue-600/5 blur-[120px] rounded-full -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-red-600/5 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />
            </div>

            <PlayerDetailsPanel
                player={selectedPlayer}
                onClose={() => setSelectedPlayer(null)}
                teamName={selectedTeamMeta?.name || ''}
                teamColor={selectedTeamMeta?.color || ''}
            />



            {/* Header */}
            <DraftHeader isStarted={isStarted} viewMode={viewMode} aiMode={aiMode} setAiMode={setAiMode} onOpenReport={() => setShowReport(true)} />

            <AnimatePresence>
                {showReport && (
                    <IntelligenceReportModal
                        onClose={() => setShowReport(false)}
                        blueTeam={blueTeam}
                        redTeam={redTeam}
                    />
                )}
            </AnimatePresence>

            {/* Fearless Ban Strip */}
            <div className="w-full border-b border-white/5 bg-black/20 backdrop-blur-sm z-20 relative">
                <FearlessBanStrip />
            </div>

            {/* MAIN CONTENT AREA - Symmetric 3-Column Layout */}
            <div className="flex-1 w-full max-w-[1920px] mx-auto p-6 relative z-10 min-h-0 flex flex-col pt-24">
                <div className="flex-1 grid grid-cols-12 gap-6 min-h-0 h-full">

                    {/* LEFT COLUMN: BLUE TEAM (3 Cols) */}
                    <div className="col-span-3 hidden xl:flex flex-col h-full bg-slate-900/20 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-md transition-colors duration-500"
                        style={{ borderColor: isBlueTurn ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255,255,255,0.05)' }}
                    >
                        <div className="p-4 border-b border-white/5 flex items-center gap-4 bg-gradient-to-r from-blue-900/20 to-transparent">
                            <TeamLogo team={blueTeam} className="w-12 h-12 rounded-xl shadow-lg" />
                            <div>
                                <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">{blueTeam.name}</h2>
                                <div className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.3em]">Blue Side</div>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-0.5">
                            {blueTeam.players.map((p, idx) => (
                                <div key={p.id} className="flex-1 flex flex-col justify-center">
                                    <PlayerCard
                                        player={p}
                                        teamColor={blueTeam.color}
                                        side="blue"
                                        onClick={() => handlePlayerClick(p, blueTeam)}
                                        isSelected={selectedPlayer?.id === p.id}
                                        pickedChampion={bluePicks[idx]}
                                        isActiveTurn={isStarted && isBlueTurn && isPickPhase && currentPickIndex === idx}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CENTER COLUMN: DRAFT BOARD (6 Cols) - Perfectly Centered */}
                    <div className="col-span-12 xl:col-span-6 flex flex-col h-full bg-[#0C0E14] rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden relative ring-1 ring-white/5">

                        {/* 1. Header: Scoreboard / Status */}
                        <div className="h-24 bg-gradient-to-b from-white/5 to-transparent border-b border-white/5 flex items-center justify-between px-8 relative z-20">
                            {/* Blue Bans */}
                            <div className="flex gap-2">
                                {blueBans.map((champ, i) => (
                                    <BanSlot key={`blue-ban-${i}`} champion={champ} side="blue" isActive={isStarted && isBlueTurn && !isPickPhase && currentStep?.index === i} />
                                ))}
                            </div>

                            {/* Center Status Display */}
                            <div className="flex flex-col items-center">
                                {!isStarted ? (
                                    <button onClick={handleInitializeDraft} className="px-8 py-2 bg-white text-black font-black uppercase tracking-widest text-xs rounded-full hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.2)]">Start Draft</button>
                                ) : (
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="text-xs font-bold text-gray-400 tracking-[0.2em] uppercase">Current Turn</div>
                                        <div className={cn(
                                            "text-2xl font-black italic uppercase tracking-wider animate-pulse",
                                            currentStep?.side === 'blue' ? "text-blue-400" : "text-red-500"
                                        )}>
                                            {currentStep?.side} {currentStep?.action}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Red Bans */}
                            <div className="flex gap-2">
                                {redBans.map((champ, i) => (
                                    <BanSlot key={`red-ban-${i}`} champion={champ} side="red" isActive={isStarted && isRedTurn && !isPickPhase && currentStep?.index === i} />
                                ))}
                            </div>
                        </div>

                        {/* 2. Main Content Area */}
                        <div className="flex-1 relative bg-grid-pattern min-h-0 flex flex-col">
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                                {viewMode === 'SCOUTING' ? (
                                    <div className="max-w-4xl mx-auto">
                                        <ScoutingStats blueTeam={blueTeam} redTeam={redTeam} />
                                    </div>
                                ) : (
                                    ((isStarted && !currentStep) || isSeriesComplete) ? (
                                        <div className="flex flex-col items-center justify-center h-full space-y-8 p-8 animate-in fade-in zoom-in duration-500">
                                            <h2 className="text-5xl font-black text-white uppercase italic tracking-tighter glow-text text-center">
                                                {isSeriesComplete ? "Series Complete" : "Drafted"}
                                            </h2>
                                            <div className="flex justify-center gap-4">
                                                <button onClick={resetDraft} className="px-8 py-4 bg-white/10 text-white font-black uppercase tracking-widest hover:bg-white/20 transition-colors rounded-xl backdrop-blur-md">Redraft</button>
                                                <button onClick={() => handleSaveSeries({ draftState: getCurrentState(), winner: null })} className="px-8 py-4 bg-white text-black font-black uppercase tracking-widest hover:scale-105 transition-transform rounded-xl">Save to Library</button>
                                                {!isSeriesComplete && (currentFormat === 'BO3' || currentFormat === 'BO5') && (
                                                    <button onClick={() => handleGameComplete(null as any)} className="px-8 py-4 bg-primary text-white font-black uppercase tracking-widest hover:scale-105 transition-transform rounded-xl shadow-lg shadow-primary/20">Next Game</button>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="min-h-0 flex flex-col h-full">
                                            {/* Simple Alternatives Strip */}
                                            <div className="flex justify-between items-center mb-4 px-2 shrink-0">
                                                <div className="flex gap-2">
                                                    {currentAlternatives.blue.map(c => (
                                                        <div key={c.id} className="w-8 h-8 rounded bg-blue-500/20 border border-blue-500/50 flex items-center justify-center text-[10px] text-blue-300 font-bold overflow-hidden cursor-pointer hover:bg-red-500/20" onClick={() => removeAlternative('blue', c.id)}>
                                                            <img src={c.image ? `https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/${c.image.full}` : ''} className="w-full h-full object-cover" />
                                                        </div>
                                                    ))}
                                                    {/* Add button logic simplified for layout rewrite */}

                                                </div>
                                                <div className="flex gap-2">

                                                    {currentAlternatives.red.map(c => (
                                                        <div key={c.id} className="w-8 h-8 rounded bg-red-500/20 border border-red-500/50 flex items-center justify-center text-[10px] text-red-300 font-bold overflow-hidden cursor-pointer hover:bg-blue-500/20" onClick={() => removeAlternative('red', c.id)}>
                                                            <img src={c.image ? `https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/${c.image.full}` : ''} className="w-full h-full object-cover" />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-h-0">
                                                <ChampionGrid
                                                    altAddSide={altAddSide}
                                                    onAddAlternative={(champ) => {
                                                        if (altAddSide) tryAddAlternative(altAddSide, champ);
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>

                            {/* AI Overlay */}
                            <AnimatePresence>
                                {aiMode && <AIFocusMode blueTeam={blueTeam} redTeam={redTeam} />}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: RED TEAM (3 Cols) */}
                    <div className="col-span-3 hidden xl:flex flex-col h-full bg-slate-900/20 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-md transition-colors duration-500"
                        style={{ borderColor: isRedTurn ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255,255,255,0.05)' }}
                    >
                        <div className="p-4 border-b border-white/5 flex items-center justify-end gap-4 bg-gradient-to-l from-red-900/20 to-transparent">
                            <div className="text-right">
                                <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">{redTeam.name}</h2>
                                <div className="text-[10px] font-bold text-red-500 uppercase tracking-[0.3em]">Red Side</div>
                            </div>
                            <TeamLogo team={redTeam} className="w-12 h-12 rounded-xl shadow-lg" />
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-0.5">
                            {redTeam.players.map((p, idx) => (
                                <div key={p.id} className="flex-1 flex flex-col justify-center">
                                    <PlayerCard
                                        player={p}
                                        teamColor={redTeam.color}
                                        side="red"
                                        onClick={() => handlePlayerClick(p, redTeam)}
                                        isSelected={selectedPlayer?.id === p.id}
                                        pickedChampion={redPicks[idx]}
                                        isActiveTurn={isStarted && isRedTurn && isPickPhase && currentPickIndex === idx}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </main>
    );
}

export default function DraftPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>}>
            <SeriesProvider>
                <DraftProvider>
                    <DraftPageContent />
                </DraftProvider>
            </SeriesProvider>
        </Suspense>
    )
}
