// drafting-and-reporting/components/TeamSelector.tsx

'use client';

import React, { useEffect, useState } from 'react';
import { graphqlRequest } from '@/lib/api';
import TeamCard from './TeamCard';

interface TeamNode {
  name: string;
  id: string;
}

interface GetTournamentResponse {
  tournament: {
    name: string;
    teams: TeamNode[];
  };
}

interface TeamSelectorProps {
  tournamentId: string;
  onSelectTeam: (teamId: string, teamName: string) => void;
}

const TeamSelector: React.FC<TeamSelectorProps> = ({ tournamentId, onSelectTeam }) => {
  const [teams, setTeams] = useState<TeamNode[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeams = async () => {
      setLoading(true);
      setError(null);
      try {
        const query = `
          query GetTournament {
            tournament(id: "${tournamentId}") {
              name
              teams{
                name
                id
              }
            }
          }
        `;
        const response = await graphqlRequest<GetTournamentResponse>(query);

        if (response.errors) {
          throw new Error(response.errors.map(err => err.message).join(', '));
        }

        setTeams(response.data?.tournament.teams || []);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch teams');
      } finally {
        setLoading(false);
      }
    };

    if (tournamentId) {
      fetchTeams();
    }
  }, [tournamentId]);

  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="w-full mt-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
        <p className="text-center text-gray-400 mt-4">Loading teams...</p>
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
  
  if (!teams.length) {
    return (
      <div className="w-full mt-8">
        <div className="bg-surface-light/30 border border-white/10 rounded-xl p-6 text-center">
          <p className="text-gray-400">No teams found for this tournament.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mt-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Select a Team</h2>
        <p className="text-gray-400 text-sm">Choose a team to generate the scouting report</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {teams.map((team) => (
          <TeamCard
            key={team.id}
            team={team}
            onSelect={(id, name) => {
              setSelectedTeamId(id);
              onSelectTeam(id, name);
            }}
            isSelected={selectedTeamId === team.id}
          />
        ))}
      </div>
    </div>
  );
};

export default TeamSelector;

