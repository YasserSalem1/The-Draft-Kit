'use client';

import React, { createContext, useContext, useReducer, ReactNode, useMemo } from 'react';
import { DraftState, DRAFT_ORDER, DraftStep, TeamSide } from './types';
import { Champion } from '@/lib/api/ddragon';

type DraftAction =
    | { type: 'START_DRAFT' }
    | { type: 'SELECT_CHAMPION', champion: Champion }
    | { type: 'RESET_DRAFT' }
    | { type: 'UNDO_STEP' };

interface DraftContextType extends DraftState {
    currentStep: DraftStep | null;
    startDraft: () => void;
    selectChampion: (champion: Champion) => void;
    resetDraft: () => void;
    undoLastStep: () => void;
}

const initialState: DraftState = {
    isStarted: false,
    currentStepIndex: -1,
    blueBans: Array(5).fill(null),
    redBans: Array(5).fill(null),
    bluePicks: Array(5).fill(null),
    redPicks: Array(5).fill(null),
    unavailableChampionIds: new Set(),
};

const DraftContext = createContext<DraftContextType | undefined>(undefined);

function draftReducer(state: DraftState, action: DraftAction): DraftState {
    switch (action.type) {
        case 'START_DRAFT':
            return {
                ...state,
                isStarted: true,
                currentStepIndex: 0,
                unavailableChampionIds: new Set(), // clear
            };

        case 'RESET_DRAFT':
            return initialState;

        case 'SELECT_CHAMPION': {
            if (!state.isStarted || state.currentStepIndex >= DRAFT_ORDER.length) return state;

            const step = DRAFT_ORDER[state.currentStepIndex];
            const { champion } = action;

            // Prevent duplicate selection
            if (state.unavailableChampionIds.has(champion.id)) return state;

            const newState = { ...state };
            newState.unavailableChampionIds = new Set(state.unavailableChampionIds);
            newState.unavailableChampionIds.add(champion.id);

            if (step.action === 'BAN') {
                if (step.side === 'blue') {
                    const newBans = [...state.blueBans];
                    newBans[step.index] = champion;
                    newState.blueBans = newBans;
                } else {
                    const newBans = [...state.redBans];
                    newBans[step.index] = champion;
                    newState.redBans = newBans;
                }
            } else if (step.action === 'PICK') {
                if (step.side === 'blue') {
                    const newPicks = [...state.bluePicks];
                    newPicks[step.index] = champion;
                    newState.bluePicks = newPicks;
                } else {
                    const newPicks = [...state.redPicks];
                    newPicks[step.index] = champion;
                    newState.redPicks = newPicks;
                }
            }

            newState.currentStepIndex = state.currentStepIndex + 1;
            return newState;
        }

        case 'UNDO_STEP': {
            if (!state.isStarted || state.currentStepIndex <= 0) return state;

            const previousStepIndex = state.currentStepIndex - 1;
            const stepToUndo = DRAFT_ORDER[previousStepIndex];

            // Reconstruct state to remove the pick/ban at this index
            const newState = { ...state };
            newState.currentStepIndex = previousStepIndex;

            // Deep copy objects we are about to mutate
            newState.blueBans = [...state.blueBans];
            newState.redBans = [...state.redBans];
            newState.bluePicks = [...state.bluePicks];
            newState.redPicks = [...state.redPicks];
            newState.unavailableChampionIds = new Set(state.unavailableChampionIds);

            // Find the champion that was picked/banned to remove it from unavailable
            let championToRemove: Champion | null = null;

            if (stepToUndo.action === 'BAN') {
                if (stepToUndo.side === 'blue') {
                    championToRemove = newState.blueBans[stepToUndo.index];
                    newState.blueBans[stepToUndo.index] = null;
                } else {
                    championToRemove = newState.redBans[stepToUndo.index];
                    newState.redBans[stepToUndo.index] = null;
                }
            } else if (stepToUndo.action === 'PICK') {
                if (stepToUndo.side === 'blue') {
                    championToRemove = newState.bluePicks[stepToUndo.index];
                    newState.bluePicks[stepToUndo.index] = null;
                } else {
                    championToRemove = newState.redPicks[stepToUndo.index];
                    newState.redPicks[stepToUndo.index] = null;
                }
            }

            if (championToRemove) {
                newState.unavailableChampionIds.delete(championToRemove.id);
            }

            return newState;
        }

        default:
            return state;
    }
}

export function DraftProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(draftReducer, initialState);

    const currentStep = useMemo(() => {
        if (!state.isStarted || state.currentStepIndex >= DRAFT_ORDER.length) return null;
        return DRAFT_ORDER[state.currentStepIndex];
    }, [state.isStarted, state.currentStepIndex]);

    const value = {
        ...state,
        currentStep,
        startDraft: () => dispatch({ type: 'START_DRAFT' }),
        selectChampion: (c: Champion) => dispatch({ type: 'SELECT_CHAMPION', champion: c }),
        resetDraft: () => dispatch({ type: 'RESET_DRAFT' }),
        undoLastStep: () => dispatch({ type: 'UNDO_STEP' }),
    };

    return <DraftContext.Provider value={value}>{children}</DraftContext.Provider>;
}

export function useDraft() {
    const context = useContext(DraftContext);
    if (context === undefined) {
        throw new Error('useDraft must be used within a DraftProvider');
    }
    return context;
}
