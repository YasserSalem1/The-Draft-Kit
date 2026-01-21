'use client';

import { useState, useEffect } from 'react';
import { getScoutingReport, ScoutingReportData } from '@/lib/data/scouting';
import { getTournaments } from '@/lib/data/drafts';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Download, FileText, TrendingUp, Target, Shield, Zap, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import sideData from '@/lib/data/side_preference_report_FULL.json';
import { LEAGUES, League } from '@/lib/data/leagues';
import LeagueCard from '../../components/LeagueCard';
import TournamentSelector from '../../components/TournamentSelector';
import TeamSelector from '../../components/TeamSelector';
import ReportDisplay from '../../components/ReportDisplay';

export default function ReportsPage() {
    const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
    const [selectedTournamentIds, setSelectedTournamentIds] = useState<string[]>([]);
    const [availableTournaments, setAvailableTournaments] = useState<{ id: string, name: string }[]>([]);
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
    const [selectedTeamName, setSelectedTeamName] = useState<string | null>(null);
    const [reportData, setReportData] = useState<ScoutingReportData | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const searchParams = useSearchParams();

    // Auto-select from URL
    useEffect(() => {
        const tId = searchParams.get('teamId');
        const tName = searchParams.get('teamName');
        const reg = searchParams.get('region');

        if (tId && tName && reg) {
            const league = LEAGUES.find(l => l.regionName === reg || l.name === reg);
            if (league) {
                // Determine league safely
                setSelectedLeague(league);

                // Fetch tournaments for this league to populate the filter, then select team
                setLoading(true);
                getTournaments(league.regionName, league.parentId)
                    .then(tournaments => {
                        setAvailableTournaments(tournaments);
                        let tIds: string[] = [];
                        if (tournaments.length > 0) {
                            const lastTournament = tournaments[tournaments.length - 1];
                            tIds = [lastTournament.id];
                            setSelectedTournamentIds(tIds);
                        }

                        // Set team selection
                        setSelectedTeamId(tId);
                        setSelectedTeamName(tName);

                        // Fetch report
                        return getScoutingReport(tId, tIds, league.regionName, league.parentId);
                    })
                    .then(data => {
                        if ('message' in data) {
                            setError(data.message);
                            setReportData(null);
                        } else {
                            setReportData(data);
                        }
                    })
                    .catch(err => {
                        setError(err.message || 'Failed to initialize report');
                    })
                    .finally(() => {
                        setLoading(false);
                    });
            }
        }
    }, [searchParams]);

    const handleSelectLeague = async (league: League) => {
        setSelectedLeague(league);
        setSelectedTournamentIds([]);
        setAvailableTournaments([]);
        setSelectedTeamId(null);
        setSelectedTeamName(null);
        setReportData(null);
        setError(null);
        setLoading(true);

        try {
            const tournaments = await getTournaments(league.regionName, league.parentId);
            setAvailableTournaments(tournaments);
            if (tournaments.length > 0) {
                // Select the last tournament by default
                const lastTournament = tournaments[tournaments.length - 1];
                setSelectedTournamentIds([lastTournament.id]);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to fetch tournaments');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectTeam = async (teamId: string, teamName: string, tournamentIds?: string[]) => {
        const tIds = tournamentIds || selectedTournamentIds;
        setSelectedTeamId(teamId);
        setSelectedTeamName(teamName);
        setLoading(true);
        setError(null);
        try {
            const data = await getScoutingReport(
                teamId,
                tIds,
                selectedLeague?.regionName,
                selectedLeague?.parentId
            ); // Fetch live data
            if ('message' in data) {
                setError(data.message);
                setReportData(null);
            } else {
                setReportData(data);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to fetch report');
            setReportData(null);
        } finally {
            setLoading(false);
        }
    };

    const toggleTournament = async (tournamentId: string) => {
        let newSelection: string[];
        if (selectedTournamentIds.includes(tournamentId)) {
            newSelection = selectedTournamentIds.filter(id => id !== tournamentId);
        } else {
            newSelection = [...selectedTournamentIds, tournamentId];
        }

        if (newSelection.length === 0) return; // Must have at least one

        setSelectedTournamentIds(newSelection);
        if (selectedTeamId && selectedTeamName) {
            await handleSelectTeam(selectedTeamId, selectedTeamName, newSelection);
        }
    };

    const currentSelectionStage = !selectedLeague
        ? 'league'
        : !selectedTeamId
            ? 'team'
            : 'report';

    if (loading) return <div className="flex justify-center items-center h-screen text-xl text-white">Loading report...</div>;
    if (error) return <div className="flex justify-center items-center h-screen text-xl text-red-600">Error: {error}</div>;

    // 1. Find the selected team in the JSON data
    // We use selectedTeamName because this is the value stored in the file (e.g., "T1")
    // 1. Smart search logic
    const teamStats = selectedTeamName
        ? sideData.find(t => {
            // Exact match (e.g., T1 === T1)
            if (t.team === selectedTeamName) return true;

            // JSON team name is longer (e.g., "Suzhou LNG Esports" contains "LNG Esports")
            if (t.team.includes(selectedTeamName)) return true;

            // Dropdown team name is longer (e.g., "GAM Esports" contains "GAM")
            if (selectedTeamName.includes(t.team)) return true;

            return false;
        })
        : null;


    // 2. Compute win rates, defaulting to zero if no data is found
    const blueWR = teamStats ? teamStats.stats.blue_side.win_rate : 0;
    const redWR = teamStats ? teamStats.stats.red_side.win_rate : 0;

    // Calculate the overall average win rate
    const totalWR = teamStats
        ? Math.round((blueWR + redWR) / 2)
        : 0;

    // Determine side preference
    const isBlueHeavy = teamStats?.preference.includes('BLUE');
    const isRedHeavy = teamStats?.preference.includes('RED');
    // -------------------------------


    return (
        <main className="min-h-screen bg-background text-foreground flex flex-col p-6 md:p-12 relative overflow-hidden">

            {/* Back to Hub */}
            <Link href="/" className="absolute top-8 left-8 text-gray-500 hover:text-white flex items-center gap-2 transition-colors z-20">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Back to Hub</span>
            </Link>

            <div className="max-w-7xl w-full mx-auto relative z-10 space-y-12">

                {/* Header Section */}
                <div className="border-b border-white/5 pb-8 mb-8">
                    <div className="mb-8">
                        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-3">
                            <span className="text-primary">Team</span> Intelligence
                        </h1>
                        <p className="text-gray-400 max-w-2xl text-lg">
                            Generate deep-dive analytical reports on team performance, draft tendencies, and strategic priorities.
                        </p>
                    </div>

                    {/* Breadcrumb Navigation */}
                    {(selectedLeague || selectedTeamName) && (
                        <div className="flex items-center gap-2 mb-4 flex-wrap">
                            {selectedLeague && (
                                <>
                                    <button
                                        onClick={() => handleSelectLeague(selectedLeague)}
                                        className="px-3 py-1.5 bg-primary/20 text-primary rounded-lg text-sm font-semibold hover:bg-primary/30 transition-colors"
                                    >
                                        {selectedLeague.name}
                                    </button>
                                    {selectedTeamName && <span className="text-gray-500 text-xs">→</span>}
                                </>
                            )}
                            {selectedTeamName && (
                                <span className="px-3 py-1.5 bg-surface-light/50 text-gray-300 rounded-lg text-sm font-medium">
                                    {selectedTeamName}
                                </span>
                            )}
                            {(selectedLeague || selectedTeamName) && (
                                <button
                                    onClick={() => {
                                        setSelectedLeague(null);
                                        setSelectedTournamentIds([]);
                                        setAvailableTournaments([]);
                                        setSelectedTeamId(null);
                                        setSelectedTeamName(null);
                                        setReportData(null);
                                    }}
                                    className="ml-auto px-3 py-1.5 text-gray-400 hover:text-white text-xs font-medium"
                                >
                                    Reset
                                </button>
                            )}
                        </div>
                    )}

                    {/* Dynamic Selector based on stage */}
                    {currentSelectionStage === 'league' && (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key="league-selector"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                                className="w-full"
                            >
                                <div className="mb-6">
                                    <h2 className="text-2xl font-bold text-white mb-2">Select a League</h2>
                                    <p className="text-gray-400 text-sm">Choose a league to browse tournaments</p>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                                    {LEAGUES.map((league) => (
                                        <LeagueCard
                                            key={league.id}
                                            league={league}
                                            onSelect={handleSelectLeague}
                                            isSelected={selectedLeague?.id === league.id}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    )}

                    {currentSelectionStage === 'team' && selectedLeague && selectedTournamentIds.length > 0 && (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key="team-selector"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                                className="w-full"
                            >
                                <TeamSelector
                                    tournamentId={selectedTournamentIds[0]}
                                    onSelectTeam={handleSelectTeam}
                                />
                            </motion.div>
                        </AnimatePresence>
                    )}
                </div>

                {/* Content Area - Report Display */}
                <AnimatePresence mode="wait">
                    {currentSelectionStage === 'report' && reportData ? (
                        <motion.div
                            key="report-display"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="space-y-8"
                        >
                            {/* Report Header Card */}
                            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-surface-light/20 p-8 shadow-2xl">
                                <div className="absolute top-0 right-0 p-32 bg-primary/10 rounded-full blur-3xl" />

                                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                                    <div className="flex items-center gap-6">
                                        {/* Simplified Team Logo/Name Display */}
                                        <div className="w-24 h-24 rounded-2xl bg-surface flex items-center justify-center border border-white/10 shadow-xl overflow-hidden">
                                            {reportData.team_logo ? (
                                                <img src={reportData.team_logo} alt={selectedTeamName || ''} className="w-full h-full object-contain p-2" />
                                            ) : (
                                                <span className="text-3xl font-black text-primary">{selectedTeamName?.substring(0, 2).toUpperCase()}</span>
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="px-3 py-1 bg-primary/20 text-primary text-xs font-black uppercase tracking-widest rounded-full border border-primary/20">{selectedLeague?.name || 'N/A'}</span>
                                                <span className="px-3 py-1 bg-green-500/10 text-green-400 text-xs font-black uppercase tracking-widest rounded-full border border-green-500/10">Active Analysis</span>
                                            </div>
                                            <h2 className="text-4xl font-black text-white tracking-tight">{selectedTeamName}</h2>

                                            {/* Tournament Toggle Buttons */}
                                            <div className="mt-6">
                                                <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">Include Tournaments:</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {availableTournaments.map(t => (
                                                        <button
                                                            key={t.id}
                                                            onClick={() => toggleTournament(t.id)}
                                                            className={cn(
                                                                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                                                                selectedTournamentIds.includes(t.id)
                                                                    ? "bg-primary/20 border-primary/50 text-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]"
                                                                    : "bg-surface border-white/10 text-gray-400 hover:bg-surface-light hover:border-white/20 hover:text-gray-200"
                                                            )}
                                                        >
                                                            {selectedTournamentIds.includes(t.id) && <Check className="w-3.5 h-3.5" />}
                                                            {t.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <button className="flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-black transition-all border border-white/10 hover:scale-105 active:scale-95 shadow-lg">
                                            <FileText className="w-4 h-4" /> Export
                                        </button>
                                        <Link href={`/drafts?teamId=${selectedTeamId}&tournamentId=${selectedTournamentIds[0]}`} className="flex items-center gap-3 px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-black transition-all shadow-xl shadow-primary/20 hover:scale-105 active:scale-95">
                                            <TrendingUp className="w-4 h-4" /> Match History
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            {/* Report Display Component */}
                            <ReportDisplay report={reportData} />

                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-32 space-y-6"
                        >
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl"></div>
                                <Target className="relative w-24 h-24 text-primary/40" />
                            </div>
                            <div className="text-center space-y-2">
                                <p className="text-xl font-bold text-gray-300">
                                    {currentSelectionStage === 'league' && "Select a league to begin"
                                        || currentSelectionStage === 'team' && "Select a team to generate the report"
                                        || "Select options above to generate report"}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {currentSelectionStage === 'league' && "Choose from the available leagues above"
                                        || currentSelectionStage === 'team' && "Browse teams and select one to analyze"
                                        || "Follow the steps above to generate your report"}
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Background Ambience */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                {/* Background Image with Overlay */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="/esport.png"
                        alt="Background"
                        className="w-full h-full object-cover opacity-50 grayscale mix-blend-overlay"
                    />
                    <div className="absolute inset-0 bg-background/80" />
                </div>

                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/5 rounded-full blur-[120px]" />
            </div>
        </main>
    );
}
