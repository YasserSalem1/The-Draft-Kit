'use client';

import { getChampionIconUrlByName } from '@/lib/api/ddragon';

interface ChampionIconProps {
  name: string;
  version?: string;
  size?: number;
}

export const ChampionIcon = ({ name, version = '16.1.1', size = 40 }: ChampionIconProps) => (
  <div 
    className="relative overflow-hidden rounded-lg border border-white/10 bg-surface shadow-md flex-shrink-0"
    style={{ width: size, height: size }}
  >
    <img
      src={getChampionIconUrlByName(version, name)}
      alt={name}
      className="object-cover w-full h-full scale-105"
      onError={(e) => {
        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1a1a1a&color=fff&size=128`;
      }}
    />
  </div>
);
