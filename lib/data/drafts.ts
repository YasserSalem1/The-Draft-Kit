// drafting-and-reporting/lib/data/drafts.ts

import { graphqlRequest, LIVE_DATA_FEED_URL } from '../api';

const TARGET_TEAM_ID = process.env.NEXT_PUBLIC_TARGET_TEAM_ID || '';
const TOURNAMENT_ID = process.env.NEXT_PUBLIC_TOURNAMENT_ID || '';

interface AllSeriesResponse {
  allSeries: {
    edges: {
      node: {
        id: string;
      };
    }[];
  };
}

interface TournamentNode {
  name: string;
  id: string;
}

interface GetTournamentsResponse {
  tournaments: {
    pageInfo: {
      hasPreviousPage: boolean;
      hasNextPage: boolean;
      startCursor: string;
      endCursor: string;
    };
    totalCount: number;
    edges: {
      cursor: string;
      node: TournamentNode;
    }[];
  };
}

interface GetTournamentTeamsResponse {
  tournament: {
    name: string;
    teams: TournamentNode[];
  };
}

// Helper to get match IDs
export async function getMatchIds(teamId: string = TARGET_TEAM_ID, tournamentIds: string | string[] = TOURNAMENT_ID): Promise<string[]> {
  const tIds = Array.isArray(tournamentIds) ? tournamentIds : [tournamentIds];
  const query = `
    query AllSeries {
      allSeries(
        filter: {
          teamIds: { in: ["${teamId}"] }
          tournament: {
            id: { in: ${JSON.stringify(tIds)} }
            title: { id: { in: ["3"] } }
            includeChildren: { equals: true }
          }
        },
        first: 50
      ) {
        edges {
          node {
            id
          }
        }
      }
    }
  `;
  const response = await graphqlRequest<AllSeriesResponse>(query);
  return response.data?.allSeries?.edges.map(edge => edge.node.id) || [];
}

// Helper to get series state
export async function getTournaments(regionName: string, parentId?: string): Promise<TournamentNode[]> {
  const query = `
    query GetTournaments {
      tournaments (filter: {name: {contains: "${regionName}"}, hasChildren: {equals: true}}, first: 50) {
        edges {
          node {
            name
            id
            parent {
              id
            }
          }
        }
      }
    }
  `;
  
  const response = await graphqlRequest<any>(query);
  if (response.errors) {
    throw new Error(response.errors.map((err: any) => err.message).join(', '));
  }

  let tournaments = response.data?.tournaments.edges.map((edge: any) => edge.node) || [];
  
  if (parentId) {
    tournaments = tournaments.filter((t: any) => t.parent?.id === parentId);
  }
  
  return tournaments;
}

export async function getTeamsInTournament(tournamentId: string): Promise<TournamentNode[]> {
  const query = `
    query GetTournament {
      tournament(id: "${tournamentId}") {
        name
        teams{
          name
          id
          logoUrl
        }
      }
    }
  `;
  const response = await graphqlRequest<GetTournamentTeamsResponse>(query);
  if (response.errors) {
    throw new Error(response.errors.map(err => err.message).join(', '));
  }
  return response.data?.tournament.teams || [];
}

export async function getSeriesState(seriesId: string): Promise<any> {
  const query = `
    query SeriesState {
      seriesState(id: "${seriesId}") {
        games {
          draftActions {
            type
            sequenceNumber
            drafter {
              id
            }
            draftable {
              name
            }
          }
          teams {
            players {
              character {
                name
                id
              }
              id
              name
              kills
              killAssistsGiven
              deaths
            }
            name
            id
            won
          }
        }
        format
      }
    }
  `;
  const response = await graphqlRequest<{ seriesState: any }>(query, {}, LIVE_DATA_FEED_URL);
  return response.data?.seriesState;
}

export async function getTeamDrafts(tournamentId: string = TOURNAMENT_ID, teamId: string = TARGET_TEAM_ID, seriesId?: string) {
  let matchIds = await getMatchIds(teamId, tournamentId);

  if (seriesId) {
    matchIds = matchIds.filter(id => id === seriesId);
  }

  if (!matchIds.length) {
    return { message: `No matches found for team ${teamId} in tournament ${tournamentId}.` };
  }

  const allDraftActions: any[] = [];

  for (const mId of matchIds) {
    const stateData = await getSeriesState(mId);
    if (!stateData) {
      continue;
    }

    const games = stateData.games || [];
    for (const game of games) {
      const teams = game.teams || [];
      const targetTeamObj = teams.find((t: any) => String(t.id) === teamId);

      if (!targetTeamObj) {
        continue;
      }

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

      if (game.draftActions) {
        for (const [gameIndex, action] of game.draftActions.entries()) {
          const actionType = action.type;
          const draftedChamp = action.draftable?.name;
          const drafterId = String(action.drafter?.id);
          const sideOfAction = teamSideMap[drafterId] || 'unknown';

          const draftInfo = {
            series_id: mId,
            game_index: gameIndex,
            action_type: actionType,
            champion: draftedChamp,
            drafter_id: drafterId,
            side_of_action: sideOfAction,
            team_name: teams.find((t: any) => String(t.id) === drafterId)?.name || 'Unknown Team',
          };

          allDraftActions.push(draftInfo);
        }
      }
    }
  }

  return allDraftActions;
}
