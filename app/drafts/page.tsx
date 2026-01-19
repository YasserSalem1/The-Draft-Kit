import React from 'react';
import Link from 'next/link';
import { getMatchIds, getTeamDrafts } from '../../lib/data/drafts';
import DraftHistoryDisplay from '../../components/DraftHistoryDisplay';

interface DraftsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const DraftsAppIndexPage = async ({ searchParams }: DraftsPageProps) => {
  const resolvedSearchParams = await searchParams;
  const teamId = (resolvedSearchParams?.teamId as string) || "";
  const tournamentId = (resolvedSearchParams?.tournamentId as string) || "";

  if (!teamId || !tournamentId) {
    return <div className="flex justify-center items-center h-screen text-xl text-red-600">Error: Team ID and Tournament ID are required.</div>;
  }

  let allDrafts: any[] = [];
  let error: string | null = null;

  try {
    const data = await getTeamDrafts(tournamentId, teamId);
    if (data && typeof data === 'object' && 'message' in data) {
      throw new Error((data as any).message);
    }
    allDrafts = data as any[];
  } catch (err: any) {
    error = err.message || 'Failed to fetch drafts';
  }

  if (error) return <div className="flex justify-center items-center h-screen text-xl text-red-600">Error: {error}</div>;

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
               <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Global Archives</span>
            </div>
            <h1 className="text-6xl font-black text-white mb-2 tracking-tighter uppercase">Match History</h1>
            <p className="text-gray-400 font-bold uppercase text-xs tracking-[0.3em]">Detailed draft analysis & performance metrics</p>
          </div>
          <Link href="/reports" className="inline-flex items-center justify-center px-8 py-4 border border-white/10 text-sm font-black rounded-2xl text-white bg-surface-light/10 hover:bg-surface-light/20 transition-all backdrop-blur-md hover:scale-105 active:scale-95 shadow-2xl">
            &larr; Return to Reports
          </Link>
        </div>

        {allDrafts.length === 0 ? (
          <div className="bg-surface-light/10 backdrop-blur-xl rounded-[40px] p-24 text-center border border-white/10 shadow-3xl">
            <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-white/5">
                <svg className="w-10 h-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            </div>
            <p className="text-2xl text-gray-300 font-black uppercase tracking-tighter">No strategic data found</p>
            <p className="text-gray-500 mt-2 text-sm">The selected parameters returned no results from the data feed.</p>
          </div>
        ) : (
          <div className="bg-surface-light/5 backdrop-blur-sm rounded-[40px] p-1 border border-white/5 shadow-3xl">
            <div className="bg-background/40 rounded-[39px] p-10">
                <DraftHistoryDisplay drafts={allDrafts} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DraftsAppIndexPage;
