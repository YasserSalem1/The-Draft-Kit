// drafting-and-reporting/components/DraftCard.tsx

'use client';

import React from 'react';

interface DraftAction {
  series_id: string;
  game_index: number;
  action_type: 'pick' | 'ban';
  champion: string;
  drafter_id: string;
  side_of_action: string; // 'blue', 'red', 'unknown'
  team_name: string;
}

interface DraftCardProps {
  action: DraftAction;
}

const DraftCard: React.FC<DraftCardProps> = ({ action }) => {
  const isPick = action.action_type === 'pick';
  const cardClasses = isPick ? "bg-green-100 border-green-300" : "bg-red-100 border-red-300";
  const iconUrl = `/placeholders/${action.champion.toLowerCase().replace(/[^a-z0-9]/g, '')}.png`; // Placeholder for champion icon

  return (
    <div className={`flex items-center p-4 border rounded-lg shadow-sm ${cardClasses} mb-4`}>
      <img src={iconUrl} alt={action.champion} className="w-10 h-10 rounded-full mr-4" onError={(e) => { e.currentTarget.src = '/placeholders/default.png'; }} />
      <div>
        <p className="text-lg font-semibold">{action.champion}</p>
        <p className="text-sm text-gray-700">Action: <span className="font-medium">{action.action_type.toUpperCase()}</span></p>
        <p className="text-sm text-gray-700">Team: <span className="font-medium">{action.team_name} ({action.side_of_action})</span></p>
        {/* <p className="text-xs text-gray-500">Series: {action.series_id}, Game: {action.game_index}</p> */}
      </div>
    </div>
  );
};

export default DraftCard;

