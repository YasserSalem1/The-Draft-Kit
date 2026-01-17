'use client';

import { TEAMS } from '@/lib/data/teams';
import { MatchIntelligenceReport } from './MatchIntelligenceReport';

interface ScoutingStatsProps {
    blueTeam: typeof TEAMS[0];
    redTeam: typeof TEAMS[0];
}

export function ScoutingStats({ blueTeam, redTeam }: ScoutingStatsProps) {
    if (!blueTeam || !redTeam) return null;
    return <MatchIntelligenceReport blueTeam={blueTeam} redTeam={redTeam} />;
}
