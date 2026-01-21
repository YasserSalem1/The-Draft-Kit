'use client';

import {
    getSavedSeries,
    deleteSeries,
    SavedSeries,
    DraftFolder,
    getFolders,
    createFolder,
    deleteFolder,
    renameFolder,
    updateSeries
} from '@/lib/persistence/storage';
import { TEAMS } from '@/lib/data/teams';
import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Trash2,
    Folder as FolderIcon,
    Plus,
    Search,
    Edit2,
    FileQuestion,
    X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getLatestVersion, getChampionIconUrl } from '@/lib/api/ddragon';
import { TeamLogo } from '@/components/ui/TeamLogo';
import { CreateFolderModal } from '@/components/features/CreateFolderModal';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { SeriesCard } from '@/components/features/Library/SeriesCard';
import { TeamDetailsPanel } from '@/components/features/TeamDetailsPanel';
import { ScoutingReportData } from '@/lib/data/scouting';
import { Team } from '@/lib/data/teams';

type SortOption = 'newest' | 'oldest' | 'name-asc' | 'name-desc';

export default function LibraryPage() {
    const [history, setHistory] = useState<SavedSeries[]>([]);
    const [folders, setFolders] = useState<DraftFolder[]>([]);
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null); // null = Root (Grid View)
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('newest');
    const [ddragonVersion, setDdragonVersion] = useState<string>('');
    const [previewGameIndices, setPreviewGameIndices] = useState<Record<string, number>>({});

    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ type: 'folder' | 'series' | null, id: string | null }>({ type: null, id: null });

    // Editing State (Folder/Series)
    const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
    const [editingSeriesId, setEditingSeriesId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // Team Report Panel State
    const [selectedTeamForReport, setSelectedTeamForReport] = useState<Team | null>(null);
    const [selectedTeamSide, setSelectedTeamSide] = useState<'blue' | 'red' | null>(null);
    const [selectedTeamReportData, setSelectedTeamReportData] = useState<ScoutingReportData | null>(null);

    const currentFolder = useMemo(() => folders.find(f => f.id === currentFolderId), [folders, currentFolderId]);

    // Derived Data
    useEffect(() => {
        refreshData();
        getLatestVersion().then(setDdragonVersion);
    }, []);

    const refreshData = () => {
        setHistory(getSavedSeries());
        setFolders(getFolders());
    };

    // --- Actions ---

    const handleCreateFolder = (name: string, teamAId?: string, teamBId?: string) => {
        createFolder(name, teamAId, teamBId);
        refreshData();
    };

    const handleDeleteSeries = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        setDeleteConfirmation({ type: 'series', id });
    };

    const handleDeleteFolder = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        setDeleteConfirmation({ type: 'folder', id });
    };

    const confirmDelete = () => {
        if (deleteConfirmation.type === 'series' && deleteConfirmation.id) {
            deleteSeries(deleteConfirmation.id);
            refreshData();
        } else if (deleteConfirmation.type === 'folder' && deleteConfirmation.id) {
            deleteFolder(deleteConfirmation.id);
            if (currentFolderId === deleteConfirmation.id) setCurrentFolderId(null);
            refreshData();
        }
        setDeleteConfirmation({ type: null, id: null });
    };

    const handleRenameFolder = (id: string, name: string) => {
        renameFolder(id, name);
        setEditingFolderId(null);
        refreshData();
    };

    const handleUpdateSeriesName = (id: string) => {
        updateSeries(id, { name: editingName });
        setEditingSeriesId(null);
        refreshData();
    };

    const handleTeamClick = (team: Team, side: 'blue' | 'red', report: ScoutingReportData) => {
        setSelectedTeamForReport(team);
        setSelectedTeamSide(side);
        setSelectedTeamReportData(report);
    };

    const handleMoveSeries = (seriesId: string, folderId: string | undefined) => {
        updateSeries(seriesId, { folderId });
        refreshData();
    };

    const handleGamePreviewClick = (e: React.MouseEvent, seriesId: string, gameIndex: number) => {
        e.preventDefault();
        e.stopPropagation();
        setPreviewGameIndices(prev => ({ ...prev, [seriesId]: gameIndex }));
    };

    // --- Filtering ---

    const filteredSeries = useMemo(() => {
        if (!currentFolderId && currentFolderId !== 'unfiled') return []; // In root view, we used to show folders. Series are only shown inside folders or 'unfiled'

        let data = [...history];

        if (currentFolderId === 'unfiled') {
            data = data.filter(s => !s.folderId);
        } else if (currentFolderId) {
            data = data.filter(s => s.folderId === currentFolderId);
        }

        // Search within folder
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            data = data.filter(s => {
                const blue = TEAMS.find(t => t.id === s.blueTeamId);
                const red = TEAMS.find(t => t.id === s.redTeamId);
                return (
                    s.name?.toLowerCase().includes(query) ||
                    blue?.name.toLowerCase().includes(query) ||
                    blue?.shortName.toLowerCase().includes(query) ||
                    red?.name.toLowerCase().includes(query) ||
                    red?.shortName.toLowerCase().includes(query)
                );
            });
        }

        // Sort
        data.sort((a, b) => {
            switch (sortBy) {
                case 'newest': return b.timestamp - a.timestamp;
                case 'oldest': return a.timestamp - b.timestamp;
                case 'name-asc': return (a.name || '').localeCompare(b.name || '');
                case 'name-desc': return (b.name || '').localeCompare(a.name || '');
                default: return 0;
            }
        });

        return data;
    }, [history, currentFolderId, searchQuery, sortBy]);

    // Grouping for Series View
    const groupedByFormat = useMemo(() => {
        const groups: Record<'BO1' | 'BO3' | 'BO5', SavedSeries[]> = { BO1: [], BO3: [], BO5: [] };
        for (const s of filteredSeries) {
            groups[s.format].push(s);
        }
        return groups;
    }, [filteredSeries]);


    // Root View: Folders + Unfiled Statistic
    const renderRootView = () => {
        const unfiledCount = history.filter(s => !s.folderId).length;

        // 1. Filter Folders
        let validFolders = folders.filter(f => {
            if (!searchQuery) return true;
            const q = searchQuery.toLowerCase();
            const teamA = TEAMS.find(t => t.id === f.teamAId);
            const teamB = TEAMS.find(t => t.id === f.teamBId);
            return (
                f.name.toLowerCase().includes(q) ||
                teamA?.name.toLowerCase().includes(q) ||
                teamB?.name.toLowerCase().includes(q) ||
                teamA?.shortName.toLowerCase().includes(q) ||
                teamB?.shortName.toLowerCase().includes(q)
            );
        });

        // 2. Sort Folders
        validFolders.sort((a, b) => {
            switch (sortBy) {
                case 'newest': return b.createdAt - a.createdAt;
                case 'oldest': return a.createdAt - b.createdAt;
                case 'name-asc': return a.name.localeCompare(b.name);
                case 'name-desc': return b.name.localeCompare(a.name);
                default: return 0;
            }
        });

        // 3. Handle Unfiled
        let showUnfiled = unfiledCount > 0;
        if (searchQuery && showUnfiled) {
            showUnfiled = "unfiled drafts".includes(searchQuery.toLowerCase());
        }

        const allItems = [
            ...(showUnfiled ? [{ id: 'unfiled', name: 'Unfiled Drafts', isUnfiled: true }] : []),
            ...validFolders
        ];

        if (allItems.length === 0 && searchQuery) {
            return (
                <div className="text-center py-20 opacity-50">
                    <Search className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                    <h3 className="text-xl font-bold text-gray-400">No folders found</h3>
                    <p className="text-sm text-gray-600 mt-2">Try adjusting your search query</p>
                </div>
            )
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {allItems.map(folder => {
                    // Logic for Unfiled Card
                    if ('isUnfiled' in folder) {
                        return (
                            <div
                                key="unfiled"
                                onClick={() => setCurrentFolderId('unfiled')}
                                className="group relative aspect-[4/3] bg-black/40 border border-white/5 hover:border-white/20 rounded-2xl cursor-pointer transition-all hover:-translate-y-1 hover:shadow-2xl overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                                        <FileQuestion className="w-8 h-8 text-gray-500 group-hover:text-white transition-colors" />
                                    </div>
                                    <div className="text-center">
                                        <h3 className="text-lg font-bold text-gray-300 group-hover:text-white">Unfiled Drafts</h3>
                                        <p className="text-sm text-gray-500">{unfiledCount} series</p>
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    // Standard Folder Card
                    const teamA = TEAMS.find(t => t.id === (folder as DraftFolder).teamAId);
                    const teamB = TEAMS.find(t => t.id === (folder as DraftFolder).teamBId);
                    const draftCount = history.filter(s => s.folderId === folder.id).length;

                    return (
                        <div
                            key={folder.id}
                            onClick={() => setCurrentFolderId(folder.id)}
                            className="group relative aspect-[4/3] bg-black/40 border border-white/5 hover:border-primary/30 rounded-2xl cursor-pointer transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/5 overflow-hidden"
                        >
                            {/* Background logos for atmosphere */}
                            <div className="absolute inset-x-0 top-0 h-1/2 flex opacity-10 blur-xl pointer-events-none">
                                <div className="flex-1 bg-current" style={{ backgroundColor: teamA?.color || '#555' }} />
                                <div className="flex-1 bg-current" style={{ backgroundColor: teamB?.color || '#555' }} />
                            </div>

                            {/* Content */}
                            <div className="absolute inset-0 p-6 flex flex-col justify-between">
                                {/* Header: Logos */}
                                <div className="flex justify-center items-center gap-4 mt-2">
                                    {teamA ? (
                                        <TeamLogo team={teamA} className="w-12 h-12 text-sm shadow-lg shadow-black/50" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"><FolderIcon className="w-5 h-5 text-gray-700" /></div>
                                    )}

                                    <span className="text-xl font-black text-white/20 italic">VS</span>

                                    {teamB ? (
                                        <TeamLogo team={teamB} className="w-12 h-12 text-sm shadow-lg shadow-black/50" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"><FolderIcon className="w-5 h-5 text-gray-700" /></div>
                                    )}
                                </div>

                                {/* Footer: Info */}
                                <div className="space-y-1 z-10">
                                    {editingFolderId === folder.id ? (
                                        <input
                                            autoFocus
                                            className="w-full bg-black/50 border border-white/20 rounded px-2 py-1 text-lg font-bold text-white focus:outline-none focus:border-primary/50"
                                            defaultValue={folder.name}
                                            onClick={e => e.stopPropagation()}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') handleRenameFolder(folder.id, e.currentTarget.value)
                                            }}
                                            onBlur={e => handleRenameFolder(folder.id, e.target.value)}
                                        />
                                    ) : (
                                        <div className="flex items-center justify-between group/title">
                                            <h3 className="text-lg font-bold text-white truncate pr-2">{folder.name}</h3>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setEditingFolderId(folder.id); }}
                                                className="p-1 opacity-0 group-hover/title:opacity-100 hover:bg-white/10 rounded text-gray-500 hover:text-white transition-all"
                                            >
                                                <Edit2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    )}
                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{draftCount} Series</p>
                                </div>
                            </div>

                            {/* Hover Actions */}
                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => handleDeleteFolder(e, folder.id)}
                                    className="p-2 bg-black/50 hover:bg-red-500/20 text-gray-400 hover:text-red-500 rounded-lg backdrop-blur-md transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    );
                })}

                {/* Create New Card - Only show provided not too many results or maybe always useful? */}
                {/* Actually with toolbar button it is redundant, removing to keep cleaner grid */}
            </div>
        )
    };

    return (
        <div className="min-h-screen bg-background text-white font-sans selection:bg-primary/30 flex flex-col relative overflow-hidden">
            <TeamDetailsPanel
                team={selectedTeamForReport}
                side={selectedTeamSide || undefined}
                onClose={() => setSelectedTeamForReport(null)}
                report={selectedTeamReportData}
            />

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

            <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 z-10">
                <AnimatePresence mode="wait">
                    {currentFolderId === null ? (
                        <motion.div
                            key="root"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-8"
                        >
                            {/* Back to Hub - Relocated */}
                            <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors group">
                                <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                                    <ArrowLeft className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-bold uppercase tracking-wider">Back to Hub</span>
                            </Link>

                            <div className="flex items-baseline justify-between">
                                <h1 className="text-3xl font-bold tracking-tight">Matchups</h1>
                                <p className="text-sm text-gray-500">Select a folder to view drafts</p>
                            </div>

                            {/* Toolbar: Search & Sort */}
                            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-black/40 border border-white/5 p-2 rounded-2xl backdrop-blur-sm">
                                {/* Search (Collapsible) */}
                                <div className={cn("relative transition-all duration-300 ease-in-out", isSearchOpen || searchQuery ? "w-full md:w-[300px]" : "w-10")}>
                                    {isSearchOpen || searchQuery ? (
                                        <div className="relative w-full">
                                            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
                                            <input
                                                autoFocus
                                                type="text"
                                                placeholder="Search..."
                                                className="w-full bg-white/5 border border-white/5 rounded-xl pl-11 pr-10 py-3 text-sm focus:bg-white/10 focus:border-primary/50 focus:outline-none transition-all placeholder:text-gray-600 font-medium"
                                                value={searchQuery}
                                                onChange={e => setSearchQuery(e.target.value)}
                                                onBlur={() => !searchQuery && setIsSearchOpen(false)}
                                            />
                                            <button
                                                onClick={() => { setSearchQuery(''); setIsSearchOpen(false); }}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setIsSearchOpen(true)}
                                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                        >
                                            <Search className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setIsCreateModalOpen(true)}
                                        className="px-4 py-3 bg-primary text-black font-bold uppercase tracking-wider text-sm rounded-xl hover:bg-white hover:scale-105 active:scale-95 transition-all shadow-lg hover:shadow-primary/20 flex items-center gap-2"
                                    >
                                        <Plus className="w-5 h-5" />
                                        Create New Folder
                                    </button>
                                </div>
                            </div>

                            {renderRootView()}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="folder"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-8"
                        >
                            {/* Back to Library - Relocated */}
                            <button
                                onClick={() => setCurrentFolderId(null)}
                                className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors group"
                            >
                                <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                                    <ArrowLeft className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-bold uppercase tracking-wider">Back to Library</span>
                            </button>

                            {/* Folder Header */}
                            <div className="flex items-center justify-between pb-6 border-b border-white/5">
                                <div className="flex items-center gap-6">
                                    {currentFolder && (
                                        <div className="flex items-center gap-3">
                                            {currentFolder.teamAId && <TeamLogo team={TEAMS.find(t => t.id === currentFolder.teamAId)!} className="w-12 h-12 text-sm" />}
                                            {(currentFolder.teamAId || currentFolder.teamBId) && <span className="text-2xl font-black text-gray-700 italic">VS</span>}
                                            {currentFolder.teamBId && <TeamLogo team={TEAMS.find(t => t.id === currentFolder.teamBId)!} className="w-12 h-12 text-sm" />}
                                        </div>
                                    )}
                                    <div>
                                        <h1 className="text-4xl font-bold tracking-tight mb-2">
                                            {currentFolderId === 'unfiled' ? 'Unfiled Drafts' : currentFolder?.name}
                                        </h1>
                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            <span>{filteredSeries.length} Series</span>
                                        </div>
                                    </div>
                                </div>

                                {currentFolderId !== 'unfiled' && (
                                    <Link
                                        href={`/draft/new?folderId=${currentFolderId}${currentFolder?.teamAId ? `&blue=${currentFolder.teamAId}` : ''}${currentFolder?.teamBId ? `&red=${currentFolder.teamBId}` : ''}`}
                                        className="px-6 py-3 bg-primary text-black font-bold uppercase tracking-widest rounded-xl hover:bg-white transition-all shadow-lg hover:shadow-primary/30 hover:scale-105 flex items-center gap-2"
                                    >
                                        <Plus className="w-5 h-5" />
                                        Start Draft
                                    </Link>
                                )}
                            </div>

                            {/* Series List (Reused Logic) */}
                            {filteredSeries.length === 0 ? (
                                <div className="text-center py-20 opacity-50">
                                    <FileQuestion className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                                    <h3 className="text-xl font-bold text-gray-400">No Drafts Yet</h3>
                                    <p className="text-sm text-gray-600 mt-2">Start a new draft to populate this folder.</p>
                                </div>
                            ) : (
                                <div className="space-y-12">
                                    {(['BO1', 'BO3', 'BO5'] as const).map((fmt) => (
                                        groupedByFormat[fmt].length > 0 && (
                                            <div key={fmt} className="space-y-6">
                                                <div className="flex items-center gap-4">
                                                    <h3 className="text-xl font-bold text-white opacity-80">{fmt} Matches</h3>
                                                    <div className="h-px bg-white/5 flex-1" />
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                                    {groupedByFormat[fmt].map(series => (
                                                        <SeriesCard
                                                            key={series.id}
                                                            series={series}
                                                            ddragonVersion={ddragonVersion}
                                                            onDelete={(id) => setDeleteConfirmation({ type: 'series', id })}
                                                            onRename={(id, name) => {
                                                                updateSeries(id, { name });
                                                                refreshData();
                                                            }}
                                                            onMove={handleMoveSeries}
                                                            onTeamClick={handleTeamClick}
                                                            availableFolders={folders}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )
                                    ))}
                                </div>
                            )}

                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Create Folder Modal */}
            <CreateFolderModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreate={handleCreateFolder}
            />

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={deleteConfirmation.type !== null}
                onClose={() => setDeleteConfirmation({ type: null, id: null })}
                onConfirm={confirmDelete}
                title={deleteConfirmation.type === 'folder' ? 'Delete Matchup Folder?' : 'Delete Draft Series?'}
                description={
                    deleteConfirmation.type === 'folder'
                        ? 'This folder will be permanently deleted. Any drafts inside will be moved to "Unfiled".'
                        : 'This draft series and all its data will be permanently deleted. This action cannot be undone.'
                }
                confirmText="Delete"
                isDestructive
            />
        </div>
    );
}
