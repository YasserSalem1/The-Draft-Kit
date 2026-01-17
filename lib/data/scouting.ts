// drafting-and-reporting/lib/data/scouting.ts

import { graphqlRequest, LIVE_DATA_FEED_URL } from '../api';
import { getMatchIds, getSeriesState, getTeamsInTournament } from './drafts'; // Re-use from drafts data file

const TARGET_TEAM_ID = process.env.NEXT_PUBLIC_TARGET_TEAM_ID || '';
const TARGET_TEAM_NAME = process.env.NEXT_PUBLIC_TARGET_TEAM_NAME || '';
const TOURNAMENT_ID = process.env.NEXT_PUBLIC_TOURNAMENT_ID || '';

interface BanStats {
  champion: string;
  count: number;
  phase1: number;
  phase2: number;
}

export interface ScoutingReportData {
  team_name: string;
  team_logo?: string;
  games_count: number;
  player_stats_grouped: Record<string, { name: string; played: number; wins: number; blindPicks: number; counterPicks: number }[]>;
  draft_priorities: {
    blue_side: any;
    red_side: any;
  };
  most_banned_champions: {
    against_blue_side: BanStats[];
    against_red_side: BanStats[];
    by_blue_side: BanStats[];
    by_red_side: BanStats[];
  };
  most_picked_champions_by_slot: {
    blue1: [string, number][];
    red1_red2: [string, number][];
  };
  roster_stats: { Player: string; Role: string; Games: number; WinRate: number }[];
  champion_pools_by_player: Record<string, { Champion: string; Games: number; WinRate: string; KDA: string }[]>;
  // Add these for the new report page structure
  overview?: string;
  strategies?: string[];
  tendencies?: { name: string; role: string; tendency: string }[];
  famousPicks?: { name: string; rate: number }[];
  popularBans?: { name: string; rate: number }[];
  insight?: string;
}

