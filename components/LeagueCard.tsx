// drafting-and-reporting/components/LeagueCard.tsx

'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { League } from '@/lib/data/leagues';

interface LeagueCardProps {
  league: League;
  onSelect: (league: League) => void;
  isSelected: boolean;
}

const LeagueCard: React.FC<LeagueCardProps> = ({ league, onSelect, isSelected }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -4 }}
      whileTap={{ scale: 0.95 }}
      className={`relative overflow-hidden flex flex-col items-center p-6 rounded-2xl border-2 transition-all duration-300 min-h-[160px]
        ${isSelected 
          ? 'bg-gradient-to-br from-primary/30 to-primary/15 border-primary shadow-xl shadow-primary/30 ring-2 ring-primary/50' 
          : 'bg-surface-light/60 border-white/10 hover:border-primary/40 hover:bg-surface-light/80 hover:shadow-lg'
        }
      `}
      onClick={() => onSelect(league)}
    >
      {isSelected && (
        <div className="absolute top-3 right-3 w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-lg">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
      <div className="flex flex-col items-center space-y-4">
        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden transition-all
          ${isSelected ? 'ring-2 ring-primary/50 shadow-lg shadow-primary/30' : ''}
        `}>
          <Image 
            src={league.logoUrl} 
            alt={league.name} 
            width={80} 
            height={80} 
            className="object-contain"
            onError={(e) => {
              // Fallback to initials if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = `<span class="font-black text-3xl ${isSelected ? 'text-primary' : 'text-gray-400'}">${league.name.charAt(0)}</span>`;
              }
            }}
          />
        </div>
        <h3 className={`text-xl font-bold ${isSelected ? 'text-white' : 'text-gray-200'}`}>
          {league.name}
        </h3>
      </div>
    </motion.button>
  );
};

export default LeagueCard;

