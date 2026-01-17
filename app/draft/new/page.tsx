'use client';

import { Suspense, useState, useEffect } from 'react';
import { TeamSelector } from '@/components/features/TeamSelector';
import { TEAMS, Team } from '@/lib/data/teams';
import { LEAGUES } from '@/lib/data/leagues';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

function DraftSetupContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [blueTeam, setBlueTeam] = useState<Team | null>(null);
    const [redTeam, setRedTeam] = useState<Team | null>(null);
    const [format, setFormat] = useState<'BO1' | 'BO3' | 'BO5'>('BO1');

    useEffect(() => {
        const blueId = searchParams.get('blue');
        const redId = searchParams.get('red');

        if (blueId) {
            const team = TEAMS.find(t => t.id === blueId);
            if (team) setBlueTeam(team);
        }

        if (redId) {
            const team = TEAMS.find(t => t.id === redId);
            if (team) setRedTeam(team);
        }
    }, [searchParams]);

    const handleStartDraft = () => {
        if (blueTeam && redTeam) {
            const blueLeague = LEAGUES.find(l => l.regionName === blueTeam.region);
            const redLeague = LEAGUES.find(l => l.regionName === redTeam.region);

            const params = new URLSearchParams({
                blue: blueTeam.id,
                red: redTeam.id,
                blueTournament: blueLeague?.parentId || '',
                redTournament: redLeague?.parentId || '',
                format: format,
            });

            const folderId = searchParams.get('folderId');
            if (folderId) {
                params.set('folderId', folderId);
            }

            router.push(`/draft?${params.toString()}`);
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center relative overflow-hidden p-6">

            {/* Back to Hub */}
            <Link href="/" className="absolute top-8 left-8 text-gray-400 hover:text-white flex items-center gap-2 transition-colors z-20">
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm font-bold uppercase tracking-widest">Back to Hub</span>
            </Link>

            <div className="z-10 text-center space-y-8 w-full max-w-6xl">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tighter uppercase mb-4">
                        <span className="text-primary drop-shadow-[0_0_25px_rgba(59,130,246,0.4)]">Draft</span> Simulation
                    </h1>
                    <p className="text-gray-400 max-w-[600px] mx-auto text-lg font-light tracking-wide">
                        Select two teams to initialize the competitive drafting phase.
                    </p>
                </motion.div>


                {/* Series Format Selection */}
                <div className="flex justify-center mb-8">
                    <div className="flex items-center gap-2 bg-black/40 p-1 rounded-full border border-white/10">
                        {(['BO1', 'BO3', 'BO5'] as const).map((fmt) => (
                            <button
                                key={fmt}
                                onClick={() => setFormat(fmt)}
                                className={`
                            px-6 py-2 rounded-full text-sm font-bold transition-all duration-300
                            ${format === fmt
                                        ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]'
                                        : 'text-gray-500 hover:text-white hover:bg-white/5'
                                    }
                        `}
                            >
                                {fmt}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Team Selection Area */}
                <div className="flex flex-col md:flex-row items-center justify-center gap-8 w-full relative">

                    {/* VS Badge */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 hidden md:flex items-center justify-center w-16 h-16 rounded-full bg-surface border border-white/10 shadow-xl">
                        <span className="font-bold text-gray-500 italic text-xl">VS</span>
                    </div>

                    <TeamSelector
                        side="blue"
                        selectedTeam={blueTeam}
                        onSelect={setBlueTeam}
                        otherSelectedTeam={redTeam}
                    />

                    <TeamSelector
                        side="red"
                        selectedTeam={redTeam}
                        onSelect={setRedTeam}
                        otherSelectedTeam={blueTeam}
                    />
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-16"
                >
                    <button
                        onClick={handleStartDraft}
                        disabled={!blueTeam || !redTeam}
                        className={`
              px-12 py-5 rounded-full font-bold tracking-widest uppercase transition-all duration-300 relative overflow-hidden group
              ${blueTeam && redTeam
                                ? 'bg-primary text-white shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_35px_rgba(59,130,246,0.6)] hover:scale-105'
                                : 'bg-white/5 text-gray-600 cursor-not-allowed border border-white/5'
                            }
            `}
                    >
                        <span className="relative z-10">Proceed to Draft</span>
                        {blueTeam && redTeam && (
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 transform" />
                        )}
                    </button>
                </motion.div>
            </div>

            {/* Background Ambience */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                {/* Background Image with Overlay */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="/esport.png"
                        alt="Background"
                        className="w-full h-full object-cover opacity-50 grayscale mix-blend-overlay"
                    />
                    <div className="absolute inset-0 bg-background/80" />
                </div>

                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/5 rounded-full blur-[120px]" />
            </div>
        </main>
    );
}

export default function DraftSetup() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#090A0F] flex items-center justify-center text-white">Loading...</div>}>
            <DraftSetupContent />
        </Suspense>
    );
}