// Main analysis function (mimicking run_analysis from Scouting.py)
export async function getScoutingReport(teamId: string = TARGET_TEAM_ID, tournamentIds: string | string[] = TOURNAMENT_ID): Promise<ScoutingReportData | { message: string }> {
  let matchIds: string[] = [];
  try {
    matchIds = await getMatchIds(teamId, tournamentIds);
  } catch (error: any) {
    console.error(`[getScoutingReport] Error fetching match IDs:`, error);
    return { message: `Error fetching match IDs: ${error.message}` };
  }

  if (!matchIds.length) {
    return { message: "No matches found." };
  }
  console.log(`Found ${matchIds.length} matches for team ${teamId}. IDs:`, matchIds);
  const targetStats: any[] = [];
  const targetDrafts: any[] = [];
  
  const blueSideBans: Record<string, { count: number; phase1: number; phase2: number }> = {};
  const redSideBans: Record<string, { count: number; phase1: number; phase2: number }> = {};
  const targetTeamBlueBans: Record<string, { count: number; phase1: number; phase2: number }> = {};
  const targetTeamRedBans: Record<string, { count: number; phase1: number; phase2: number }> = {};
  
  const b1Picks: Record<string, number> = {};
  const r1Picks: Record<string, number> = {};
  const r2Picks: Record<string, number> = {};

  let fetchedTeamName = TARGET_TEAM_NAME;
  let fetchedTeamLogo = '';
  let gamesCount = 0;

  // Try to get team logo from tournament data
  try {
    const tIds = Array.isArray(tournamentIds) ? tournamentIds : [tournamentIds];
    // Just use the first tournament to get the logo, assuming it's consistent
    const teams = await getTeamsInTournament(tIds[0]);
    const team = teams.find(t => String(t.id) === String(teamId));
    if (team && (team as any).logoUrl) {
      fetchedTeamLogo = (team as any).logoUrl;
    }
  } catch (e) {
    console.error("Failed to fetch team logo", e);
  }

  for (const mId of matchIds) {
    const stateData = await getSeriesState(mId);
    if (!stateData) {
      console.warn(`[Scouting] No state data for match ${mId}`);
      continue;
    }

    const games = stateData.games || [];
    if (!games.length) console.warn(`[Scouting] No games found in match ${mId}`);

    for (const game of games) {
      const teams = game.teams || [];
      const targetTeamObj = teams.find((t: any) => String(t.id) === String(teamId));
      if (!targetTeamObj) {
        console.warn(`[Scouting] Team ${teamId} not found in game ${game.id} (Match ${mId}). Teams: ${teams.map((t:any) => t.id).join(',')}`);
        continue;
      }
      gamesCount++;
      if (targetTeamObj.name) fetchedTeamName = targetTeamObj.name;
      const currentTargetTeamId = String(targetTeamObj.id);

      const teamSideMap: Record<string, string> = {};
      let firstPickTeamId: string | null = null;

      if (game.draftActions) {
        for (const action of game.draftActions) {
          if (action.type === 'pick') {
            firstPickTeamId = String(action.drafter.id);
            break;
          }
        }
      }

      if (firstPickTeamId) {
        teamSideMap[firstPickTeamId] = 'blue';
      } else if (teams.length > 0) {
        teamSideMap[String(teams[0].id)] = 'blue';
      }

      for (const t of teams) {
        const tId = String(t.id);
        if (!(tId in teamSideMap)) {
          teamSideMap[tId] = 'red';
        }
      }

      const roles = ['Top', 'Jungle', 'Mid', 'ADC', 'Support'];
      const champToRole: Record<string, { Role: string; Player: string; isBlind: boolean; isCounter: boolean }> = {};

      // Determine picks order for blind/counter pick detection
      if (game.draftActions) {
        const picksByRole: Record<string, { side: string; step: number }> = {};
        const draftPicks = game.draftActions.filter((a: any) => a.type === 'pick');
        
        // First pass: identify which side picked which role at which step
        // We need to map picked champions to roles for the target team
        // This is tricky because we only know the role after mapping players
      }

      // Re-map players to get champ to role mapping
      const teamChampToRole: Record<string, string> = {};
      const enemyTeamObj = teams.find((t: any) => String(t.id) !== String(teamId));
      const enemyChampToRole: Record<string, string> = {};

      for (const [idx, p] of targetTeamObj.players.entries()) {
        const role = roles[idx] || 'Sub';
        const charObj = p.character || p.hero || {};
        if (charObj.name) teamChampToRole[charObj.name] = role;
      }
      if (enemyTeamObj) {
        for (const [idx, p] of enemyTeamObj.players.entries()) {
          const role = roles[idx] || 'Sub';
          const charObj = p.character || p.hero || {};
          if (charObj.name) enemyChampToRole[charObj.name] = role;
        }
      }

      // Detect Blind/Counter picks
      const rolePickSteps: Record<string, { blueStep: number; redStep: number }> = {};
      roles.forEach(r => rolePickSteps[r] = { blueStep: 0, redStep: 0 });

      let stepCounter = 0;
      if (game.draftActions) {
        for (const action of game.draftActions) {
          stepCounter++;
          if (action.type === 'pick' && action.draftable?.name) {
            const champ = action.draftable.name;
            const side = teamSideMap[String(action.drafter?.id)];
            const role = teamChampToRole[champ] || enemyChampToRole[champ];
            if (role && rolePickSteps[role]) {
              if (side === 'blue') rolePickSteps[role].blueStep = stepCounter;
              else rolePickSteps[role].redStep = stepCounter;
            }
          }
        }
      }

      for (const [idx, p] of targetTeamObj.players.entries()) {
        const role = roles[idx] || 'Sub';
        const charObj = p.character || p.hero || {};
        const cName = charObj.name;

        if (cName) {
          const side = teamSideMap[currentTargetTeamId];
          const steps = rolePickSteps[role];
          let isBlind = false;
          let isCounter = false;

          if (steps && steps.blueStep > 0 && steps.redStep > 0) {
            if (side === 'blue') {
              if (steps.blueStep < steps.redStep) isBlind = true;
              else isCounter = true;
            } else {
              if (steps.redStep < steps.blueStep) isBlind = true;
              else isCounter = true;
            }
          }

          champToRole[cName] = { Role: role, Player: p.name, isBlind, isCounter };
          targetStats.push({
            Player: p.name,
            Role: role,
            Champion: cName,
            Win: targetTeamObj.won ? 1 : 0,
            Kills: p.kills || 0,
            Deaths: p.deaths || 0,
            Assists: p.killAssistsGiven || 0,
            isBlind,
            isCounter
          });
        }
      }

      let pickCounter = 0;
      let actionStep = 0;
      if (game.draftActions) {
        for (const action of game.draftActions) {
          actionStep++;
          const actionType = action.type;
          const draftedChamp = action.draftable?.name;
          const drafterId = String(action.drafter?.id);
          const side = teamSideMap[drafterId] || 'blue';

          if (actionType === 'pick') {
            pickCounter++;
            const playerInfo = champToRole[draftedChamp];

            if (playerInfo) {
              const slotMap = side === 'blue'
                ? { 1: 'B1', 4: 'B2', 5: 'B3', 8: 'B4', 9: 'B5' }
                : { 2: 'R1', 3: 'R2', 6: 'R3', 7: 'R4', 10: 'R5' };
              const rawSlot = slotMap[pickCounter as keyof typeof slotMap];

              if (rawSlot) {
                targetDrafts.push({
                  Player: playerInfo.Player,
                  Role: playerInfo.Role,
                  Slot: rawSlot,
                  Side: side,
                });
                if (drafterId === currentTargetTeamId) {
                  if (rawSlot === 'B1') b1Picks[draftedChamp] = (b1Picks[draftedChamp] || 0) + 1;
                  else if (rawSlot === 'R1') r1Picks[draftedChamp] = (r1Picks[draftedChamp] || 0) + 1;
                  else if (rawSlot === 'R2') r2Picks[draftedChamp] = (r2Picks[draftedChamp] || 0) + 1;
                }
              }
            }
          } else if (actionType === 'ban' && draftedChamp) {
            const isPhase1 = actionStep <= 6;
            const isPhase2 = actionStep >= 13 && actionStep <= 16;
            
            const updateBan = (record: Record<string, { count: number; phase1: number; phase2: number }>, champ: string) => {
              if (!record[champ]) record[champ] = { count: 0, phase1: 0, phase2: 0 };
              record[champ].count++;
              if (isPhase1) record[champ].phase1++;
              if (isPhase2) record[champ].phase2++;
            };

            if (drafterId !== currentTargetTeamId) {
              if (side === 'blue') updateBan(redSideBans, draftedChamp);
              else updateBan(blueSideBans, draftedChamp);
            } else {
              if (side === 'blue') updateBan(targetTeamBlueBans, draftedChamp);
              else updateBan(targetTeamRedBans, draftedChamp);
            }
          }
        }
      }
    }
  }

  if (!targetStats.length) {
    return { message: `No stats collected for ${teamId}.` };
  }

  // Convert targetStats to DataFrame like structure for calculations
  const df = targetStats;

  // Calculate KDA (simplified - in a real app, use a proper DataFrame library or direct calculation)
  df.forEach(player => {
    player.KDA_Val = (player.Kills + player.Assists) / (player.Deaths === 0 ? 1 : player.Deaths);
  });

  const dfDraft = targetDrafts;

  const dfDraftBlue = dfDraft.filter(d => d.Side === 'blue');
  const dfDraftRed = dfDraft.filter(d => d.Side === 'red');

  // Simplified crosstab logic - in real app, use proper grouping/aggregation
  const draftPivotBlue = dfDraftBlue.reduce((acc: any, curr) => {
    if (!acc[curr.Role]) acc[curr.Role] = {};
    acc[curr.Role][curr.Slot] = (acc[curr.Role][curr.Slot] || 0) + 1;
    return acc;
  }, {});
  // Similar for draftPivotRed

  const formatBans = (record: Record<string, { count: number; phase1: number; phase2: number }>): BanStats[] => {
    return Object.entries(record)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 10)
      .map(([champion, stats]) => ({
        champion,
        count: stats.count,
        phase1: stats.phase1,
        phase2: stats.phase2
      }));
  };

  const sortedBlueBans = formatBans(blueSideBans);
  const sortedRedBans = formatBans(redSideBans);
  const sortedTargetTeamBlueBans = formatBans(targetTeamBlueBans);
  const sortedTargetTeamRedBans = formatBans(targetTeamRedBans);

  const r1R2Picks: Record<string, number> = {};
  for (const champ in r1Picks) r1R2Picks[champ] = (r1R2Picks[champ] || 0) + r1Picks[champ];
  for (const champ in r2Picks) r1R2Picks[champ] = (r1R2Picks[champ] || 0) + r2Picks[champ];

  const sortedB1Picks = Object.entries(b1Picks).sort(([, a], [, b]) => b - a).slice(0, 5);
  const sortedR1R2Picks = Object.entries(r1R2Picks).sort(([, a], [, b]) => b - a).slice(0, 5);

  // Roster Stats
  const roster = df.reduce((acc: any[], curr: any) => {
    const existing = acc.find(item => item.Player === curr.Player && item.Role === curr.Role);
    if (existing) {
      existing.Games++;
      existing.Win += curr.Win;
    } else {
      acc.push({ Player: curr.Player, Role: curr.Role, Games: 1, Win: curr.Win });
    }
    return acc;
  }, []).map((item: any) => ({
    ...item,
    WinRate: (item.Win / item.Games) * 100,
  }));

  // Group player stats by player for the new format
  const groupedPlayerStats: Record<string, any[]> = {};
  df.forEach(stat => {
    if (!groupedPlayerStats[stat.Player]) {
      groupedPlayerStats[stat.Player] = [];
    }
    const existingChamp = groupedPlayerStats[stat.Player].find(c => c.name === stat.Champion);
    if (existingChamp) {
      existingChamp.played++;
      existingChamp.wins += stat.Win;
      if (stat.isBlind) existingChamp.blindPicks++;
      if (stat.isCounter) existingChamp.counterPicks++;
    } else {
      groupedPlayerStats[stat.Player].push({
        name: stat.Champion,
        played: 1,
        wins: stat.Win,
        blindPicks: stat.isBlind ? 1 : 0,
        counterPicks: stat.isCounter ? 1 : 0,
      });
    }
  });

  // Champion Pools by Player (simplified)
  const championPoolsByPlayer: Record<string, any[]> = {};
  Object.entries(groupedPlayerStats).forEach(([player, champions]) => {
    championPoolsByPlayer[player] = champions.map(champ => {
      const playerDf = df.filter(d => d.Player === player && d.Champion === champ.name);
      const totalGames = playerDf.length;
      const totalWins = playerDf.reduce((sum, d) => sum + d.Win, 0);
      const totalKDA = playerDf.reduce((sum, d) => sum + d.KDA_Val, 0);
      return {
        Champion: champ.name,
        Games: totalGames,
        WinRate: totalGames > 0 ? ((totalWins / totalGames) * 100).toFixed(0) : "0",
        KDA: totalGames > 0 ? (totalKDA / totalGames).toFixed(2) : "0.00",
      };
    }).sort((a, b) => b.Games - a.Games).slice(0, 5);
  });

  const reportData: ScoutingReportData = {
    team_name: fetchedTeamName,
    team_logo: fetchedTeamLogo,
    games_count: gamesCount,
    player_stats_grouped: groupedPlayerStats,
    draft_priorities: {
      blue_side: {}, 
      red_side: {},
    },
    most_banned_champions: {
      against_blue_side: sortedBlueBans,
      against_red_side: sortedRedBans,
      by_blue_side: sortedTargetTeamBlueBans,
      by_red_side: sortedTargetTeamRedBans,
    },
    most_picked_champions_by_slot: {
      blue1: sortedB1Picks,
      red1_red2: sortedR1R2Picks,
    },
    roster_stats: roster,
    champion_pools_by_player: championPoolsByPlayer,
    // Placeholder data for new fields in ReportDisplay
    overview: "This is a placeholder overview of the team's strategic identity and performance. Detailed analysis would go here.",
    strategies: ["Early Game Aggression", "Objective Control", "Scaling Compositions"],
    tendencies: [
        { name: "Zeus", role: "Top", tendency: "Prefers counter-picking and split-pushing." },
        { name: "Oner", role: "Jungle", tendency: "Focuses on early ganks and securing dragons." },
        { name: "Faker", role: "Mid", tendency: "Plays control mages and roams frequently." },
        { name: "Gumayusi", role: "ADC", tendency: "Favors high-damage ADCs with strong late-game scaling." },
        { name: "Keria", role: "Support", tendency: "Engage supports with strong crowd control." },
    ],
    famousPicks: [
        { name: "Lee Sin", rate: 75 },
        { name: "Azir", rate: 60 },
        { name: "Aphelios", rate: 55 },
    ],
    popularBans: [
        { name: "Renekton", rate: 80 },
        { name: "Lucian", rate: 70 },
        { name: "Thresh", rate: 65 },
    ],
    insight: "Focus on early objective control and lane priority to disrupt their rhythm.",
  };

  return reportData;
}

