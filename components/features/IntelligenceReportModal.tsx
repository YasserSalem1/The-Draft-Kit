'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { X, BrainCircuit, Loader2 } from 'lucide-react';
import { getChampionIconUrl, getLatestVersion, getChampions, Champion } from '@/lib/api/ddragon';

interface IntelligenceReportModalProps {
    onClose: () => void;
    blueTeam: any;
    redTeam: any;
}

export function IntelligenceReportModal({ onClose, blueTeam, redTeam }: IntelligenceReportModalProps) {
    const [strategy, setStrategy] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [version, setVersion] = useState('');
    const [champions, setChampions] = useState<Champion[]>([]);

    useEffect(() => {
        async function init() {
            try {
                const v = await getLatestVersion();
                const data = await getChampions();
                setVersion(v);
                setChampions(data);

                // Fetch strategy
                const res = await fetch('http://localhost:5001/strategy', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        blueTeam: { name: blueTeam.name, players: blueTeam.players },
                        redTeam: { name: redTeam.name, players: redTeam.players }
                    })
                });

                if (!res.ok) throw new Error("Failed to load strategy");

                const strategyData = await res.json();
                setStrategy(strategyData);
            } catch (err) {
                console.error(err);
                setError("Could not load Intelligence Report.");
            } finally {
                setLoading(false);
            }
        }
        init();
    }, [blueTeam, redTeam]);

    const getChampImage = (name: string) => {
        const champ = champions.find(c => c.name.toLowerCase() === name.toLowerCase());
        if (!champ) {
            // Try fuzzy match or finding by partial name if exact match fails
            const fuzzy = champions.find(c => c.name.toLowerCase().includes(name.toLowerCase()));
            if (fuzzy) return getChampionIconUrl(version, fuzzy.image.full);
            return '';
        }
        return getChampionIconUrl(version, champ.image.full);
    };

    const renderPool = (title: string, list: string[], color: 'blue' | 'red') => (
        <div className={`rounded-xl border ${color === 'blue' ? 'border-blue-500/20 bg-blue-900/10' : 'border-red-500/20 bg-red-900/10'} p-4 flex flex-col gap-3`}>
            <h4 className={`text-xs font-black uppercase tracking-widest ${color === 'blue' ? 'text-blue-400' : 'text-red-400'}`}>{title}</h4>
            <div className="grid grid-cols-5 gap-2">
                {list?.map((name, i) => (
                    <div key={i} className="flex flex-col items-center gap-1 group">
                        <div className="w-10 h-10 rounded-full border border-white/10 overflow-hidden relative group-hover:border-white/50 transition-colors">
                            {getChampImage(name) && <img src={getChampImage(name)} alt={name} className="w-full h-full object-cover" />}
                        </div>
                        <span className="text-[9px] text-gray-400 uppercase font-bold truncate w-full text-center group-hover:text-white transition-colors">{name}</span>
                    </div>
                )) || <span className="text-gray-600 text-xs">No Data</span>}
            </div>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-8"
        >
            <button onClick={onClose} className="absolute top-8 right-8 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors">
                <X className="w-6 h-6" />
            </button>

            <div className="max-w-6xl w-full h-[85vh] bg-[#0C0E14] border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl relative">

                {/* Header */}
                <div className="h-20 border-b border-white/5 flex items-center px-8 bg-gradient-to-r from-cyan-900/20 to-transparent">
                    <BrainCircuit className="w-8 h-8 text-cyan-400 mr-4" />
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Match Intelligence</h2>
                        <div className="text-xs font-bold text-cyan-500 uppercase tracking-widest">Pre-Match Strategy Analysis</div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center gap-4 text-cyan-500">
                            <Loader2 className="w-12 h-12 animate-spin" />
                            <span className="text-sm uppercase tracking-widest font-bold">Accessing Secure Database...</span>
                        </div>
                    ) : error ? (
                        <div className="h-full flex items-center justify-center text-red-500 font-bold uppercase tracking-widest">
                            {error}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-12">
                            {/* Blue Side */}
                            <div className="space-y-6">
                                <h3 className="text-xl font-black text-blue-500 uppercase italic tracking-tighter border-b border-blue-500/20 pb-2">{blueTeam.name} Strategy</h3>

                                {renderPool("Phase 1 Bans", strategy.blue_ban_phase_1, 'blue')}
                                {renderPool("Phase 1 Picks (Core)", strategy.blue_pick_phase_1, 'blue')}
                                {renderPool("Phase 2 Bans", strategy.blue_ban_phase_2, 'blue')}
                                {renderPool("Phase 2 Picks (Rounding)", strategy.blue_pick_phase_2, 'blue')}
                            </div>

                            {/* Red Side */}
                            <div className="space-y-6">
                                <h3 className="text-xl font-black text-red-500 uppercase italic tracking-tighter border-b border-red-500/20 pb-2">{redTeam.name} Strategy</h3>

                                {renderPool("Phase 1 Bans", strategy.red_ban_phase_1, 'red')}
                                {renderPool("Phase 1 Picks (Core)", strategy.red_pick_phase_1, 'red')}
                                {renderPool("Phase 2 Bans", strategy.red_ban_phase_2, 'red')}
                                {renderPool("Phase 2 Picks (Rounding)", strategy.red_pick_phase_2, 'red')}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
