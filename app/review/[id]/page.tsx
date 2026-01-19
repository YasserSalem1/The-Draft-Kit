'use client';

import { getSeriesById, SavedSeries, updateSeries } from '@/lib/persistence/storage';
import { TEAMS, Player } from '@/lib/data/teams';
import { notFound, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trophy } from 'lucide-react';
import { getChampionIconUrl, getLatestVersion, Champion, getChampions } from '@/lib/api/ddragon';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { PlayerDetailsPanel } from '@/components/features/PlayerDetailsPanel';

export default function ReviewPage() {
    const params = useParams();
    const [series, setSeries] = useState<SavedSeries | null>(null);
    const [version, setVersion] = useState<string>('');
    const [champions, setChampions] = useState<Champion[]>([]);
    const [search, setSearch] = useState<string>('');
    const [pickerState, setPickerState] = useState<{ gameIndex: number; side: 'blue' | 'red'; kind: 'picks' | 'bans' } | null>(null);
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
    const [selectedTeamMeta, setSelectedTeamMeta] = useState<{ name: string; color: string } | null>(null);

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
        <main className="min-h-screen bg-[#090A0F] text-white p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-12">
                {/* Player Details Side Panel (reused from Draft) */}
                <PlayerDetailsPanel
                    player={selectedPlayer}
                    onClose={() => setSelectedPlayer(null)}
                    teamName={selectedTeamMeta?.name || ''}
                    teamColor={selectedTeamMeta?.color || ''}
                />
                {/* Header */}
                <div className="space-y-6 border-b border-white/5 pb-8">
                    <Link href="/library" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest">
                        <ArrowLeft className="w-4 h-4" /> Back to Library
                    </Link>

                    <div className="flex flex-col md:flex-row items-center justify-center md:gap-24 gap-8">
                        {/* Blue Team */}
                        <div className="text-center space-y-4">
                            <div className="w-24 h-24 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center text-3xl font-bold mx-auto shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                                {blueTeam.shortName}
                            </div>
                            {/* Scores removed per request */}
                        </div>

                        {/* VS */}
                        <div className="text-center space-y-2">
                            <div className="text-xs font-bold text-gray-500 uppercase tracking-[0.3em]">Series</div>
                            <div className="text-5xl font-black italic tracking-tighter text-gray-700">VS</div>
                            <div className="text-xs font-mono text-primary uppercase">{series.format} match</div>
                        </div>

                        {/* Red Team */}
                        <div className="text-center space-y-4">
                            <div className="w-24 h-24 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center text-3xl font-bold mx-auto shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                                {redTeam.shortName}
                            </div>
                            {/* Scores removed per request */}
                        </div>
                    </div>
                </div>

                {/* One-time 5v5 Players strip for the series (single horizontal row, even alignment) */}
                <div className="bg-black/20 border border-white/5 rounded-xl p-4">
                    <div className="flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
                        {/* Blue badge */}
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded bg-primary flex items-center justify-center font-bold text-black text-[10px] shrink-0">
                            {blueTeam.shortName}
                        </div>

                        {/* Blue 5 icons */}
                        <div className="flex items-center gap-3 md:gap-4">
                            {blueTeam.players?.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => { setSelectedPlayer(p); setSelectedTeamMeta({ name: blueTeam.name, color: blueTeam.color }); }}
                                    className="shrink-0 group flex flex-col items-center gap-1"
                                    title={(p as any).name || p.nickname}
                                >
                                    {/* Icon (unselected champ look) */}
                                    <div
                                        className={
                                            "w-14 h-14 md:w-16 md:h-16 rounded-md border border-white/10 bg-black/60 " +
                                            "flex items-center justify-center text-[14px] text-gray-500 font-mono " +
                                            "transition-all group-hover:border-primary/50 group-hover:shadow-[0_0_14px_rgba(59,130,246,0.35)]"
                                        }
                                    >
                                        —
                                    </div>
                                    {/* Name */}
                                    <div className="w-14 md:w-16 text-[10px] md:text-xs text-gray-300 text-center leading-tight truncate">
                                        {(p as any).name || p.nickname}
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* VS divider */}
                        <div className="px-2 md:px-4 text-sm md:text-base font-black italic text-gray-600 select-none">VS</div>

                        {/* Red 5 icons */}
                        <div className="flex items-center gap-3 md:gap-4">
                            {redTeam.players?.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => { setSelectedPlayer(p); setSelectedTeamMeta({ name: redTeam.name, color: redTeam.color }); }}
                                    className="shrink-0 group flex flex-col items-center gap-1"
                                    title={(p as any).name || p.nickname}
                                >
                                    <div
                                        className={
                                            "w-14 h-14 md:w-16 md:h-16 rounded-md border border-white/10 bg-black/60 " +
                                            "flex items-center justify-center text-[14px] text-gray-500 font-mono " +
                                            "transition-all group-hover:border-red-500/50 group-hover:shadow-[0_0_14px_rgba(239,68,68,0.35)]"
                                        }
                                    >
                                        —
                                    </div>
                                    <div className="w-14 md:w-16 text-[10px] md:text-xs text-gray-300 text-center leading-tight truncate">
                                        {(p as any).name || p.nickname}
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Red badge */}
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded bg-red-600 flex items-center justify-center font-bold text-white text-[10px] shrink-0">
                            {redTeam.shortName}
                        </div>
                    </div>
                </div>

                {/* Game List */}
                <div className="space-y-12">
                    {series.games.map((game, index) => {
                        return (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                key={index}
                                className="bg-black/20 border border-white/5 rounded-2xl overflow-hidden"
                            >
                                <div className="bg-white/5 px-6 py-3 flex items-center justify-between border-b border-white/5">
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Game {index + 1}</h3>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500 uppercase tracking-widest">Winner:</span>
                                        <span className={cn(
                                            "font-bold text-xs uppercase tracking-widest px-2 py-1 rounded",
                                            game.winner === 'blue' ? "bg-primary/20 text-primary" : "bg-red-500/20 text-red-500"
                                        )}>
                                            {game.winner === 'blue' ? blueTeam.shortName : redTeam.shortName}
                                        </span>
                                    </div>
                                </div>

                                {/* Removed per-game 5v5 section per request */}

                                <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-12 relative">
                                    {/* Left Side (Blue) */}
                                    <div className="space-y-6">
                                        <TeamBuildSummary
                                            teamName={blueTeam.name}
                                            bans={game.draftState.blueBans}
                                            picks={game.draftState.bluePicks}
                                            side="blue"
                                            version={version}
                                        />
                                        {/* Alternatives Editor - Picks */}
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
                                        {/* Alternatives Editor - Bans */}
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

                                    <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-white/5" />

                                    {/* Right Side (Red) */}
                                    <div className="space-y-6">
                                        <TeamBuildSummary
                                            teamName={redTeam.name}
                                            bans={game.draftState.redBans}
                                            picks={game.draftState.redPicks}
                                            side="red"
                                            version={version}
                                        />
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
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </main>
    )
}

function TeamBuildSummary({ teamName, bans, picks, side, version }: { teamName: string, bans: (Champion | null)[], picks: (Champion | null)[], side: 'blue' | 'red', version: string }) {
    const isBlue = side === 'blue';
    return (
        <div className="space-y-4">
            <div className={cn("text-xl font-bold uppercase", isBlue ? "text-primary" : "text-red-500")}>
                {teamName}
            </div>

            {/* Picks */}
            <div className="flex gap-2">
                {picks.map((pick, i) => (
                    <div key={i} className="flex-1 space-y-2">
                        <div className="aspect-[3/4] rounded-lg border border-white/10 overflow-hidden bg-black/50 relative group">
                            {pick ? (
                                <>
                                    <img
                                        src={getChampionIconUrl(version, pick.image.full)}
                                        className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all"
                                    />
                                    <div className="absolute bottom-0 left-0 right-0 p-1 bg-black/80 text-[10px] text-center font-bold truncate">
                                        {pick.name}
                                    </div>
                                </>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs text-gray-700 font-mono">
                                    EMPTY
                                </div>
                            )}
                        </div>
                    </div>
                ))}
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
