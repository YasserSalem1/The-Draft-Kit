// drafting-and-reporting/components/TeamCard.tsx

'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface TeamCardProps {
  team: {
    name: string;
    id: string;
  };
  onSelect: (teamId: string, teamName: string) => void;
  isSelected: boolean;
}

const TeamCard: React.FC<TeamCardProps> = ({ team, onSelect, isSelected }) => {
  // Extract initials for team logo placeholder
  const initials = team.name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .substring(0, 3)
    .toUpperCase();

  return (
    <motion.button
      whileHover={{ scale: 1.03, y: -4 }}
      whileTap={{ scale: 0.97 }}
      className={`relative overflow-hidden p-6 rounded-2xl border-2 transition-all duration-300 min-h-[140px]
        ${isSelected 
          ? 'bg-gradient-to-br from-primary/30 to-primary/15 border-primary shadow-xl shadow-primary/30 ring-2 ring-primary/50' 
          : 'bg-surface-light/60 border-white/10 hover:border-primary/40 hover:bg-surface-light/80 hover:shadow-lg'
        }
      `}
      onClick={() => onSelect(team.id, team.name)}
    >
      {isSelected && (
        <div className="absolute top-3 right-3 w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-lg">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
      <div className="flex flex-col items-center text-center space-y-4 h-full justify-center">
        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center font-black text-3xl transition-all
          ${isSelected 
            ? 'bg-gradient-to-br from-primary to-primary/70 text-white shadow-lg shadow-primary/50' 
            : 'bg-surface text-gray-400'
          }
        `}>
          {initials}
        </div>
        <h3 className={`font-bold text-lg leading-tight px-2
          ${isSelected ? 'text-white' : 'text-gray-200'}
        `}>
          {team.name}
        </h3>
      </div>
    </motion.button>
  );
};

export default TeamCard;

