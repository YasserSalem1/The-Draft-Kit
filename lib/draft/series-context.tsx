'use client';

import React, { createContext, useContext, useMemo, useReducer, ReactNode } from 'react';
import { DraftState, SeriesFormat } from '@/lib/draft/types';
import type { Champion } from '@/lib/api/ddragon';

type Winner = 'blue' | 'red' | null;

interface GameRecord {
  draftState: DraftState;
  winner: Winner;
  alternatives?: { blue: Champion[]; red: Champion[] };
}

interface SeriesState {
  format: SeriesFormat;
  games: GameRecord[];
  currentGameIndex: number;
  blueWins: number;
  redWins: number;
  fearlessBans: Set<string>; // champions restricted due to wins in prior games
  currentAlternatives: { blue: Champion[]; red: Champion[] };
}

type SeriesAction =
  | { type: 'INIT'; format: SeriesFormat }
  | { type: 'RESET' }
  | { type: 'COMPLETE_GAME'; draftState: DraftState; winner: Winner }
  | { type: 'ADD_ALT'; side: 'blue' | 'red'; champion: Champion }
  | { type: 'REMOVE_ALT'; side: 'blue' | 'red'; championId: string };

const initialSeriesState: SeriesState = {
  format: 'BO1',
  games: [],
  currentGameIndex: 0,
  blueWins: 0,
  redWins: 0,
  fearlessBans: new Set(),
  currentAlternatives: { blue: [], red: [] },
};

function calcFearlessBans(games: GameRecord[]): Set<string> {
  const bans = new Set<string>();
  for (const g of games) {
    if (g.winner === 'blue') {
      g.draftState.bluePicks.forEach(c => c && bans.add(c.id));
    } else if (g.winner === 'red') {
      g.draftState.redPicks.forEach(c => c && bans.add(c.id));
    }
  }
  return bans;
}

function seriesReducer(state: SeriesState, action: SeriesAction): SeriesState {
  switch (action.type) {
    case 'INIT': {
      return {
        ...initialSeriesState,
        format: action.format,
      };
    }
    case 'RESET':
      return initialSeriesState;
    case 'COMPLETE_GAME': {
      const games = [...state.games, { draftState: action.draftState, winner: action.winner, alternatives: state.currentAlternatives }];
      const blueWins = games.filter(g => g.winner === 'blue').length;
      const redWins = games.filter(g => g.winner === 'red').length;
      const fearlessBans = calcFearlessBans(games);
      return {
        ...state,
        games,
        blueWins,
        redWins,
        currentGameIndex: games.length,
        fearlessBans,
        currentAlternatives: { blue: [], red: [] },
      };
    }
    case 'ADD_ALT': {
      const list = state.currentAlternatives[action.side];
      // Cap 5 and prevent duplicates by id
      if (list.length >= 5 || list.some(c => c.id === action.champion.id)) return state;
      const next = { ...state.currentAlternatives };
      next[action.side] = [...list, action.champion];
      return { ...state, currentAlternatives: next };
    }
    case 'REMOVE_ALT': {
      const next = { ...state.currentAlternatives };
      next[action.side] = next[action.side].filter(c => c.id !== action.championId);
      return { ...state, currentAlternatives: next };
    }
    default:
      return state;
  }
}

interface SeriesContextType extends SeriesState {
  initializeSeries: (format: SeriesFormat) => void;
  completeGame: (winner: Winner, draftState: DraftState) => void;
  resetSeries: () => void;
  isSeriesComplete: boolean;
  addAlternative: (side: 'blue' | 'red', champion: Champion) => void;
  removeAlternative: (side: 'blue' | 'red', championId: string) => void;
}

const SeriesContext = createContext<SeriesContextType | undefined>(undefined);

export function SeriesProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(seriesReducer, initialSeriesState);

  const isSeriesComplete = useMemo(() => {
    const needed = state.format === 'BO5' ? 3 : state.format === 'BO3' ? 2 : 1;
    return state.blueWins >= needed || state.redWins >= needed;
  }, [state.format, state.blueWins, state.redWins]);

  const actions = useMemo(() => ({
    initializeSeries: (format: SeriesFormat) => dispatch({ type: 'INIT', format }),
    completeGame: (winner: Winner, draftState: DraftState) => dispatch({ type: 'COMPLETE_GAME', winner, draftState }),
    resetSeries: () => dispatch({ type: 'RESET' }),
    addAlternative: (side: 'blue' | 'red', champion: Champion) => dispatch({ type: 'ADD_ALT', side, champion }),
    removeAlternative: (side: 'blue' | 'red', championId: string) => dispatch({ type: 'REMOVE_ALT', side, championId }),
  }), []);

  const value: SeriesContextType = useMemo(() => ({
    ...state,
    isSeriesComplete,
    ...actions
  }), [state, isSeriesComplete, actions]);

  return <SeriesContext.Provider value={value}>{children}</SeriesContext.Provider>;
}

export function useSeries() {
  const ctx = useContext(SeriesContext);
  if (!ctx) throw new Error('useSeries must be used within a SeriesProvider');
  return ctx;
}
