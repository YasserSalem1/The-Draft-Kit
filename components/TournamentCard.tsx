// drafting-and-reporting/components/TournamentCard.tsx

'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface TournamentCardProps {
  tournament: {
    name: string;
    id: string;
  };
  onSelect: (tournamentId: string, tournamentName: string) => void;
  isSelected: boolean;
}

const TournamentCard: React.FC<TournamentCardProps> = ({ tournament, onSelect, isSelected }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`relative overflow-hidden p-6 rounded-2xl border-2 transition-all duration-300
        ${isSelected 
          ? 'bg-gradient-to-br from-primary/20 to-primary/10 border-primary shadow-lg shadow-primary/25' 
          : 'bg-surface-light/50 border-white/10 hover:border-primary/30 hover:bg-surface-light/70'
        }
      `}
      onClick={() => onSelect(tournament.id, tournament.name)}
    >
      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
      <div className="flex flex-col items-center text-center space-y-3">
        <div className={`w-16 h-16 rounded-xl flex items-center justify-center font-bold text-2xl
          ${isSelected ? 'bg-primary/20 text-primary' : 'bg-surface text-gray-400'}
        `}>
          {tournament.name.charAt(0)}
        </div>
        <h3 className={`font-bold text-lg leading-tight px-2
          ${isSelected ? 'text-white' : 'text-gray-300'}
        `}>
          {tournament.name}
        </h3>
      </div>
    </motion.button>
  );
};

export default TournamentCard;