export const SCOUTING_DATA = {
  t1: {
    overview: "Fast-paced, objective-focused playstyle with high mechanical skill.",
    strategies: ["Early Dragon Priority", "Lane Dominance", "1-3-1 Split Push"],
    tendencies: [
      { name: "Zeus", role: "Top", tendency: "High resource carry top" },
      { name: "Oner", role: "Jungle", tendency: "Proactive pathing" },
      { name: "Faker", role: "Mid", tendency: "Playmaking & Control" },
      { name: "Gumayusi", role: "ADC", tendency: "Safe & Reliable" },
      { name: "Keria", role: "Support", tendency: "Unique picks & Roaming" }
    ],
    famousPicks: [
      { name: "Lee Sin", rate: 75 },
      { name: "Azir", rate: 60 },
      { name: "Jayce", rate: 55 }
    ],
    popularBans: [
      { name: "Renekton", rate: 80 },
      { name: "Lucian", rate: 70 },
      { name: "Nidalee", rate: 65 }
    ],
    insight: "Control the early vision around objectives to neutralize their proactive pathing."
  },
  geng: {
    overview: "Methodical, late-game scaling focused with exceptional teamfighting.",
    strategies: ["Cross-map trades", "Vision Control", "Late Game Front-to-Back"],
    tendencies: [
      { name: "Kiin", role: "Top", tendency: "Versatile & Solid" },
      { name: "Canyon", role: "Jungle", tendency: "Carry Jungle potential" },
      { name: "Chovy", role: "Mid", tendency: "Extreme CS & Pressure" },
      { name: "Peyz", role: "ADC", tendency: "Primary carry threat" },
      { name: "Lehends", role: "Support", tendency: "Vision & Peeling" }
    ],
    famousPicks: [
      { name: "Tristana", rate: 70 },
      { name: "Corki", rate: 65 },
      { name: "Sejuani", rate: 60 }
    ],
    popularBans: [
      { name: "Maokai", rate: 75 },
      { name: "Vi", rate: 65 },
      { name: "Taliyah", rate: 60 }
    ],
    insight: "Force favorable skirmishes before they reach their 3-item power spikes."
  }
};
