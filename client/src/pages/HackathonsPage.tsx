import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Trophy, Users, FileText, DollarSign } from 'lucide-react';
import { hackathons } from '../lib/api';
import { HackathonStatusBadge } from '../components/StatusBadge';
import type { Hackathon } from '../types';

export function HackathonsPage() {
  const { data: hackathonList = [] } = useQuery<Hackathon[]>({
    queryKey: ['hackathons'],
    queryFn: () => hackathons.list(),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Hackathons</h1>
          <p className="text-gray-400 mt-1">Build, compete, and win prizes</p>
        </div>
        <Link
          to="/hackathons/new"
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Create Hackathon
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {hackathonList.length === 0 ? (
          <div className="col-span-2 text-center py-16 text-gray-500">
            <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No hackathons yet</p>
          </div>
        ) : (
          hackathonList.map((hack) => (
            <Link
              key={hack.id}
              to={`/hackathons/${hack.id}`}
              className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-white">{hack.name}</h3>
                <HackathonStatusBadge status={hack.status} />
              </div>
              <p className="text-gray-400 text-sm line-clamp-2 mb-4">{hack.description}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {hack.tracks?.map((track) => (
                  <span key={track} className="bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded text-xs">
                    {track}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5" />
                  {hack.prizePool} USDC
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {hack.teamCount} teams
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  {hack.submissionCount} submissions
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
