// drafting-and-reporting/lib/data/leagues.ts

export interface League {
  id: string;
  name: string;
  regionName: string; // Used for querying tournaments
  logoUrl: string; // Placeholder for now
  parentId?: string; // Parent ID for tournament filtering
}

export const LEAGUES: League[] = [
  { id: 'lck', name: 'LCK', regionName: 'LCK', logoUrl: '/tournamentLogos/lck_logo.png', parentId: '826679' },
  { id: 'lpl', name: 'LPL', regionName: 'LPL', logoUrl: '/tournamentLogos/lpl_logo.png', parentId: '826789' },
  { id: 'lec', name: 'LEC', regionName: 'LEC', logoUrl: '/tournamentLogos/lec_logo.png', parentId: '826906' },
  { id: 'lcs', name: 'LCS', regionName: 'LCS', logoUrl: '/tournamentLogos/lcs_logo.png', parentId: '826763' },
  { id: 'lta-north', name: 'LTA North', regionName: 'LTA North', logoUrl: '/tournamentLogos/lta_north_logo.png', parentId: '826763' },
  { id: 'lta-south', name: 'LTA South', regionName: 'LTA South', logoUrl: '/tournamentLogos/lta_south_logo.png', parentId: '826775' },
];

