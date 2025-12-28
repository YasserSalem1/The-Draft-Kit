import { SeriesFormat } from '@/lib/draft/types';
import { DraftState } from '@/lib/draft/types';
import { TEAMS } from '@/lib/data/teams';

export interface DraftFolder {
    id: string;
    name: string;
    createdAt: number;
}

export interface SavedSeries {
    id: string;
    timestamp: number;
    format: SeriesFormat;
    blueTeamId: string;
    redTeamId: string;
    blueWins: number;
    redWins: number;
    name?: string; // Custom user name
    folderId?: string; // Organization
    games: {
        draftState: DraftState;
        winner: 'blue' | 'red' | null;
        // Optional per-game Alternatives pool (per team)
        alternatives?: {
            blue: import('@/lib/api/ddragon').Champion[];
            red: import('@/lib/api/ddragon').Champion[];
        };
    }[];
}

const STORAGE_KEY = 'c9_draft_history';
const FOLDERS_KEY = 'c9_draft_folders';

// MOCK DATA: 1 Completed BO3 Series (T1 vs GEN.G)
export const MOCK_SERIES: SavedSeries = {
    id: 'mock-series-001',
    timestamp: Date.now() - 86400000, // 1 day ago
    format: 'BO3',
    blueTeamId: 't1',
    redTeamId: 'geng',
    blueWins: 2,
    redWins: 1,
    name: 'LCK Finals Rematch',
    games: [
        {
            draftState: {
                isStarted: true,
                currentStepIndex: 20,
                blueBans: [
                    { id: 'Vi', name: 'Vi', title: 'the Piltover Enforcer', tags: ['Fighter'], image: { full: 'Vi.png', sprite: '', group: '' } },
                    null, null
                ],
                redBans: [
                    { id: 'Azir', name: 'Azir', title: 'the Emperor of the Sands', tags: ['Mage'], image: { full: 'Azir.png', sprite: '', group: '' } },
                    null, null
                ],
                bluePicks: [
                    { id: 'Jayce', name: 'Jayce', title: 'the Defender of Tomorrow', tags: ['Fighter'], image: { full: 'Jayce.png', sprite: '', group: '' } },
                    { id: 'Sejuani', name: 'Sejuani', title: 'Fury of the North', tags: ['Tank'], image: { full: 'Sejuani.png', sprite: '', group: '' } },
                    null, null, null
                ],
                redPicks: [
                    { id: 'KSante', name: "K'Sante", title: 'the Pride of Nazumah', tags: ['Tank'], image: { full: 'KSante.png', sprite: '', group: '' } },
                    { id: 'Maokai', name: 'Maokai', title: 'the Twisted Treant', tags: ['Tank'], image: { full: 'Maokai.png', sprite: '', group: '' } },
                    null, null, null
                ],
                unavailableChampionIds: new Set(['Vi', 'Azir', 'Jayce', 'Sejuani', 'KSante', 'Maokai'])
            },
            winner: 'blue'
        },
        {
            draftState: {
                isStarted: true,
                currentStepIndex: 20,
                blueBans: [], redBans: [], bluePicks: [], redPicks: [], unavailableChampionIds: new Set()
            },
            winner: 'red'
        },
        {
            draftState: {
                isStarted: true,
                currentStepIndex: 20,
                blueBans: [], redBans: [], bluePicks: [], redPicks: [], unavailableChampionIds: new Set()
            },
            winner: 'blue'
        }
    ]
};

// --- Folders ---

export const getFolders = (): DraftFolder[] => {
    if (typeof window === 'undefined') return [];
    try {
        const stored = localStorage.getItem(FOLDERS_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("Failed to load folders", e);
        return [];
    }
};

export const createFolder = (name: string) => {
    if (typeof window === 'undefined') return;
    const folders = getFolders();
    const newFolder: DraftFolder = {
        id: crypto.randomUUID(),
        name,
        createdAt: Date.now()
    };
    folders.push(newFolder);
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
    return newFolder;
};

export const deleteFolder = (id: string) => {
    if (typeof window === 'undefined') return;
    const folders = getFolders();
    const newFolders = folders.filter(f => f.id !== id);
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(newFolders));

    // Move items in this folder to root (remove folderId)
    const series = getSavedSeries();
    let changed = false;
    const updatedSeries = series.map(s => {
        if (s.folderId === id) {
            changed = true;
            return { ...s, folderId: undefined };
        }
        return s;
    });

    if (changed) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSeries));
    }
};

export const renameFolder = (id: string, newName: string) => {
    if (typeof window === 'undefined') return;
    const folders = getFolders();
    const folder = folders.find(f => f.id === id);
    if (folder) {
        folder.name = newName;
        localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
    }
};

// --- Series ---

export const saveSeries = (series: SavedSeries) => {
    if (typeof window === 'undefined') return;
    const history = getSavedSeries();
    history.unshift(series);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
};

export const updateSeries = (id: string, updates: Partial<SavedSeries>) => {
    if (typeof window === 'undefined') return;
    const history = getSavedSeries();
    const index = history.findIndex(s => s.id === id);
    if (index !== -1) {
        history[index] = { ...history[index], ...updates };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    }
};

export const getSavedSeries = (): SavedSeries[] => {
    if (typeof window === 'undefined') return [MOCK_SERIES];
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const history = stored ? JSON.parse(stored) : [];

        // Ensure mock series is always present for demo if history is empty
        if (history.length === 0) return [MOCK_SERIES];

        const hasMock = history.some((s: SavedSeries) => s.id === MOCK_SERIES.id);
        if (!hasMock) {
            // Check if we should add it. For now, yes, to ensure there's data to see.
            return [...history, MOCK_SERIES];
        }

        return history;
    } catch (e) {
        console.error("Failed to load drafts", e);
        return [MOCK_SERIES];
    }
};

export const getSeriesById = (id: string): SavedSeries | undefined => {
    const all = getSavedSeries();
    return all.find(s => s.id === id);
}

export const deleteSeries = (id: string) => {
    if (typeof window === 'undefined') return;
    const history = getSavedSeries();
    const newHistory = history.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
};
