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

type ViewMode = 'SCOUTING' | 'DRAFT';

function DraftHeader() {
    const { format, blueWins, redWins, currentGameIndex } = useSeries();
    const { isStarted, currentStep } = useDraft();

    return (
        <header className="h-[48px] bg-[#090A0F] border-b border-white/5 flex items-center justify-between px-6 shrink-0 relative z-30">
            <div className="flex items-center gap-4">
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

            {/* Center Status */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-6">
                <div className={cn(
                    "px-3 py-1 rounded text-[10px] font-bold uppercase tracking-[0.2em] border",
                    isStarted
                        ? "bg-red-500/10 text-red-500 border-red-500/20 animate-pulse"
                        : "bg-gray-800 text-gray-500 border-white/5"
                )}>
                    {isStarted ? "Live" : "Ready"}
                </div>

                <div className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                    {currentStep ? (
                        <>
                            <span className={cn(currentStep.side === 'blue' ? "text-primary" : "text-red-500")}>
                                {currentStep.side} Team
                            </span>
                            <span className="text-gray-600">/</span>
                            <span>{currentStep.action}</span>
                        </>
                    ) : (
                        <span className="text-gray-600">Waiting for start...</span>
                    )}
                </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-4">
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

    const [viewMode, setViewMode] = useState<ViewMode>('DRAFT');
    const [aiMode, setAiMode] = useState(false);
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
    const [selectedTeamMeta, setSelectedTeamMeta] = useState<{ name: string, color: string } | null>(null);

    const blueTeam = TEAMS.find(t => t.id === blueTeamId) || TEAMS[0];
    const redTeam = TEAMS.find(t => t.id === redTeamId) || TEAMS[1];

    // Removed duplicate useDraft call

    const handlePlayerClick = (player: Player, team: typeof blueTeam) => {
        setSelectedPlayer(player);
        setSelectedTeamMeta({ name: team.name, color: team.color });
    };

    const handleInitializeDraft = () => {
        startDraft();
    };

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
        blueBans: blueBans, redBans: redBans, bluePicks: bluePicks, redPicks: redPicks,
        unavailableChampionIds: new Set([...blueBans, ...redBans, ...bluePicks, ...redPicks].filter(c => c).map(c => c!.id))
    });

    useEffect(() => {
        const formatParam = searchParams.get('format');
        if (formatParam && (formatParam === 'BO1' || formatParam === 'BO3' || formatParam === 'BO5')) {
            initializeSeries(formatParam as any);
        }
    }, [searchParams]);

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
            games: finalGames
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
        <main className="min-h-screen flex flex-col pt-0 pb-4 px-0 md:px-6 overflow-hidden max-h-screen relative bg-[#090A0F]">
            <PlayerDetailsPanel
                player={selectedPlayer}
                onClose={() => setSelectedPlayer(null)}
                teamName={selectedTeamMeta?.name || ''}
                teamColor={selectedTeamMeta?.color || ''}
            />

            {/* Game/Series Completion Overlay */}
            <AnimatePresence>
                {/* Show if draft is finished (no current step) AND we started, OR if series is complete */}
                {((isStarted && !currentStep) || isSeriesComplete) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-8"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-[#0C0E14] border border-white/10 p-8 rounded-3xl max-w-lg w-full text-center space-y-8 shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-red-500/10 opacity-50" />

                            <div className="relative z-10 space-y-4">
                                <h2 className="text-4xl font-bold text-white uppercase tracking-tighter">
                                    {isSeriesComplete ? "Series Complete" : (
                                        (games.length + 1) >= (currentFormat === 'BO1' ? 1 : currentFormat === 'BO3' ? 3 : 5)
                                            ? "Series Draft Complete"
                                            : `Game ${games.length + 1} Draft Finished`
                                    )}
                                </h2>

                                {isSeriesComplete ? (
                                    <div className="flex items-center justify-center gap-8">
                                        <div className="text-center">
                                            {/* We hide score since we don't track it anymore */}
                                            {/* <div className="text-3xl font-bold text-primary">{blueWins}</div> */}
                                            <div className="text-xl font-bold text-gray-400 uppercase">{blueTeam.shortName}</div>
                                        </div>
                                        <div className="text-gray-600 font-black text-2xl">VS</div>
                                        <div className="text-center">
                                            {/* <div className="text-3xl font-bold text-red-500">{redWins}</div> */}
                                            <div className="text-xl font-bold text-gray-400 uppercase">{redTeam.shortName}</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                        <p className="text-gray-400">Draft for Game {games.length + 1} concluded.</p>
                                        <p className="text-gray-400">
                                            {(games.length + 1) >= (currentFormat === 'BO1' ? 1 : currentFormat === 'BO3' ? 3 : 5)
                                                ? "Save results or restart this game?"
                                                : "Ready for the next match?"
                                            }
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="relative z-10 grid gap-4">
                                {isSeriesComplete ? (
                                    <button
                                        onClick={() => handleSaveSeries()}
                                        className="w-full py-4 bg-white text-black font-bold uppercase tracking-widest hover:scale-105 transition-transform rounded-xl"
                                    >
                                        Save & Review Series
                                    </button>
                                ) : (
                                    (games.length + 1) >= (currentFormat === 'BO1' ? 1 : currentFormat === 'BO3' ? 3 : 5) ? (
                                        // FINAL GAME OPTIONS
                                        <div className="grid gap-3">
                                            <button
                                                onClick={() => handleSaveSeries({ draftState: getCurrentState(), winner: null })}
                                                className="w-full py-4 bg-green-600 text-white font-bold uppercase tracking-widest hover:bg-green-500 transition-all rounded-xl shadow-lg shadow-green-900/20"
                                            >
                                                Save & Finish Series
                                            </button>
                                            <button
                                                onClick={resetDraft}
                                                className="w-full py-3 bg-white/5 text-gray-400 hover:text-white font-bold uppercase tracking-widest hover:bg-white/10 transition-colors rounded-xl text-xs"
                                            >
                                                Re-Draft Game
                                            </button>
                                        </div>
                                    ) : (
                                        // NEXT GAME OPTION
                                        <button
                                            onClick={() => handleGameComplete(null as any)}
                                            className="w-full py-4 bg-primary text-white font-bold uppercase tracking-widest hover:bg-primary/80 transition-all rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                                        >
                                            Proceed to Game {games.length + 2}
                                        </button>
                                    )
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <DraftHeader />
            <FearlessBanStrip />

            {/* Main Grid Layout - Draft UI */}
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex-1 grid grid-cols-12 gap-4 h-full min-h-0 relative z-10 pt-4"
            >
                {/* ... Columns ... */}
                <div className={cn(
                    "col-span-2 hidden md:flex flex-col gap-3 h-full overflow-y-auto no-scrollbar pt-2 pb-10 transition-colors duration-500 rounded-xl px-2",
                    isBlueTurn ? "bg-primary/5 border-primary/20 border" : "border border-transparent"
                )}>
                    {/* Blue Team Players */}
                    <div className="flex items-center gap-3 mb-4 pl-2">
                        <div className="w-8 h-8 rounded bg-primary flex items-center justify-center font-bold text-black text-xs">
                            {blueTeam.shortName}
                        </div>
                        <h2 className="text-xl font-bold">{blueTeam.name}</h2>
                    </div>
                    <div className="flex-1 flex flex-col gap-3">
                        {blueTeam.players.map((p, idx) => {
                            const isMyTurn = isStarted && isBlueTurn && isPickPhase && currentPickIndex === idx;
                            return (
                                <PlayerCard
                                    key={p.id}
                                    player={p}
                                    teamColor={blueTeam.color}
                                    side="blue"
                                    onClick={() => handlePlayerClick(p, blueTeam)}
                                    isSelected={selectedPlayer?.id === p.id}
                                    pickedChampion={bluePicks[idx]}
                                    isActiveTurn={isMyTurn}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* Center Column - Draft Board */}
                <div className="col-span-12 md:col-span-8 flex flex-col h-full bg-black/20 rounded-2xl border border-white/5 overflow-hidden shadow-2xl relative">
                    {/* Pick/Ban Header */}
                    <div className="h-[120px] shrink-0 border-b border-white/5 flex items-center justify-between px-8 bg-black/40 backdrop-blur-md relative z-10">
                        {/* Blue Bans */}
                        <div className="flex gap-2">
                            {blueBans.map((champ, i) => (
                                <BanSlot
                                    key={`blue-ban-${i}`}
                                    champion={champ}
                                    side="blue"
                                    isActive={isStarted && isBlueTurn && !isPickPhase && currentStep?.index === i}
                                />
                            ))}
                        </div>

                        <div className="flex flex-col items-center gap-1">
                            <div className="text-3xl font-bold text-gray-200 tracking-widest tabular-nums font-mono">
                                {isStarted ? "LIVE" : "READY"}
                            </div>

                            {isStarted && (
                                <button
                                    onClick={() => setViewMode(viewMode === 'DRAFT' ? 'SCOUTING' : 'DRAFT')}
                                    className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-white/5 hover:bg-white/10 rounded transition-colors text-primary border border-white/5"
                                >
                                    {viewMode === 'DRAFT' ? "View Intel" : "Return to Draft"}
                                </button>
                            )}

                            {currentStep && viewMode === 'DRAFT' ? (
                                <span className="text-xs text-primary font-bold tracking-[0.2em] uppercase mt-1 animate-pulse">
                                    {currentStep.side} {currentStep.action}
                                </span>
                            ) : (
                                !isStarted && !isSeriesComplete && <button
                                    onClick={handleInitializeDraft}
                                    className="px-6 py-2 bg-white text-black font-bold uppercase text-xs tracking-widest rounded-full hover:scale-105 transition-transform mt-2"
                                >
                                    Initialize Draft
                                </button>
                            )}
                        </div>

                        {/* Red Bans */}
                        <div className="flex gap-2">
                            {redBans.map((champ, i) => (
                                <BanSlot
                                    key={`red-ban-${i}`}
                                    champion={champ}
                                    side="red"
                                    isActive={isStarted && isRedTurn && !isPickPhase && currentStep?.index === i}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Content Area: Scouting Stats (Pre-Draft) OR Champion Grid (Live Draft) */}
                    <div className="flex-1 flex flex-col min-h-0 relative">
                        {/* Hero AI Button - Floating above grid content */}
                        {isStarted && viewMode === 'DRAFT' && <div className="absolute top-0 left-0 right-0 z-40 pointer-events-none flex justify-center pt-6">
                            <div className="pointer-events-auto">
                                <AIAssistantButton
                                    isActive={aiMode}
                                    onClick={() => setAiMode(!aiMode)}
                                />
                            </div>
                        </div>}

                        <div className="absolute inset-0 pt-4 pb-4 px-4 overflow-y-auto">
                            {!isStarted || viewMode === 'SCOUTING' ? (
                                <ScoutingStats blueTeam={blueTeam} redTeam={redTeam} />
                            ) : (
                                <div className="pt-24 h-full"> {/* Padding for AI button */}
                                    {/* Alternatives panels near grid header */}
                                    <div className="px-2 mb-3 grid grid-cols-2 gap-3">
                                        {/* Blue Alternatives */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Blue Alternatives</span>
                                            <div className="flex flex-wrap gap-1">
                                                {currentAlternatives.blue.map(ch => (
                                                    <button key={ch.id} onClick={() => removeAlternative('blue', ch.id)} className="flex items-center gap-1 px-2 py-1 rounded bg-primary/10 border border-primary/30 text-[10px] text-primary hover:bg-primary/20">
                                                        <span>{ch.name}</span>
                                                        <span className="opacity-60">×</span>
                                                    </button>
                                                ))}
                                                {currentAlternatives.blue.length < 5 && (
                                                    <button
                                                        onClick={() => setAltAddSide(altAddSide === 'blue' ? null : 'blue')}
                                                        className={cn(
                                                            "px-2 py-1 rounded border text-[10px] font-bold uppercase tracking-widest",
                                                            altAddSide === 'blue' ? "bg-primary text-white border-primary" : "bg-white/5 text-gray-400 border-white/10 hover:text-white"
                                                        )}
                                                    >
                                                        {altAddSide === 'blue' ? 'Adding…' : 'Add'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        {/* Red Alternatives */}
                                        <div className="flex items-center gap-2 justify-end">
                                            <div className="flex flex-wrap gap-1 justify-end">
                                                {currentAlternatives.red.map(ch => (
                                                    <button key={ch.id} onClick={() => removeAlternative('red', ch.id)} className="flex items-center gap-1 px-2 py-1 rounded bg-red-500/10 border border-red-500/30 text-[10px] text-red-400 hover:bg-red-500/20">
                                                        <span>{ch.name}</span>
                                                        <span className="opacity-60">×</span>
                                                    </button>
                                                ))}
                                                {currentAlternatives.red.length < 5 && (
                                                    <button
                                                        onClick={() => setAltAddSide(altAddSide === 'red' ? null : 'red')}
                                                        className={cn(
                                                            "px-2 py-1 rounded border text-[10px] font-bold uppercase tracking-widest",
                                                            altAddSide === 'red' ? "bg-red-500 text-white border-red-500" : "bg-white/5 text-gray-400 border-white/10 hover:text-white"
                                                        )}
                                                    >
                                                        {altAddSide === 'red' ? 'Adding…' : 'Add'}
                                                    </button>
                                                )}
                                            </div>
                                            <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Red Alternatives</span>
                                        </div>
                                    </div>

                                    <ChampionGrid
                                        altAddSide={altAddSide}
                                        onAddAlternative={(champ) => {
                                            if (!altAddSide) return;
                                            tryAddAlternative(altAddSide, champ);
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* AI Focus Overlay */}
                        <AnimatePresence>
                            {aiMode && <AIFocusMode blueTeam={blueTeam} redTeam={redTeam} />}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Right Column - Red Team */}
                <div className={cn(
                    "col-span-2 hidden md:flex flex-col gap-3 h-full overflow-y-auto no-scrollbar pt-2 pb-10 transition-colors duration-500 rounded-xl px-2",
                    isRedTurn ? "bg-red-500/5 border-red-500/20 border" : "border border-transparent"
                )}>
                    <div className="flex items-center justify-end gap-3 mb-4 pr-2">
                        <h2 className="text-xl font-bold text-right">{redTeam.name}</h2>
                        <div className="w-8 h-8 rounded bg-red-600 flex items-center justify-center font-bold text-white text-xs">
                            {redTeam.shortName}
                        </div>
                    </div>
                    <div className="flex-1 flex flex-col gap-3">
                        {redTeam.players.map((p, idx) => {
                            const isMyTurn = isStarted && isRedTurn && isPickPhase && currentPickIndex === idx;
                            return (
                                <PlayerCard
                                    key={p.id}
                                    player={p}
                                    teamColor={redTeam.color}
                                    side="red"
                                    onClick={() => handlePlayerClick(p, redTeam)}
                                    isSelected={selectedPlayer?.id === p.id}
                                    pickedChampion={redPicks[idx]}
                                    isActiveTurn={isMyTurn}
                                />
                            );
                        })}
                    </div>
                </div>

            </motion.div>
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
