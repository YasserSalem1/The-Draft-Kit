import { Champion } from '@/lib/api/ddragon';

export type DraftPhase = 'BAN_1' | 'PICK_1' | 'BAN_2' | 'PICK_2' | 'COMPLETE';
export type DraftAction = 'BAN' | 'PICK';
export type DraftActionType = DraftAction; // alias for compatibility if needed
export type TeamSide = 'blue' | 'red'; // Consistent with team selection
export type SeriesFormat = 'BO1' | 'BO3' | 'BO5';

export interface DraftStep {
    phase: DraftPhase;
    side: TeamSide;
    action: DraftActionType;
    index: number; // 0-19 generally
}

export interface DraftState {
    isStarted: boolean;
    currentStepIndex: number;
    blueBans: (Champion | null)[];
    redBans: (Champion | null)[];
    bluePicks: (Champion | null)[];
    redPicks: (Champion | null)[];
    // Helper to easily check availability
    unavailableChampionIds: Set<string>;
    bluePlayerNames?: string[];
    redPlayerNames?: string[];
}

// Standard Competitive Draft Order (Snake Draft)
export const DRAFT_ORDER: DraftStep[] = [
    // Phase 1 Bans (3 per team) - ABABAB
    { phase: 'BAN_1', side: 'blue', action: 'BAN', index: 0 },
    { phase: 'BAN_1', side: 'red', action: 'BAN', index: 0 },
    { phase: 'BAN_1', side: 'blue', action: 'BAN', index: 1 },
    { phase: 'BAN_1', side: 'red', action: 'BAN', index: 1 },
    { phase: 'BAN_1', side: 'blue', action: 'BAN', index: 2 },
    { phase: 'BAN_1', side: 'red', action: 'BAN', index: 2 },

    // Phase 1 Picks (3 per team) - ABBAAB
    { phase: 'PICK_1', side: 'blue', action: 'PICK', index: 0 }, // B1
    { phase: 'PICK_1', side: 'red', action: 'PICK', index: 0 },  // R1
    { phase: 'PICK_1', side: 'red', action: 'PICK', index: 1 },  // R2
    { phase: 'PICK_1', side: 'blue', action: 'PICK', index: 1 }, // B2
    { phase: 'PICK_1', side: 'blue', action: 'PICK', index: 2 }, // B3
    { phase: 'PICK_1', side: 'red', action: 'PICK', index: 2 },  // R3

    // Phase 2 Bans (2 per team) - BABA (Red bans first in phase 2 usually? Actually standard is Red bans first in 2nd phase)
    // Standard: Red Ban, Blue Ban, Red Ban, Blue Ban
    { phase: 'BAN_2', side: 'red', action: 'BAN', index: 3 },
    { phase: 'BAN_2', side: 'blue', action: 'BAN', index: 3 },
    { phase: 'BAN_2', side: 'red', action: 'BAN', index: 4 },
    { phase: 'BAN_2', side: 'blue', action: 'BAN', index: 4 },

    // Phase 2 Picks (2 per team) - BAAB
    { phase: 'PICK_2', side: 'red', action: 'PICK', index: 3 },  // R4
    { phase: 'PICK_2', side: 'blue', action: 'PICK', index: 3 }, // B4
    { phase: 'PICK_2', side: 'blue', action: 'PICK', index: 4 }, // B5
    { phase: 'PICK_2', side: 'red', action: 'PICK', index: 4 },  // R5
];
