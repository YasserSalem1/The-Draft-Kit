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
    Calendar,
    Trash2,
    Folder,
    Plus,
    Search,
    MoreVertical,
    FolderOpen,
    LayoutGrid,
    FileQuestion,
    Edit2,
    Check,
    X,
    Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

type SortOption = 'newest' | 'oldest' | 'name-asc' | 'name-desc';

export default function LibraryPage() {
    const [history, setHistory] = useState<SavedSeries[]>([]);
    const [folders, setFolders] = useState<DraftFolder[]>([]);
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null); // null = All
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('newest');

    // Collapsible sections by format
    const [collapsed, setCollapsed] = useState<Record<'BO1' | 'BO3' | 'BO5', boolean>>({ BO1: false, BO3: false, BO5: false });

    // Folder Editing State
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [editingFolderId, setEditingFolderId] = useState<string | null>(null);

    // Series Editing State
    const [editingSeriesId, setEditingSeriesId] = useState<string | null>(null);
    const [editingSeriesName, setEditingSeriesName] = useState('');

    useEffect(() => {
        refreshData();
    }, []);

    const refreshData = () => {
        setHistory(getSavedSeries());
        setFolders(getFolders());
    };

    // --- Actions ---

    const handleDeleteSeries = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this draft?')) {
            deleteSeries(id);
            refreshData();
        }
    };

    const handleCreateFolder = () => {
        if (!newFolderName.trim()) return;
        createFolder(newFolderName.trim());
        setNewFolderName('');
        setIsCreatingFolder(false);
        refreshData();
    };

    const handleDeleteFolder = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm('Delete folder? Drafts inside will be moved to Unfiled.')) {
            deleteFolder(id);
            if (currentFolderId === id) setCurrentFolderId(null);
            refreshData();
        }
    };

    const handleRenameFolder = (id: string, name: string) => {
        renameFolder(id, name);
        setEditingFolderId(null);
        refreshData();
    };

    const handleUpdateSeriesName = (id: string) => {
        updateSeries(id, { name: editingSeriesName });
        setEditingSeriesId(null);
        refreshData();
    };

    const handleMoveSeries = (seriesId: string, folderId: string | undefined) => {
        updateSeries(seriesId, { folderId });
        refreshData();
    };

    // --- Filtering & Sorting ---

    const filteredSeries = useMemo(() => {
        let data = [...history];

        // 1. Filter by Folder
        if (currentFolderId === 'unfiled') {
            data = data.filter(s => !s.folderId);
        } else if (currentFolderId) {
            data = data.filter(s => s.folderId === currentFolderId);
        }

        // 2. Search
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

        // 3. Sort
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

    // Group filtered items by Series format for sectioned rendering
    const groupedByFormat = useMemo(() => {
        const groups: Record<'BO1' | 'BO3' | 'BO5', SavedSeries[]> = { BO1: [], BO3: [], BO5: [] };
        for (const s of filteredSeries) {
            groups[s.format].push(s);
        }
        return groups;
    }, [filteredSeries]);

    return (
        <div className="flex  min-h-screen bg-[#090A0F] text-white">
            {/* Sidebar */}
            <aside className="w-64 bg-black/20 border-r border-white/5 flex flex-col p-4">
                <div className="mb-6">
                    <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest">
                        <ArrowLeft className="w-4 h-4" /> Home
                    </Link>
                </div>

                <div className="space-y-2 mb-8">
                    <SidebarItem
                        active={currentFolderId === null}
                        icon={LayoutGrid}
                        label="All Drafts"
                        count={history.length}
                        onClick={() => setCurrentFolderId(null)}
                    />
                    <SidebarItem
                        active={currentFolderId === 'unfiled'}
                        icon={FileQuestion}
                        label="Unfiled"
                        count={history.filter(s => !s.folderId).length}
                        onClick={() => setCurrentFolderId('unfiled')}
                    />
                </div>

                <div className="flex items-center justify-between group text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-3">
                    <span>Folders</span>
                    <button
                        onClick={() => setIsCreatingFolder(true)}
                        className="hover:text-white transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                <div className="space-y-1 flex-1 overflow-y-auto">
                    {isCreatingFolder && (
                        <div className="px-3 py-2 bg-white/5 rounded border border-primary/50 flex items-center gap-2 mb-2">
                            <input
                                autoFocus
                                className="bg-transparent border-none outline-none text-sm w-full"
                                placeholder="Name..."
                                value={newFolderName}
                                onChange={e => setNewFolderName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleCreateFolder()}
                            />
                            <button onClick={handleCreateFolder}><Check className="w-3 h-3 text-green-500" /></button>
                            <button onClick={() => setIsCreatingFolder(false)}><X className="w-3 h-3 text-red-500" /></button>
                        </div>
                    )}

                    {folders.map(folder => (
                        <div key={folder.id} className={cn(
                            "group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all",
                            currentFolderId === folder.id ? "bg-primary/20 text-primary" : "hover:bg-white/5 text-gray-400 hover:text-gray-200"
                        )}>
                            {editingFolderId === folder.id ? (
                                <div className="flex items-center gap-2 w-full">
                                    <input
                                        autoFocus
                                        className="bg-black/50 border border-white/20 rounded px-1 py-0.5 text-xs w-full"
                                        defaultValue={folder.name}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleRenameFolder(folder.id, e.currentTarget.value);
                                        }}
                                        onBlur={(e) => handleRenameFolder(folder.id, e.target.value)}
                                    />
                                </div>
                            ) : (
                                <>
                                    <div
                                        className="flex items-center gap-2 flex-1 truncate"
                                        onClick={() => setCurrentFolderId(folder.id)}
                                    >
                                        <Folder className={cn("w-4 h-4", currentFolderId === folder.id && "fill-current")} />
                                        <span className="text-sm truncate">{folder.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => setEditingFolderId(folder.id)} className="p-1 hover:bg-white/10 rounded">
                                            <Edit2 className="w-3 h-3" />
                                        </button>
                                        <button onClick={(e) => handleDeleteFolder(e, folder.id)} className="p-1 hover:bg-red-500/20 hover:text-red-400 rounded">
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-6xl mx-auto space-y-6">
                    {/* Header Toolbar */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
                        <h1 className="text-2xl font-bold tracking-tight">
                            {currentFolderId === null ? 'All Drafts' :
                                currentFolderId === 'unfiled' ? 'Unfiled Drafts' :
                                    folders.find(f => f.id === currentFolderId)?.name || 'Folder'}
                        </h1>

                        <div className="flex items-center gap-4">
                            <div className="relative group">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search details..."
                                    className="bg-black/40 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm focus:border-primary/50 focus:outline-none w-64 transition-all"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <select
                                className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-primary/50 focus:outline-none appearance-none cursor-pointer"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as SortOption)}
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="name-asc">Name (A-Z)</option>
                                <option value="name-desc">Name (Z-A)</option>
                            </select>
                        </div>
                    </div>

                    {/* Grouped Sections: BO1 → BO3 → BO5 */}
                    {(['BO1', 'BO3', 'BO5'] as const).map((fmt) => (
                        <div key={fmt} className="space-y-4 mb-10">
                            {groupedByFormat[fmt].length > 0 && (
                                <button
                                    onClick={() => setCollapsed(prev => ({ ...prev, [fmt]: !prev[fmt] }))}
                                    className="w-full flex items-center justify-between text-left bg-white/5 hover:bg-white/10 transition-colors border border-white/10 rounded-lg px-4 py-2"
                                >
                                    <div className="flex items-center gap-3">
                                        <ChevronDown
                                            className={cn(
                                                'w-4 h-4 transition-transform',
                                                collapsed[fmt] ? '-rotate-90' : 'rotate-0'
                                            )}
                                        />
                                        <span className="text-sm font-bold uppercase tracking-widest text-gray-300">
                                            {fmt === 'BO1' ? 'Best of 1' : fmt === 'BO3' ? 'Best of 3' : 'Best of 5'}
                                        </span>
                                    </div>
                                    <span className="text-xs font-mono text-gray-500">{groupedByFormat[fmt].length}</span>
                                </button>
                            )}

                            {!collapsed[fmt] && groupedByFormat[fmt].length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {groupedByFormat[fmt].map((series) => {
                                        const blueTeam = TEAMS.find(t => t.id === series.blueTeamId) || TEAMS[0];
                                        const redTeam = TEAMS.find(t => t.id === series.redTeamId) || TEAMS[1];
                                        const date = new Date(series.timestamp).toLocaleDateString(undefined, {
                                            month: 'short', day: 'numeric', year: 'numeric'
                                        });

                                        return (
                                            <div key={series.id} className="group relative bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors flex flex-col">
                                                <div className="p-6 flex-1">
                                                    {/* Top Row: Date & Actions */}
                                                    <div className="flex items-center justify-between mb-4">
                                                        <span className="text-xs font-mono text-gray-500 uppercase flex items-center gap-2">
                                                            <Calendar className="w-3 h-3" /> {date}
                                                        </span>

                                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            {/* Move to Folder Dropdown Logic could go here or a simple select */}
                                                            <select
                                                                className="bg-black/50 border border-white/10 rounded text-[10px] py-1 px-2 text-gray-400 focus:text-white outline-none"
                                                                value={series.folderId || ''}
                                                                onChange={(e) => handleMoveSeries(series.id, e.target.value || undefined)}
                                                            >
                                                                <option value="">Move...</option>
                                                                <option value="">Unfiled</option>
                                                                {folders.map(f => (
                                                                    <option key={f.id} value={f.id}>{f.name}</option>
                                                                ))}
                                                            </select>

                                                            <button
                                                                onClick={(e) => handleDeleteSeries(e, series.id)}
                                                                className="p-1.5 hover:bg-red-500/20 text-gray-500 hover:text-red-400 rounded transition-colors"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Series Name / Title */}
                                                    <div className="mb-6">
                                                        {editingSeriesId === series.id ? (
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    autoFocus
                                                                    className="bg-black/50 border border-white/20 rounded px-2 py-1 text-sm font-bold w-full"
                                                                    value={editingSeriesName}
                                                                    onChange={e => setEditingSeriesName(e.target.value)}
                                                                    onKeyDown={e => e.key === 'Enter' && handleUpdateSeriesName(series.id)}
                                                                    onBlur={() => handleUpdateSeriesName(series.id)}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div
                                                                className="flex items-center gap-2 group/title cursor-text"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    setEditingSeriesId(series.id);
                                                                    setEditingSeriesName(series.name || `${blueTeam.shortName} vs ${redTeam.shortName}`);
                                                                }}
                                                            >
                                                                <h3 className="text-lg font-bold text-white truncate max-w-[200px]">
                                                                    {series.name || `${blueTeam.shortName} vs ${redTeam.shortName}`}
                                                                </h3>
                                                                <Edit2 className="w-3 h-3 text-gray-600 opacity-0 group-hover/title:opacity-100 transition-opacity" />
                                                            </div>
                                                        )}
                                                        {/* Subtitle / Detail */}
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className={cn(
                                                                "text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest border",
                                                                series.format !== 'BO1' ? "bg-primary/10 text-primary border-primary/20" : "bg-gray-700/50 text-gray-300 border-gray-600/30"
                                                            )}>
                                                                {series.format}
                                                            </span>
                                                            <span className="text-xs text-gray-500">
                                                                • {series.games.length} Games
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Team Logos */}
                                                    <Link href={`/review/${series.id}`} className="block">
                                                        <div className="flex items-center justify-between bg-black/20 rounded-lg p-3 border border-white/5 hover:border-primary/30 transition-colors">
                                                            <div className="text-sm font-bold text-gray-300">{blueTeam.shortName}</div>
                                                            <div className="text-xs text-gray-600 font-bold">VS</div>
                                                            <div className="text-sm font-bold text-gray-300">{redTeam.shortName}</div>
                                                        </div>
                                                    </Link>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))}

                    {filteredSeries.length === 0 && (
                        <div className="py-20 text-center text-gray-500 border border-dashed border-white/10 rounded-xl">
                            No drafts found.
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

function SidebarItem({ active, icon: Icon, label, count, onClick }: {
    active: boolean; icon: any; label: string; count?: number; onClick: () => void;
}) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all",
                active ? "bg-primary/20 text-primary" : "hover:bg-white/5 text-gray-400 hover:text-gray-200"
            )}
        >
            <div className="flex items-center gap-3">
                <Icon className={cn("w-4 h-4", active && "text-primary")} />
                <span className="text-sm font-medium">{label}</span>
            </div>
            {count !== undefined && (
                <span className="text-xs font-mono opacity-50">{count}</span>
            )}
        </div>
    );
}
