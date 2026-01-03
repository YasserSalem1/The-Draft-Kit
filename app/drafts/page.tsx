import React from 'react';
import Link from 'next/link';
import { getMatchIds } from '../../lib/data/drafts';

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

  let seriesIds: string[] = [];
  let error: string | null = null;

  try {
    seriesIds = await getMatchIds(teamId, tournamentId);
  } catch (err: any) {
    error = err.message || 'Failed to fetch series IDs';
  }

  if (error) return <div className="flex justify-center items-center h-screen text-xl text-red-600">Error: {error}</div>;
  if (!seriesIds.length) return <div className="flex justify-center items-center h-screen text-xl">No series found for the selected team and tournament.</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-4xl font-extrabold text-center mb-8">Draft History</h1>
      <Link href="/reports" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-md transition duration-300 ease-in-out shadow-md mb-6 inline-block">
          &larr; Back to Reports
      </Link>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {seriesIds.map((seriesId) => (
          <div key={seriesId} className="bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition-shadow duration-300">
            <h2 className="text-xl font-bold mb-4">Series ID: {seriesId}</h2>
            <Link href={`/drafts/${seriesId}?teamId=${teamId}&tournamentId=${tournamentId}`} className="text-blue-600 hover:text-blue-800 font-semibold">
                View Draft Details &rarr;
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DraftsAppIndexPage;
