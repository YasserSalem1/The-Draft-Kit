import React from 'react';
import DraftHistoryDisplay from '../../../components/DraftHistoryDisplay';
import Link from 'next/link';
import { getTeamDrafts } from '../../../lib/data/drafts';

interface DraftAction {
  series_id: string;
  game_index: number;
  step_index: number;
  action_type: 'pick' | 'ban';
  champion: string;
  drafter_id: string;
  side_of_action: string;
  team_name: string;
}

interface PageProps {
  params: Promise<{ seriesId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const SeriesDraftHistoryAppPage = async ({ params, searchParams }: PageProps) => {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const seriesId = resolvedParams.seriesId;
  const teamId = (resolvedSearchParams?.teamId as string) || "";
  const tournamentId = (resolvedSearchParams?.tournamentId as string) || "";

  if (!seriesId || !teamId || !tournamentId) {
    return <div className="flex justify-center items-center h-screen text-xl text-red-600">Error: Series ID, Team ID, and Tournament ID are required.</div>;
  }

  let drafts: DraftAction[] | null = null;
  let error: string | null = null;

  try {
    const data = await getTeamDrafts(tournamentId, teamId, seriesId);
    if (data && typeof data === 'object' && 'message' in data) {
      throw new Error((data as any).message);
    }
    drafts = data as DraftAction[];
  } catch (err: any) {
    error = err.message || 'Failed to fetch drafts';
  }

  if (error) return <div className="flex justify-center items-center h-screen text-xl text-red-600">Error: {error}</div>;
  if (!drafts) return <div className="flex justify-center items-center h-screen text-xl">No draft data.</div>;

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 pointer-events-none">
          <img
              src="/esport.png"
              alt="Background"
              className="w-full h-full object-cover opacity-20 grayscale mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-background/90" />
          <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-16 gap-6 pt-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
               <span className="px-3 py-1 bg-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-primary/30">Intelligence Hub</span>
               <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
               <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Series Breakdown</span>
            </div>
            <h1 className="text-6xl font-black text-white mb-2 tracking-tighter uppercase">Series Breakdown</h1>
            <p className="text-gray-400 font-bold uppercase text-xs tracking-[0.3em]">Individual game analysis for the selected series</p>
          </div>
          <Link href={`/drafts?teamId=${teamId}&tournamentId=${tournamentId}`} className="inline-flex items-center justify-center px-8 py-4 border border-white/10 text-sm font-black rounded-2xl text-white bg-surface-light/10 hover:bg-surface-light/20 transition-all backdrop-blur-md hover:scale-105 active:scale-95 shadow-2xl">
            &larr; Back to All Drafts
          </Link>
        </div>

        <div className="bg-surface-light/5 backdrop-blur-sm rounded-[40px] p-1 border border-white/5 shadow-3xl">
          <div className="bg-background/40 rounded-[39px] p-10">
              <DraftHistoryDisplay drafts={drafts} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeriesDraftHistoryAppPage;
