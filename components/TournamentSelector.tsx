// drafting-and-reporting/components/TournamentSelector.tsx

'use client';

import React, { useEffect, useState } from 'react';
import { graphqlRequest } from '@/lib/api';
import TournamentCard from './TournamentCard';

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

interface TournamentSelectorProps {
  regionName: string;
  onSelectTournament: (tournamentId: string, tournamentName: string) => void;
}

const TournamentSelector: React.FC<TournamentSelectorProps> = ({ regionName, onSelectTournament }) => {
  const [tournaments, setTournaments] = useState<TournamentNode[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);

  useEffect(() => {
    const fetchTournaments = async () => {
      setLoading(true);
      setError(null);
      setTotalCount(0);
      try {
        let allTournaments: TournamentNode[] = [];
        let hasNextPage = true;
        let cursor: string | null = null;
        let fetchedTotalCount = 0;

        // Fetch all pages of tournaments
        while (hasNextPage) {
          const query = cursor
            ? `
              query GetTournaments($cursor: Cursor!) {
                tournaments (filter:{name:{contains:"${regionName}"},hasChildren:{equals:true}}, after: $cursor) {
                  pageInfo {
                    hasPreviousPage
                    hasNextPage
                    startCursor
                    endCursor
                  }
                  totalCount
                  edges {
                    cursor
                    node {
                      name
                      id
                    }
                  }
                }
              }
            `
            : `
              query GetTournaments {
                tournaments (filter:{name:{contains:"${regionName}"},hasChildren:{equals:true}}) {
                  pageInfo {
                    hasPreviousPage
                    hasNextPage
                    startCursor
                    endCursor
                  }
                  totalCount
                  edges {
                    cursor
                    node {
                      name
                      id
                    }
                  }
                }
              }
            `;

          const variables = cursor ? { cursor } : {};
          const response = await graphqlRequest<GetTournamentsResponse>(query, variables);

          if (response.errors) {
            throw new Error(response.errors.map(err => err.message).join(', '));
          }

          const tournamentsData = response.data?.tournaments;
          if (tournamentsData) {
            const pageTournaments = tournamentsData.edges.map(edge => edge.node);
            allTournaments = [...allTournaments, ...pageTournaments];
            hasNextPage = tournamentsData.pageInfo.hasNextPage;
            cursor = tournamentsData.pageInfo.endCursor;
            // Set total count from first page
            if (fetchedTotalCount === 0 && tournamentsData.totalCount) {
              fetchedTotalCount = tournamentsData.totalCount;
            }
          } else {
            hasNextPage = false;
          }
        }

        setTournaments(allTournaments);
        setTotalCount(fetchedTotalCount);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch tournaments');
      } finally {
        setLoading(false);
      }
    };

    if (regionName) {
      fetchTournaments();
    }
  }, [regionName]);

  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="w-full mt-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
        <p className="text-center text-gray-400 mt-4">Loading tournaments...</p>
        {totalCount > 0 && (
          <p className="text-center text-gray-500 mt-2 text-sm">Found {totalCount} total tournament{totalCount !== 1 ? 's' : ''}</p>
        )}
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="w-full mt-8">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
          <p className="text-red-400 font-semibold">Error: {error}</p>
        </div>
      </div>
    );
  }
  
  if (!tournaments.length) {
    return (
      <div className="w-full mt-8">
        <div className="bg-surface-light/30 border border-white/10 rounded-xl p-6 text-center">
          <p className="text-gray-400">No tournaments found for {regionName}.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mt-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Select a Tournament</h2>
        <p className="text-gray-400 text-sm">
          {tournaments.length > 0 
            ? `Found ${tournaments.length} tournament${tournaments.length !== 1 ? 's' : ''} in ${regionName}`
            : `Choose a tournament from ${regionName} to continue`
          }
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tournaments.map((tournament) => (
          <TournamentCard
            key={tournament.id}
            tournament={tournament}
            onSelect={(id, name) => {
              setSelectedTournamentId(id);
              onSelectTournament(id, name);
            }}
            isSelected={selectedTournamentId === tournament.id}
          />
        ))}
      </div>
    </div>
  );
};

export default TournamentSelector;

