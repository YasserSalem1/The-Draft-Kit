// drafting-and-reporting/components/DraftHistoryDisplay.tsx

'use client';

import React from 'react';
import DraftCard from './DraftCard';

interface DraftAction {
  series_id: string;
  game_index: number;
  action_type: 'pick' | 'ban';
  champion: string;
  drafter_id: string;
  side_of_action: string;
  team_name: string;
}

interface DraftHistoryDisplayProps {
  drafts: DraftAction[];
}

const DraftHistoryDisplay: React.FC<DraftHistoryDisplayProps> = ({ drafts }) => {
  if (!drafts || drafts.length === 0) {
    return <p className="text-center text-gray-600 text-lg">No draft history available for this series.</p>;
  }

  // Group drafts by game for better readability
  const draftsByGame = drafts.reduce((acc: Record<number, DraftAction[]>, action) => {
    if (!acc[action.game_index]) {
      acc[action.game_index] = [];
    }
    acc[action.game_index].push(action);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      {Object.entries(draftsByGame).map(([gameIndex, gameDrafts]) => (
        <div key={gameIndex} className="bg-white shadow-lg rounded-xl p-6">
          <h3 className="text-2xl font-bold mb-4 text-gray-800">Game {parseInt(gameIndex, 10) + 1}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {gameDrafts.map((action, idx) => (
              <DraftCard key={`${action.series_id}-${action.game_index}-${idx}`} action={action} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DraftHistoryDisplay;

