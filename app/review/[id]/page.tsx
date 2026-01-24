'use client';

import { getSeriesById, SavedSeries, updateSeries } from '@/lib/persistence/storage';
import { TEAMS, Player } from '@/lib/data/teams';
import { notFound, useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trophy, Users, Sword, Shield } from 'lucide-react';
import { getChampionIconUrl, getLatestVersion, Champion, getChampions } from '@/lib/api/ddragon';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { PlayerDetailsPanel } from '@/components/features/PlayerDetailsPanel';
import { TeamLogo } from '@/components/ui/TeamLogo';
import { Team } from '@/lib/data/teams';
import { ScoutingReportData } from '@/lib/data/scouting';

export default function ReviewPage() {
    const params = useParams();
    const router = useRouter();
    const [series, setSeries] = useState<SavedSeries | null>(null);
    const [version, setVersion] = useState<string>('');
    const [champions, setChampions] = useState<Champion[]>([]);
    const [search, setSearch] = useState<string>('');
    const [pickerState, setPickerState] = useState<{ gameIndex: number; side: 'blue' | 'red'; kind: 'picks' | 'bans' } | null>(null);
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
    const [selectedTeamMeta, setSelectedTeamMeta] = useState<{ name: string; color: string; report: ScoutingReportData | null } | null>(null);

    const handleTeamClick = (team: Team) => {
        router.push(`/reports?teamId=${team.id}&teamName=${encodeURIComponent(team.name)}&region=${team.region}`);
    };

    useEffect(() => {
        if (params.id) {
            const s = getSeriesById(params.id as string);
            if (s) setSeries(s);
        }
        (async () => {
            const v = await getLatestVersion();
            setVersion(v);
            const list = await getChampions();
            setChampions(list);
        })();
    }, [params.id]);

    if (!series) return <div className="min-h-screen bg-[#090A0F] flex items-center justify-center text-gray-500">Loading Series...</div>;

    const blueTeam = TEAMS.find(t => t.id === series.blueTeamId) || TEAMS[0];
    const redTeam = TEAMS.find(t => t.id === series.redTeamId) || TEAMS[1];

    function persist(newSeries: SavedSeries) {
        setSeries(newSeries);
        updateSeries(newSeries.id, { games: newSeries.games });
    }

    function handleAddAlt(gameIndex: number, side: 'blue' | 'red', kind: 'picks' | 'bans', champ: Champion) {
        const s = series;
        if (!s) return;
        const games = s.games.map((g, i) => {
            if (i !== gameIndex) return g;
            // migrate legacy to new shape if needed
            const legacy = (g as any).alternatives;
            let current = g.alternatives as any;
            if (legacy && Array.isArray(legacy.blue) && Array.isArray(legacy.red)) {
                current = { blue: { picks: legacy.blue, bans: [] }, red: { picks: legacy.red, bans: [] } };
            }
            current = current || { blue: { picks: [], bans: [] }, red: { picks: [], bans: [] } };

            const mainPicks = side === 'blue' ? g.draftState.bluePicks : g.draftState.redPicks;
            const mainBans = side === 'blue' ? g.draftState.blueBans : g.draftState.redBans;
            const list = current[side][kind] as Champion[];
            if (list.length >= 5) return g;
            if (list.some((c: Champion) => c.id === champ.id)) return g;
            // must differ from same-team main picks/bans based on kind
            if (kind === 'picks' && mainPicks.some(p => p?.id === champ.id)) return g;
            if (kind === 'bans' && mainBans.some(b => b?.id === champ.id)) return g;
            return {
                ...g,
                alternatives: {
                    blue: current.blue,
                    red: current.red,
                    [side]: {
                        ...current[side],
                        [kind]: [...list, champ],
                    },
                }
            };
        });
        persist({ ...s, games });
    }

    function handleRemoveAlt(gameIndex: number, side: 'blue' | 'red', kind: 'picks' | 'bans', champId: string) {
        const s = series;
        if (!s) return;
        const games = s.games.map((g, i) => {
            if (i !== gameIndex) return g;
            const legacy = (g as any).alternatives;
            let current = g.alternatives as any;
            if (legacy && Array.isArray(legacy.blue) && Array.isArray(legacy.red)) {
                current = { blue: { picks: legacy.blue, bans: [] }, red: { picks: legacy.red, bans: [] } };
            }
            current = current || { blue: { picks: [], bans: [] }, red: { picks: [], bans: [] } };
            return {
                ...g,
                alternatives: {
                    blue: current.blue,
                    red: current.red,
                    [side]: {
                        ...current[side],
                        [kind]: (current[side][kind] as Champion[]).filter(c => c.id !== champId),
                    },
                }
            };
        });
        persist({ ...s, games });
    }

    return (
        <main className="min-h-screen bg-background text-white p-6 md:p-8 relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Background Image with Overlay */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="/esport.png"
                        alt="Background"
                        className="w-full h-full object-cover opacity-50 grayscale mix-blend-overlay"
                    />
                    <div className="absolute inset-0 bg-background/80" /> {/* Reduced overlay for better visibility */}
                </div>

                <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/5 rounded-full blur-[150px] z-0" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-900/10 rounded-full blur-[150px] z-0" />
            </div>

            <div className="max-w-7xl mx-auto space-y-12 relative z-10">
                {/* Player Details Side Panel (reused from Draft) */}
                <PlayerDetailsPanel
                    player={selectedPlayer}
                    onClose={() => setSelectedPlayer(null)}
                    teamName={selectedTeamMeta?.name || ''}
                    teamColor={selectedTeamMeta?.color || ''}
                    report={selectedTeamMeta?.report || null}
                />

                {/* Header Section */}
                <header className="space-y-8">
                    {/* Breadcrumbs / Nav */}
                    <div className="flex items-center justify-between">
                        <Link href="/library" className="group flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all">
                            <ArrowLeft className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                            <span className="text-xs font-bold uppercase tracking-widest text-gray-400 group-hover:text-white transition-colors">Back to Library</span>
                        </Link>
                        <div className="px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest">
                            {series.format} Series
                        </div>
                    </div>

                    {/* Matchup Banner */}
                    <div className="relative p-12 rounded-[2rem] bg-black/40 border border-white/10 overflow-hidden backdrop-blur-sm">

                        {/* Background Splashes */}
                        <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
                            <div className="absolute -left-20 -top-20 w-96 h-96 bg-blue-500/20 blur-[100px] rounded-full" />
                            <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-red-500/20 blur-[100px] rounded-full" />
                        </div>

                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                            {/* Blue Team */}
                            <div
                                className="flex-1 flex flex-col items-center gap-6 group cursor-pointer"
                                onClick={() => handleTeamClick(blueTeam)}
                            >
                                <div className="relative">
                                    <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/20 blur-2xl rounded-full transition-all duration-500" />
                                    <TeamLogo team={blueTeam} className="w-32 h-32 relative z-10 drop-shadow-2xl group-hover:scale-110 transition-transform duration-300" />
                                </div>
                                <div className="text-center space-y-2">
                                    <h2 className="text-5xl font-black italic tracking-tighter text-white group-hover:text-blue-400 transition-colors uppercase">{blueTeam.shortName}</h2>
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest">
                                        <Users className="w-3 h-3" />
                                        Blue Side
                                    </div>
                                </div>
                            </div>

                            {/* VS Badge */}
                            <div className="flex flex-col items-center justify-center shrink-0">
                                <div className="text-8xl font-black italic text-transparent bg-clip-text bg-gradient-to-br from-white via-gray-400 to-gray-600 tracking-tighter mix-blend-overlay opacity-50 select-none">
                                    VS
                                </div>
                            </div>

                            {/* Red Team */}
                            <div
                                className="flex-1 flex flex-col items-center gap-6 group cursor-pointer"
                                onClick={() => handleTeamClick(redTeam)}
                            >
                                <div className="relative">
                                    <div className="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/20 blur-2xl rounded-full transition-all duration-500" />
                                    <TeamLogo team={redTeam} className="w-32 h-32 relative z-10 drop-shadow-2xl group-hover:scale-110 transition-transform duration-300" />
                                </div>
                                <div className="text-center space-y-2">
                                    <h2 className="text-5xl font-black italic tracking-tighter text-white group-hover:text-red-400 transition-colors uppercase">{redTeam.shortName}</h2>
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-widest">
                                        Red Side
                                        <Users className="w-3 h-3" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Rosters Section - REFINED */}
                <section className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="h-px bg-white/10 flex-1" />
                        <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-500">Active Rosters</h3>
                        <div className="h-px bg-white/10 flex-1" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Blue Roster */}
                        <div className="bg-gradient-to-br from-blue-950/20 to-black/20 border border-white/5 rounded-2xl p-6 relative overflow-hidden group/panel">
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/50" />
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="text-xl font-bold text-blue-100">{blueTeam.name}</h4>
                                <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-wider">Blue Team</span>
                            </div>

                            <div className="grid grid-cols-5 gap-4">
                                {blueTeam.players?.map((p, idx) => {
                                    const nickname = series.games[0]?.draftState?.bluePlayerNames?.[idx] || p.nickname || (p as any).name;
                                    return (
                                        <button
                                            key={p.id}
                                            onClick={() => {
                                                const playerName = series.games[0]?.draftState?.bluePlayerNames?.[idx] || p.nickname || (p as any).name;
                                                setSelectedPlayer({ ...p, nickname: playerName });
                                                setSelectedTeamMeta({ name: blueTeam.name, color: blueTeam.color, report: series.blueReport });
                                            }}
                                            className="group/player flex flex-col items-center gap-3 relative"
                                            title="View Player Report"
                                        >
                                            <div className="w-16 h-16 rounded-xl bg-black/40 border border-white/10 group-hover/player:border-blue-400/50 flex items-center justify-center transition-all group-hover/player:shadow-[0_0_20px_rgba(59,130,246,0.2)] group-hover/player:-translate-y-1 relative overflow-hidden">
                                                <Users className="w-6 h-6 text-gray-600 group-hover/player:text-blue-400 transition-colors" />
                                                {/* Hover overlay hint */}
                                                <div className="absolute inset-0 bg-blue-500/80 flex items-center justify-center opacity-0 group-hover/player:opacity-100 transition-opacity backdrop-blur-[2px]">
                                                    <span className="text-[8px] font-black text-white uppercase tracking-widest">View Stats</span>
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold text-gray-400 group-hover/player:text-white transition-colors truncate w-full text-center">{nickname}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Red Roster */}
                        <div className="bg-gradient-to-bl from-red-950/20 to-black/20 border border-white/5 rounded-2xl p-6 relative overflow-hidden group/panel">
                            <div className="absolute top-0 right-0 w-1 h-full bg-red-500/50" />
                            <div className="flex justify-between items-center mb-6 flex-row-reverse">
                                <h4 className="text-xl font-bold text-red-100">{redTeam.name}</h4>
                                <span className="px-2 py-1 rounded bg-red-500/10 text-red-400 text-[10px] font-bold uppercase tracking-wider">Red Team</span>
                            </div>

                            <div className="grid grid-cols-5 gap-4">
                                {redTeam.players?.map((p, idx) => {
                                    const nickname = series.games[0]?.draftState?.redPlayerNames?.[idx] || p.nickname || (p as any).name;
                                    return (
                                        <button
                                            key={p.id}
                                            onClick={() => {
                                                const playerName = series.games[0]?.draftState?.redPlayerNames?.[idx] || p.nickname || (p as any).name;
                                                setSelectedPlayer({ ...p, nickname: playerName });
                                                setSelectedTeamMeta({ name: redTeam.name, color: redTeam.color, report: series.redReport });
                                            }}
                                            className="group/player flex flex-col items-center gap-3 relative"
                                            title="View Player Report"
                                        >
                                            <div className="w-16 h-16 rounded-xl bg-black/40 border border-white/10 group-hover/player:border-red-400/50 flex items-center justify-center transition-all group-hover/player:shadow-[0_0_20px_rgba(239,68,68,0.2)] group-hover/player:-translate-y-1 relative overflow-hidden">
                                                <Users className="w-6 h-6 text-gray-600 group-hover/player:text-red-400 transition-colors" />
                                                {/* Hover overlay hint */}
                                                <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center opacity-0 group-hover/player:opacity-100 transition-opacity backdrop-blur-[2px]">
                                                    <span className="text-[8px] font-black text-white uppercase tracking-widest">View Stats</span>
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold text-gray-400 group-hover/player:text-white transition-colors truncate w-full text-center">{nickname}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Games Timeline */}
                <section className="space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="h-px bg-white/10 flex-1" />
                        <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-500">Match Timeline</h3>
                        <div className="h-px bg-white/10 flex-1" />
                    </div>

                    <div className="space-y-16">
                        {series.games.map((game, index) => {
                            return (
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5 }}
                                    key={index}
                                    className="relative"
                                >
                                    {/* Game Header */}
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 font-black text-xl text-white shadow-lg">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold text-white">Game {index + 1}</h3>
                                            <p className="text-sm text-gray-500">Draft Analysis & Alternatives</p>
                                        </div>
                                        <div className="h-px bg-white/10 flex-1 ml-4" />
                                    </div>

                                    {/* Game Card */}
                                    <div className="bg-[#0C0E14]/80 backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden shadow-2xl">

                                        {/* Draft Area */}
                                        <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-16 relative">

                                            {/* Divider for Desktop */}
                                            <div className="hidden lg:block absolute left-1/2 top-8 bottom-8 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />

                                            {/* Left Side (Blue) */}
                                            <div className="space-y-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                                                        <Sword className="w-5 h-5" />
                                                    </div>
                                                    <h4 className="text-lg font-bold uppercase tracking-widest text-blue-200">Blue Side Draft</h4>
                                                </div>

                                                <TeamBuildSummary
                                                    teamName={blueTeam.name}
                                                    bans={game.draftState.blueBans}
                                                    picks={game.draftState.bluePicks}
                                                    side="blue"
                                                    version={version}
                                                    playerNames={game.draftState.bluePlayerNames || []}
                                                    onPlayerClick={(playerName) => {
                                                        const p = blueTeam.players?.find(pl => pl.nickname === playerName) || { id: playerName, nickname: playerName } as Player;
                                                        setSelectedPlayer({ ...p, nickname: playerName });
                                                        setSelectedTeamMeta({ name: blueTeam.name, color: blueTeam.color, report: series.blueReport });
                                                    }}
                                                />

                                                <div className="pt-6 border-t border-white/5 space-y-4">
                                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Scenarios & Alternatives</p>
                                                    <AlternativesEditor
                                                        side="blue"
                                                        kind="picks"
                                                        gameIndex={index}
                                                        game={game}
                                                        champions={champions}
                                                        version={version}
                                                        open={pickerState?.gameIndex === index && pickerState.side === 'blue' && pickerState.kind === 'picks'}
                                                        search={pickerState?.gameIndex === index && pickerState.side === 'blue' && pickerState.kind === 'picks' ? search : ''}
                                                        onOpenPicker={() => { setPickerState({ gameIndex: index, side: 'blue', kind: 'picks' }); setSearch(''); }}
                                                        onClosePicker={() => setPickerState(null)}
                                                        onSearch={setSearch}
                                                        onRemove={(champId) => handleRemoveAlt(index, 'blue', 'picks', champId)}
                                                        onAdd={(champ) => handleAddAlt(index, 'blue', 'picks', champ)}
                                                    />
                                                    <AlternativesEditor
                                                        side="blue"
                                                        kind="bans"
                                                        gameIndex={index}
                                                        game={game}
                                                        champions={champions}
                                                        version={version}
                                                        open={pickerState?.gameIndex === index && pickerState.side === 'blue' && pickerState.kind === 'bans'}
                                                        search={pickerState?.gameIndex === index && pickerState.side === 'blue' && pickerState.kind === 'bans' ? search : ''}
                                                        onOpenPicker={() => { setPickerState({ gameIndex: index, side: 'blue', kind: 'bans' }); setSearch(''); }}
                                                        onClosePicker={() => setPickerState(null)}
                                                        onSearch={setSearch}
                                                        onRemove={(champId) => handleRemoveAlt(index, 'blue', 'bans', champId)}
                                                        onAdd={(champ) => handleAddAlt(index, 'blue', 'bans', champ)}
                                                    />
                                                </div>
                                            </div>

                                            {/* Right Side (Red) */}
                                            <div className="space-y-8">
                                                <div className="flex items-center justify-end gap-4">
                                                    <h4 className="text-lg font-bold uppercase tracking-widest text-red-200">Red Side Draft</h4>
                                                    <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
                                                        <Shield className="w-5 h-5" />
                                                    </div>
                                                </div>

                                                <TeamBuildSummary
                                                    teamName={redTeam.name}
                                                    bans={game.draftState.redBans}
                                                    picks={game.draftState.redPicks}
                                                    side="red"
                                                    version={version}
                                                    playerNames={game.draftState.redPlayerNames || []}
                                                    onPlayerClick={(playerName) => {
                                                        const p = redTeam.players?.find(pl => pl.nickname === playerName) || { id: playerName, nickname: playerName } as Player;
                                                        setSelectedPlayer({ ...p, nickname: playerName });
                                                        setSelectedTeamMeta({ name: redTeam.name, color: redTeam.color, report: series.redReport });
                                                    }}
                                                />

                                                <div className="pt-6 border-t border-white/5 space-y-4">
                                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Scenarios & Alternatives</p>
                                                    <AlternativesEditor
                                                        side="red"
                                                        kind="picks"
                                                        gameIndex={index}
                                                        game={game}
                                                        champions={champions}
                                                        version={version}
                                                        open={pickerState?.gameIndex === index && pickerState.side === 'red' && pickerState.kind === 'picks'}
                                                        search={pickerState?.gameIndex === index && pickerState.side === 'red' && pickerState.kind === 'picks' ? search : ''}
                                                        onOpenPicker={() => { setPickerState({ gameIndex: index, side: 'red', kind: 'picks' }); setSearch(''); }}
                                                        onClosePicker={() => setPickerState(null)}
                                                        onSearch={setSearch}
                                                        onRemove={(champId) => handleRemoveAlt(index, 'red', 'picks', champId)}
                                                        onAdd={(champ) => handleAddAlt(index, 'red', 'picks', champ)}
                                                    />
                                                    <AlternativesEditor
                                                        side="red"
                                                        kind="bans"
                                                        gameIndex={index}
                                                        game={game}
                                                        champions={champions}
                                                        version={version}
                                                        open={pickerState?.gameIndex === index && pickerState.side === 'red' && pickerState.kind === 'bans'}
                                                        search={pickerState?.gameIndex === index && pickerState.side === 'red' && pickerState.kind === 'bans' ? search : ''}
                                                        onOpenPicker={() => { setPickerState({ gameIndex: index, side: 'red', kind: 'bans' }); setSearch(''); }}
                                                        onClosePicker={() => setPickerState(null)}
                                                        onSearch={setSearch}
                                                        onRemove={(champId) => handleRemoveAlt(index, 'red', 'bans', champId)}
                                                        onAdd={(champ) => handleAddAlt(index, 'red', 'bans', champ)}
                                                    />
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </section>
            </div>
        </main>
    )
}

function TeamBuildSummary({ teamName, bans, picks, side, version, playerNames, onPlayerClick }: {
    teamName: string,
    bans: (Champion | null)[],
    picks: (Champion | null)[],
    side: 'blue' | 'red',
    version: string,
    playerNames: string[],
    onPlayerClick: (playerName: string) => void
}) {
    const isBlue = side === 'blue';
    return (
        <div className="space-y-4">
            <div className={cn("text-xl font-bold uppercase", isBlue ? "text-primary" : "text-red-500")}>
                {teamName}
            </div>

            {/* Picks */}
            <div className="flex gap-2">
                {picks.map((pick, i) => {
                    const playerName = playerNames[i];
                    return (
                        <div key={i} className="flex-1 space-y-2">
                            <button
                                onClick={() => playerName && onPlayerClick(playerName)}
                                className="w-full aspect-[3/4] rounded-lg border border-white/10 overflow-hidden bg-black/50 relative group"
                            >
                                {pick ? (
                                    <>
                                        <img
                                            src={getChampionIconUrl(version, pick.image.full)}
                                            className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all"
                                        />
                                        <div className={cn("absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]", isBlue ? "bg-blue-500/40" : "bg-red-500/40")}>
                                            <span className="text-[8px] font-black text-white uppercase tracking-widest">View Stats</span>
                                        </div>
                                        <div className="absolute bottom-0 left-0 right-0 p-1 bg-black/80 text-[10px] text-center font-bold truncate">
                                            {pick.name}
                                        </div>
                                    </>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-700 font-mono">
                                        EMPTY
                                    </div>
                                )}
                            </button>
                            {playerName && (
                                <div className="text-[10px] font-bold text-gray-500 text-center truncate px-1">
                                    {playerName}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Bans */}
            <div className="flex items-center gap-2 pt-2">
                <span className="text-[10px] uppercase font-bold text-gray-600 tracking-widest mr-2">Bans</span>
                {bans.map((ban, i) => (
                    <div key={i} className="w-8 h-8 rounded border border-white/10 overflow-hidden bg-black/50 grayscale opacity-70">
                        {ban && <img src={getChampionIconUrl(version, ban.image.full)} className="w-full h-full object-cover" />}
                    </div>
                ))}
            </div>
        </div>
    )
}

function AlternativesEditor({
    side,
    kind,
    gameIndex,
    game,
    champions,
    version,
    open,
    search,
    onSearch,
    onOpenPicker,
    onClosePicker,
    onRemove,
    onAdd,
}: {
    side: 'blue' | 'red';
    kind: 'picks' | 'bans';
    gameIndex: number;
    game: SavedSeries['games'][number];
    champions: Champion[];
    version: string;
    open: boolean;
    search: string;
    onSearch: (v: string) => void;
    onOpenPicker: () => void;
    onClosePicker: () => void;
    onRemove: (champId: string) => void;
    onAdd: (champ: Champion) => void;
}) {
    const alts = (game.alternatives && (game.alternatives as any)[side] && (game.alternatives as any)[side][kind]) || [];
    const picks = side === 'blue' ? game.draftState.bluePicks : game.draftState.redPicks;
    const bans = side === 'blue' ? game.draftState.blueBans : game.draftState.redBans;
    const isBlue = side === 'blue';
    const canAdd = alts.length < 5;
    const filtered = champions.filter(c => c.name.toLowerCase().includes((search || '').toLowerCase()));
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <span className={cn("text-[10px] uppercase font-bold tracking-widest", isBlue ? 'text-primary' : 'text-red-400')}>
                    {side === 'blue' ? 'Blue' : 'Red'} {kind === 'bans' ? 'Alternative Bans' : 'Alternative Picks'}
                </span>
                {canAdd && (
                    <button onClick={onOpenPicker} className={cn("px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest border", isBlue ? 'border-primary/40 text-primary hover:bg-primary/10' : 'border-red-500/40 text-red-400 hover:bg-red-500/10')}>Add</button>
                )}
            </div>
            <div className="flex flex-wrap gap-1">
                {alts.map((ch: Champion) => (
                    <button key={ch.id} onClick={() => onRemove(ch.id)} className={cn("flex items-center gap-1 px-2 py-1 rounded border text-[10px]", isBlue ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-red-500/10 border-red-500/30 text-red-400')}>
                        <span>{ch.name}</span>
                        <span className="opacity-60">×</span>
                    </button>
                ))}
                {alts.length === 0 && (
                    <span className="text-xs text-gray-600">None</span>
                )}
            </div>

            {/* Inline Picker */}
            {canAdd && open && (
                <div className="mt-2 bg-black/40 border border-white/10 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                        <input
                            value={search}
                            onChange={(e) => onSearch(e.target.value)}
                            placeholder="Search champion..."
                            className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1 text-sm"
                        />
                        <button onClick={onClosePicker} className="text-xs text-gray-500 hover:text-white">Close</button>
                    </div>
                    <div className="max-h-48 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {filtered.map(ch => {
                            const invalidMain = kind === 'picks' ? picks.some(p => p?.id === ch.id) : bans.some(b => b?.id === ch.id);
                            const invalid = invalidMain || alts.some((a: Champion) => a.id === ch.id);
                            return (
                                <button
                                    key={ch.id}
                                    disabled={invalid}
                                    onClick={() => onAdd(ch)}
                                    className={cn("flex items-center gap-2 p-2 rounded border text-xs text-left", invalid ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white/5', isBlue ? 'border-primary/20' : 'border-red-500/20')}
                                >
                                    <img src={getChampionIconUrl(version, ch.image.full)} className="w-6 h-6 rounded object-cover" />
                                    <span className="truncate">{ch.name}</span>
                                </button>
                            );
                        })}
                        {filtered.length === 0 && (
                            <div className="col-span-full text-center text-gray-600 text-xs py-4">No champions found.</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
