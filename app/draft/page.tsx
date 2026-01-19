'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
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
import { ArrowLeft, Brain, Cpu, Power, Users, Lock as LockIcon, Loader2, RefreshCw, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { TeamLogo } from '@/components/ui/TeamLogo';
import { Champion, getChampions } from '@/lib/api/ddragon';
import { getScoutingReport, ScoutingReportData } from '@/lib/data/scouting';

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
            </div>

            {/* Center Status - AI Button */}
            <div className="absolute left-1/2 top-4 -translate-x-1/2 flex items-center gap-4 pointer-events-auto">
                {isStarted && viewMode === 'DRAFT' && (
                    <AIAssistantButton isActive={aiMode} onClick={() => setAiMode(!aiMode)} />
                )}
                {isStarted && <IntelligenceReportButton isActive={false} onClick={onOpenReport} />}
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-4 pointer-events-auto">
                <div className="w-px h-4 bg-white/10" />
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
    const blueTournamentId = searchParams.get('blueTournament');
    const redTournamentId = searchParams.get('redTournament');
    const folderId = searchParams.get('folderId'); // Get folderId

    const [blueTeam, setBlueTeam] = useState(() => {
        const team = TEAMS.find(t => t.id === blueTeamId) || TEAMS[0];
        const roles: ('TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT')[] = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'];
        const placeholders = roles.map(role => ({
            id: `blue-placeholder-${role}`,
            nickname: `Select ${role}`,
            role
        }));
        return { ...team, players: placeholders };
    });

    const [redTeam, setRedTeam] = useState(() => {
        const team = TEAMS.find(t => t.id === redTeamId) || (TEAMS[1] || TEAMS[0]);
        const roles: ('TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT')[] = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'];
        const placeholders = roles.map(role => ({
            id: `red-placeholder-${role}`,
            nickname: `Select ${role}`,
            role
        }));
        return { ...team, players: placeholders };
    });
    const [blueReport, setBlueReport] = useState<ScoutingReportData | null>(null);
    const [redReport, setRedReport] = useState<ScoutingReportData | null>(null);
    const [blueAvailablePlayers, setBlueAvailablePlayers] = useState<Player[]>([]);
    const [redAvailablePlayers, setRedAvailablePlayers] = useState<Player[]>([]);
    const [playersLocked, setPlayersLocked] = useState(false);

    const { startDraft, resetDraft, currentStepIndex, selectChampion, unavailableChampionIds, blueBans, redBans, bluePicks, redPicks, currentStep, isStarted } = useDraft();
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

    // AI Auto-Pilot State
    const [blueAiEnabled, setBlueAiEnabled] = useState(false);
    const [redAiEnabled, setRedAiEnabled] = useState(false);
    const [allChampions, setAllChampions] = useState<Champion[]>([]);

    useEffect(() => {
        getChampions().then(setAllChampions);
    }, []);

    // Fetch Scouting Reports and Players
    useEffect(() => {
        async function fetchReports() {
            if (blueTeamId) {
                const report = await getScoutingReport(blueTeamId, blueTournamentId || undefined);
                if (!('message' in report)) {
                    setBlueReport(report);
                    // Extract players from report
                    const allAvailablePlayers = Object.keys(report.player_stats_grouped).map((playerName, i) => ({
                        id: `blue-available-${playerName}-${i}`,
                        nickname: playerName,
                        role: 'TOP' as any
                    }));
                    setBlueAvailablePlayers(allAvailablePlayers);
                } else {
                    // Fallback to default roster if report failed
                    const defaultTeam = TEAMS.find(t => t.id === blueTeamId);
                    if (defaultTeam && defaultTeam.players) {
                        setBlueAvailablePlayers(defaultTeam.players);
                    }
                }
            } else {
                // Fallback if no ID (shouldn't happen often)
                const defaultTeam = TEAMS[0];
                if (defaultTeam && defaultTeam.players) {
                    setBlueAvailablePlayers(defaultTeam.players);
                }
            }
            if (redTeamId) {
                const report = await getScoutingReport(redTeamId, redTournamentId || undefined);
                if (!('message' in report)) {
                    setRedReport(report);
                    // Extract players from report
                    const allAvailablePlayers = Object.keys(report.player_stats_grouped).map((playerName, i) => ({
                        id: `red-available-${playerName}-${i}`,
                        nickname: playerName,
                        role: 'TOP' as any
                    }));
                    setRedAvailablePlayers(allAvailablePlayers);
                } else {
                    // Fallback to default roster if report failed
                    const defaultTeam = TEAMS.find(t => t.id === redTeamId);
                    if (defaultTeam && defaultTeam.players) {
                        setRedAvailablePlayers(defaultTeam.players);
                    }
                }
            } else {
                // Fallback
                const defaultTeam = TEAMS.find(t => t.id === redTeamId) || TEAMS[1];
                if (defaultTeam && defaultTeam.players) {
                    setRedAvailablePlayers(defaultTeam.players);
                }
            }
        }
        fetchReports();
    }, [blueTeamId, redTeamId, blueTournamentId, redTournamentId]);

    // AI State (Lifted from AIFocusMode)
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    const [aiActionMessage, setAiActionMessage] = useState<string | null>(null); // New state for visual feedback
    const lastProcessedStep = useRef<number>(-1);

    // AI Fetch Function
    const fetchPredictions = async () => {
        if (!currentStep) return;

        // Prevent double fetch if already loading or already fetched for this step
        if (isAiLoading || lastProcessedStep.current === currentStepIndex) return;

        setIsAiLoading(true);
        setAiError(null);
        try {
            const payload = {
                currentStepIndex,
                blueBans,
                redBans,
                bluePicks,
                redPicks,
                blueTeam: {
                    name: blueTeam.shortName || blueTeam.name,
                    players: blueTeam.players,
                    ...(blueReport || {})
                },
                redTeam: {
                    name: redTeam.shortName || redTeam.name,
                    players: redTeam.players,
                    ...(redReport || {})
                }
            };

            const res = await fetch('http://localhost:5001/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("AI Server Error");

            const data = await res.json();
            setRecommendations(data.recommendations || []);
            lastProcessedStep.current = currentStepIndex; // Mark as processed
        } catch (err) {
            console.error(err);
            setAiError("Failed to connect to AI Server.");
        } finally {
            setIsAiLoading(false);
        }
    };

    // Effect: Clear recommendations on step change
    useEffect(() => {
        if (lastProcessedStep.current !== currentStepIndex) {
            setRecommendations([]);
            setAiError(null);
        }
    }, [currentStepIndex]);

    // Effect: Auto-Fetch for Visual Mode OR Auto-Pick Mode
    useEffect(() => {
        if (!isStarted || !currentStep) return;

        const isBlueTurn = currentStep.side === 'blue';
        const isRedTurn = currentStep.side === 'red';
        const isAiActiveForTurn = (isBlueTurn && blueAiEnabled) || (isRedTurn && redAiEnabled);

        // Fetch if Visual Mode is OPEN or Takeover is ACTIVE, and we haven't fetched yet
        if ((aiMode || isAiActiveForTurn) && lastProcessedStep.current !== currentStepIndex && !isAiLoading) {
            fetchPredictions();
        }
    }, [currentStepIndex, aiMode, blueAiEnabled, redAiEnabled, isStarted, currentStep, isAiLoading]);


    // Effect: Auto-Pick Execution (Takeover)
    useEffect(() => {
        if (!isStarted || !currentStep || !allChampions.length) return;

        const isBlueTurn = currentStep.side === 'blue';
        const isRedTurn = currentStep.side === 'red';

        // Check if Takeover is enabled for current side
        if ((isBlueTurn && blueAiEnabled) || (isRedTurn && redAiEnabled)) {

            // If we have recommendations, PICK IMMEDIATELY
            if (recommendations.length > 0) {
                const topRec = recommendations[0];
                const champName = typeof topRec === 'string' ? topRec : topRec.championName;

                const validPick = allChampions.find(c => c.name.toLowerCase() === champName.toLowerCase());

                if (validPick && !unavailableChampionIds.has(validPick.id)) {
                    // Feedback: Show message
                    setAiActionMessage(`AI Taking Over: ${validPick.name}...`);

                    // Execute Pick
                    const timer = setTimeout(() => {
                        selectChampion(validPick);
                        setAiActionMessage(null); // Clear message
                    }, 1500); // Small delay for visual clarity
                    return () => clearTimeout(timer);
                }
            }
        }
    }, [currentStep, currentStepIndex, isStarted, blueAiEnabled, redAiEnabled, allChampions, unavailableChampionIds, recommendations]);
    const [showReport, setShowReport] = useState(false); // Report Modal State
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
    const [selectedTeamMeta, setSelectedTeamMeta] = useState<{ name: string, color: string, report: ScoutingReportData | null } | null>(null);

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

    useEffect(() => {
        if (!isStarted) {
            setViewMode('SCOUTING');
            setPlayersLocked(false);
        }
    }, [isStarted]);

    const handlePlayerClick = (player: Player, team: typeof blueTeam, side: 'blue' | 'red') => {
        if (!playersLocked) {
            // Player selection logic - Clicking a player in rosters fills the 5 slots
            const report = side === 'blue' ? blueReport : redReport;
            if (report) {
                const currentTeam = side === 'blue' ? blueTeam : redTeam;

                // Get currently selected nicknames on this team
                const currentNicknames = currentTeam.players?.map(p => p.nickname) || [];

                // If the player clicked is already in the roster, remove them (Deselect)
                if (currentNicknames.includes(player.nickname)) {
                    if (side === 'blue') {
                        setBlueTeam(prev => {
                            const newPlayers = [...(prev.players || [])];
                            const index = newPlayers.findIndex(p => p.nickname === player.nickname);
                            if (index !== -1) {
                                const roles: ('TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT')[] = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'];
                                newPlayers[index] = {
                                    id: `blue-placeholder-${roles[index]}`,
                                    nickname: `Select ${roles[index]}`,
                                    role: roles[index]
                                };
                            }
                            return { ...prev, players: newPlayers };
                        });
                    } else {
                        setRedTeam(prev => {
                            const newPlayers = [...(prev.players || [])];
                            const index = newPlayers.findIndex(p => p.nickname === player.nickname);
                            if (index !== -1) {
                                const roles: ('TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT')[] = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'];
                                newPlayers[index] = {
                                    id: `red-placeholder-${roles[index]}`,
                                    nickname: `Select ${roles[index]}`,
                                    role: roles[index]
                                };
                            }
                            return { ...prev, players: newPlayers };
                        });
                    }
                    return;
                }

                // Create a new player object for the roster
                const newPlayer: Player = {
                    id: `${side}-${player.nickname}-${Date.now()}`,
                    nickname: player.nickname,
                    role: 'TOP' // Will be re-assigned based on index
                };

                // Find the first slot that hasn't been filled with a real player
                // Placeholder players have ids like 'blue-placeholder-TOP'

                if (side === 'blue') {
                    setBlueTeam(prev => {
                        const newPlayers = [...(prev.players || [])];
                        const roles: ('TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT')[] = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'];

                        // Find first placeholder slot
                        const firstPlaceholderIndex = newPlayers.findIndex(p => p.id.includes('placeholder'));

                        if (firstPlaceholderIndex !== -1) {
                            newPlayers[firstPlaceholderIndex] = {
                                ...newPlayer,
                                role: roles[firstPlaceholderIndex]
                            };
                        }

                        return { ...prev, players: newPlayers };
                    });
                } else {
                    setRedTeam(prev => {
                        const newPlayers = [...(prev.players || [])];
                        const roles: ('TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT')[] = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'];
                        const firstPlaceholderIndex = newPlayers.findIndex(p => p.id.includes('placeholder'));

                        if (firstPlaceholderIndex !== -1) {
                            newPlayers[firstPlaceholderIndex] = {
                                ...newPlayer,
                                role: roles[firstPlaceholderIndex]
                            };
                        }
                        return { ...prev, players: newPlayers };
                    });
                }
            }
            return;
        }
        setSelectedPlayer(player);
        setSelectedTeamMeta({ name: team.shortName, color: team.color, report: side === 'blue' ? blueReport : redReport });
    };

    const handleInitializeDraft = () => {
        setPlayersLocked(true);
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

    const isReadyToStart =
        ((blueTeam.players?.filter(p => !p.id.includes('placeholder')).length || 0) >= 5) &&
        ((redTeam.players?.filter(p => !p.id.includes('placeholder')).length || 0) >= 5);

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
                report={selectedTeamMeta?.report || null}
            />



            {/* Header */}
            <DraftHeader
                isStarted={isStarted}
                viewMode={viewMode}
                aiMode={aiMode}
                setAiMode={setAiMode}
                onOpenReport={() => setShowReport(true)}
            />

            {/* AI Action Toast Removed */}

            <AnimatePresence>
                {showReport && (
                    <IntelligenceReportModal
                        onClose={() => setShowReport(false)}
                        blueTeam={blueTeam}
                        redTeam={redTeam}
                        blueReport={blueReport}
                        redReport={redReport}
                    />
                )}
            </AnimatePresence>

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
                                <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">{blueTeam.shortName}</h2>
                                <div className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.3em]">Blue Side</div>
                            </div>

                            <div className="flex-1" />
                            <div className="flex flex-col items-end gap-1">
                                <button
                                    onClick={() => setBlueAiEnabled(!blueAiEnabled)}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all",
                                        blueAiEnabled
                                            ? "bg-blue-500 text-white border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                                            : "bg-white/5 border-white/10 text-gray-500 hover:bg-white/10"
                                    )}
                                >
                                    <Brain className="w-3 h-3" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">
                                        {blueAiEnabled ? "AI Active" : "AI Takeover"}
                                    </span>
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-0.5">
                            {blueTeam.players?.map((p, idx) => (
                                <div key={p.id} className="flex-1 flex flex-col justify-center">
                                    <PlayerCard
                                        player={p}
                                        teamColor={blueTeam.color}
                                        side="blue"
                                        onClick={() => handlePlayerClick(p, blueTeam, 'blue')}
                                        onRemove={() => handlePlayerClick(p, blueTeam, 'blue')}
                                        isSelected={selectedPlayer?.id === p.id}
                                        pickedChampion={bluePicks[idx]}
                                        isActiveTurn={isStarted && isBlueTurn && isPickPhase && currentPickIndex === idx}
                                        isLocked={playersLocked}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CENTER COLUMN: DRAFT BOARD (6 Cols) - Perfectly Centered */}
                    <div className="col-span-12 xl:col-span-6 flex flex-col h-full bg-[#0C0E14] rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden relative ring-1 ring-white/5">

                        {/* 1. Header: Scoreboard / Status */}
                        <div className="h-auto bg-gradient-to-b from-white/5 to-transparent border-b border-white/5 flex flex-col relative z-20">
                            <div className="h-24 flex items-center justify-between px-8">
                                {/* Blue Bans */}
                                <div className="flex gap-2">
                                    {blueBans.map((champ, i) => (
                                        <BanSlot key={`blue-ban-${i}`} champion={champ} side="blue" isActive={isStarted && isBlueTurn && !isPickPhase && currentStep?.index === i} />
                                    ))}
                                </div>

                                {/* Center Status Display */}
                                <div className="flex flex-col items-center">
                                    {!isStarted ? (
                                        <button
                                            onClick={handleInitializeDraft}
                                            disabled={!isReadyToStart}
                                            className={cn(
                                                "px-8 py-2 bg-white text-black font-black uppercase tracking-widest text-xs rounded-full transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]",
                                                isReadyToStart
                                                    ? "hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] cursor-pointer"
                                                    : "opacity-30 cursor-not-allowed grayscale"
                                            )}
                                        >
                                            Start Draft
                                        </button>
                                    ) : (
                                        <div className="flex flex-col items-center gap-1">
                                            <div className="text-xs font-bold text-gray-400 tracking-[0.2em] uppercase">
                                                {playersLocked ? "Current Turn" : "Preparation Phase"}
                                            </div>
                                            {playersLocked ? (
                                                <div className={cn(
                                                    "text-2xl font-black italic uppercase tracking-wider animate-pulse",
                                                    currentStep?.side === 'blue' ? "text-blue-400" : "text-red-500"
                                                )}>
                                                    {currentStep?.side} {currentStep?.action}
                                                </div>
                                            ) : (
                                                <div className="text-xl font-black italic uppercase tracking-wider text-primary">
                                                    Select Starters
                                                </div>
                                            )}
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

                            {/* Fearless Ban Strip - Relocated below current bans */}
                            <FearlessBanStrip />
                        </div>

                        {/* 2. Main Content Area */}
                        <div className="flex-1 relative bg-grid-pattern min-h-0 flex flex-col">
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                                {viewMode === 'SCOUTING' ? (
                                    (!blueReport || !redReport) ? (
                                        <div className="flex flex-col items-center justify-center h-full space-y-6 animate-pulse">
                                            <Loader2 className="w-16 h-16 text-cyan-500 animate-spin" />
                                            <div className="text-center">
                                                <h2 className="text-2xl font-black text-white uppercase tracking-widest">Accessing Scouting Database</h2>
                                                <p className="text-cyan-500 text-sm font-bold uppercase tracking-widest mt-2">Retrieving Player Statistics & Champion Pools...</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="max-w-7xl mx-auto w-full h-full flex flex-col justify-center">
                                            <div className="text-center mb-12">
                                                <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter glow-text">Team Rosters</h2>
                                                <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mt-2">Confirm Active Lineups</p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-12 items-start px-12">
                                                {/* Blue Team Roster */}
                                                <div className="space-y-3">
                                                    {blueAvailablePlayers.map((p) => {
                                                        const isSelectedOnBlue = blueTeam.players?.some(selected => selected.nickname === p.nickname);
                                                        const isSelectedOnRed = redTeam.players?.some(selected => selected.nickname === p.nickname);

                                                        return (
                                                            <button
                                                                key={p.id}
                                                                onClick={() => handlePlayerClick(p, blueTeam, 'blue')}
                                                                disabled={playersLocked || isSelectedOnRed}
                                                                className={cn(
                                                                    "w-full flex items-center justify-between p-4 rounded-xl border transition-all group relative overflow-hidden",
                                                                    isSelectedOnBlue
                                                                        ? "bg-gradient-to-r from-blue-600/20 to-blue-900/10 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                                                                        : "bg-white/5 border-white/5 hover:border-blue-500/30 hover:bg-white/10"
                                                                )}
                                                            >
                                                                <div className="flex items-center gap-4 relative z-10">
                                                                    <div className={cn(
                                                                        "w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs transition-colors",
                                                                        isSelectedOnBlue ? "bg-blue-500 text-white" : "bg-white/10 text-gray-500"
                                                                    )}>
                                                                        {isSelectedOnBlue ? <Check className="w-4 h-4" /> : p.role?.charAt(0) || "?"}
                                                                    </div>
                                                                    <span className={cn(
                                                                        "transition-colors",
                                                                        isSelectedOnBlue
                                                                            ? "text-white font-black uppercase italic tracking-tighter text-xl"
                                                                            : "text-gray-400 font-bold text-lg group-hover:text-white"
                                                                    )}>{p.nickname}</span>
                                                                </div>

                                                                {isSelectedOnRed && (
                                                                    <div className="flex items-center gap-2 text-red-500 text-xs font-bold uppercase tracking-widest">
                                                                        <LockIcon className="w-3 h-3" />
                                                                        Opponent
                                                                    </div>
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>

                                                {/* Red Team Roster */}
                                                <div className="space-y-3">
                                                    {redAvailablePlayers.map((p) => {
                                                        const isSelectedOnBlue = blueTeam.players?.some(selected => selected.nickname === p.nickname);
                                                        const isSelectedOnRed = redTeam.players?.some(selected => selected.nickname === p.nickname);

                                                        return (
                                                            <button
                                                                key={p.id}
                                                                onClick={() => handlePlayerClick(p, redTeam, 'red')}
                                                                disabled={playersLocked || isSelectedOnBlue}
                                                                className={cn(
                                                                    "w-full flex items-center justify-between p-4 rounded-xl border transition-all group relative overflow-hidden flex-row-reverse",
                                                                    isSelectedOnRed
                                                                        ? "bg-gradient-to-l from-red-600/20 to-red-900/10 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.1)]"
                                                                        : "bg-white/5 border-white/5 hover:border-red-500/30 hover:bg-white/10"
                                                                )}
                                                            >
                                                                <div className="flex items-center gap-4 relative z-10 flex-row-reverse">
                                                                    <div className={cn(
                                                                        "w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs transition-colors",
                                                                        isSelectedOnRed ? "bg-red-500 text-white" : "bg-white/10 text-gray-500"
                                                                    )}>
                                                                        {isSelectedOnRed ? <Check className="w-4 h-4" /> : p.role?.charAt(0) || "?"}
                                                                    </div>
                                                                    <span className={cn(
                                                                        "transition-colors",
                                                                        isSelectedOnRed
                                                                            ? "text-white font-black uppercase italic tracking-tighter text-xl"
                                                                            : "text-gray-400 font-bold text-lg group-hover:text-white"
                                                                    )}>{p.nickname}</span>
                                                                </div>

                                                                {isSelectedOnBlue && (
                                                                    <div className="flex items-center gap-2 text-blue-500 text-xs font-bold uppercase tracking-widest flex-row-reverse">
                                                                        <LockIcon className="w-3 h-3" />
                                                                        Opponent
                                                                    </div>
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Unified Start Button Removed - Functionality moved to Header */}
                                        </div>
                                    )
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
                                {aiMode && (
                                    <AIFocusMode
                                        blueTeam={blueTeam}
                                        redTeam={redTeam}
                                        blueReport={blueReport}
                                        redReport={redReport}
                                        recommendations={recommendations}
                                        isLoading={isAiLoading}
                                        error={aiError}
                                        isTakeover={(currentStep?.side === 'blue' && blueAiEnabled) || (currentStep?.side === 'red' && redAiEnabled)}
                                        aiActionMessage={aiActionMessage}
                                    />
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: RED TEAM (3 Cols) */}
                    <div className="col-span-3 hidden xl:flex flex-col h-full bg-slate-900/20 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-md transition-colors duration-500"
                        style={{ borderColor: isRedTurn ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255,255,255,0.05)' }}
                    >
                        <div className="p-4 border-b border-white/5 flex items-center justify-between gap-4 bg-gradient-to-l from-red-900/20 to-transparent">
                            <div className="flex flex-col items-start gap-1">
                                <button
                                    onClick={() => setRedAiEnabled(!redAiEnabled)}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all",
                                        redAiEnabled
                                            ? "bg-red-500 text-white border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                                            : "bg-white/5 border-white/10 text-gray-500 hover:bg-white/10"
                                    )}
                                >
                                    <Brain className="w-3 h-3" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">
                                        {redAiEnabled ? "AI Active" : "AI Takeover"}
                                    </span>
                                </button>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">{redTeam.shortName}</h2>
                                    <div className="text-[10px] font-bold text-red-500 uppercase tracking-[0.3em]">Red Side</div>
                                </div>
                                <TeamLogo team={redTeam} className="w-12 h-12 rounded-xl shadow-lg" />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-0.5">
                            {redTeam.players?.map((p, idx) => (
                                <div key={p.id} className="flex-1 flex flex-col justify-center">
                                    <PlayerCard
                                        player={p}
                                        teamColor={redTeam.color}
                                        side="red"
                                        onClick={() => handlePlayerClick(p, redTeam, 'red')}
                                        onRemove={() => handlePlayerClick(p, redTeam, 'red')}
                                        isSelected={selectedPlayer?.id === p.id}
                                        pickedChampion={redPicks[idx]}
                                        isActiveTurn={isStarted && isRedTurn && isPickPhase && currentPickIndex === idx}
                                        isLocked={playersLocked}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </main >
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
