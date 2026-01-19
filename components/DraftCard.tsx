// drafting-and-reporting/components/DraftCard.tsx

'use client';

import React from 'react';
import { ChampionIcon } from './ui/ChampionIcon';

interface DraftAction {
  series_id: string;
  game_index: number;
  step_index: number;
  action_type: 'pick' | 'ban';
  champion: string;
  drafter_id: string;
  side_of_action: string; // 'blue', 'red', 'unknown'
  team_name: string;
  is_winner?: boolean;
}

interface DraftCardProps {
  action: DraftAction;
}

const DraftCard: React.FC<DraftCardProps> = ({ action }) => {
  const isPick = action.action_type === 'pick';
  const cardClasses = isPick 
    ? "bg-blue-50 border-blue-100 ring-1 ring-blue-200" 
    : "bg-red-50 border-red-100 ring-1 ring-red-200 opacity-80 grayscale-[0.3]";

  return (
    <div className={`flex items-center p-3 border rounded-xl shadow-sm ${cardClasses} transition-all hover:shadow-md`}>
      <div className="mr-3">
        <ChampionIcon name={action.champion} size={48} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between mb-0.5">
          <p className="text-sm font-bold text-gray-900 truncate">{action.champion}</p>
          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${isPick ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'}`}>
            {action.action_type}
          </span>
        </div>
        <p className="text-[10px] text-gray-500 font-medium truncate uppercase tracking-tighter">
          {action.team_name}
        </p>
      </div>
    </div>
  );
};

export default DraftCard;

