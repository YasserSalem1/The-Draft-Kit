'use client';

import { useState } from 'react';
import { getScoutingReport, ScoutingReportData } from '@/lib/data/scouting';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Download, FileText, TrendingUp, Target, Shield, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import sideData from '@/lib/data/side_preference_report_FULL.json';
import { LEAGUES, League } from '@/lib/data/leagues';
import LeagueCard from '../../components/LeagueCard';
import TournamentSelector from '../../components/TournamentSelector';
import TeamSelector from '../../components/TeamSelector';
import ReportDisplay from '../../components/ReportDisplay';

export default function ReportsPage() {
    const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
    const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
    const [selectedTournamentName, setSelectedTournamentName] = useState<string | null>(null);
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
    const [selectedTeamName, setSelectedTeamName] = useState<string | null>(null);
    const [reportData, setReportData] = useState<ScoutingReportData | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleSelectLeague = (league: League) => {
        setSelectedLeague(league);
        setSelectedTournamentId(null);
        setSelectedTournamentName(null);
        setSelectedTeamId(null);
        setSelectedTeamName(null);
        setReportData(null);
        setError(null);
    };

    const handleSelectTournament = (tournamentId: string, tournamentName: string) => {
        setSelectedTournamentId(tournamentId);
        setSelectedTournamentName(tournamentName);
        setSelectedTeamId(null);
        setSelectedTeamName(null);
        setReportData(null);
        setError(null);
    };

    const handleSelectTeam = async (teamId: string, teamName: string) => {
        setSelectedTeamId(teamId);
        setSelectedTeamName(teamName);
        setLoading(true);
        setError(null);
        try {
            const data = await getScoutingReport(teamId, selectedTournamentId!); // Fetch live data
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
    const currentSelectionStage = !selectedLeague
        ? 'league'
        : !selectedTournamentId
        ? 'tournament'
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
                    {(selectedLeague || selectedTournamentName || selectedTeamName) && (
                        <div className="flex items-center gap-2 mb-6 flex-wrap">
                            {selectedLeague && (
                                <>
                                    <button
                                        onClick={() => handleSelectLeague(selectedLeague)}
                                        className="px-4 py-2 bg-primary/20 text-primary rounded-lg font-semibold hover:bg-primary/30 transition-colors"
                                    >
                                        {selectedLeague.name}
                                    </button>
                                    {selectedTournamentName && <span className="text-gray-500">→</span>}
                                </>
                            )}
                            {selectedTournamentName && (
                                <>
                                    <span className="px-4 py-2 bg-surface-light/50 text-gray-300 rounded-lg font-medium">
                                        {selectedTournamentName}
                                    </span>
                                    {selectedTeamName && <span className="text-gray-500">→</span>}
                                </>
                            )}
                            {selectedTeamName && (
                                <span className="px-4 py-2 bg-surface-light/50 text-gray-300 rounded-lg font-medium">
                                    {selectedTeamName}
                                </span>
                            )}
                            {(selectedLeague || selectedTournamentName || selectedTeamName) && (
                                <button
                                    onClick={() => {
                                        setSelectedLeague(null);
                                        setSelectedTournamentId(null);
                                        setSelectedTournamentName(null);
                                        setSelectedTeamId(null);
                                        setSelectedTeamName(null);
                                        setReportData(null);
                                    }}
                                    className="ml-auto px-4 py-2 text-gray-400 hover:text-white text-sm font-medium"
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

                    {currentSelectionStage === 'tournament' && selectedLeague && (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key="tournament-selector"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                                className="w-full"
                            >
                                <TournamentSelector
                                    regionName={selectedLeague.regionName}
                                    onSelectTournament={handleSelectTournament}
                                />
                            </motion.div>
                        </AnimatePresence>
                    )}

                    {currentSelectionStage === 'team' && selectedTournamentId && (
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
                                    tournamentId={selectedTournamentId}
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
                            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-surface-light/30 p-8">
                                <div className="absolute top-0 right-0 p-32 bg-primary/10 rounded-full blur-3xl" />

                                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                                    <div className="flex items-center gap-6">
                                        {/* Simplified Team Logo/Name Display */}
                                        <div className="w-24 h-24 rounded-2xl bg-surface flex items-center justify-center border border-white/10 shadow-lg">
                                            <span className="text-3xl font-bold">{selectedTeamName?.substring(0,2).toUpperCase()}</span>
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-bold text-white mb-2">{selectedTeamName}</h2>
                                            <div className="flex items-center gap-2">
                                                <span className="px-3 py-1 bg-primary/20 text-primary text-xs font-bold uppercase tracking-widest rounded border border-primary/20">{selectedLeague?.name || 'N/A'}</span>
                                                <span className="px-3 py-1 bg-green-500/10 text-green-400 text-xs font-bold uppercase tracking-widest rounded border border-green-500/10">Active</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-colors border border-white/5">
                                            <FileText className="w-4 h-4" /> Save Report
                                        </button>
                                        <Link href={`/drafts?teamId=${selectedTeamId}&tournamentId=${selectedTournamentId}`} className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-colors shadow-lg shadow-primary/25">
                                            <Download className="w-4 h-4" /> View Draft History
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
                                    || currentSelectionStage === 'tournament' && "Select a tournament to continue"
                                    || currentSelectionStage === 'team' && "Select a team to generate the report"
                                    || "Select options above to generate report"}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {currentSelectionStage === 'league' && "Choose from the available leagues above"
                                    || currentSelectionStage === 'tournament' && "Pick a tournament from the cards above"
                                    || currentSelectionStage === 'team' && "Browse teams and select one to analyze"
                                    || "Follow the steps above to generate your report"}
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Decorative */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
        </main>
    );
}
