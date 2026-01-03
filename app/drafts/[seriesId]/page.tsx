import React from 'react';
import DraftHistoryDisplay from '../../../components/DraftHistoryDisplay';
import Link from 'next/link';
import { getTeamDrafts } from '../../../lib/data/drafts';

interface DraftAction {
  series_id: string;
  game_index: number;
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
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-4xl font-extrabold text-center mb-8">Draft History for Series: {seriesId}</h1>
      <Link href={`/drafts?teamId=${teamId}&tournamentId=${tournamentId}`} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-md transition duration-300 ease-in-out shadow-md mb-6 inline-block">
          &larr; Back to All Drafts
      </Link>
      <DraftHistoryDisplay drafts={drafts} />
    </div>
  );
};

export default SeriesDraftHistoryAppPage;
