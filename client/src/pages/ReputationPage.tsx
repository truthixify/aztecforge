import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Star, Trophy, Hammer, Scroll, Users } from 'lucide-react';
import { reputation } from '../lib/api';
import { TierBadge } from '../components/StatusBadge';
import { StatCard } from '../components/StatCard';
import type { ContributorReputation } from '../types';

export function ReputationPage() {
  const navigate = useNavigate();
  const { data: leaderboard = [] } = useQuery<ContributorReputation[]>({
    queryKey: ['reputation', 'leaderboard'],
    queryFn: () => reputation.leaderboard(20),
  });

  const { data: stats } = useQuery<{ totalContributors: number }>({
    queryKey: ['reputation', 'stats'],
    queryFn: () => reputation.stats(),
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Reputation</h1>
        <p className="text-gray-400 mt-1">Contributor leaderboard and reputation scores</p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatCard label="Total Contributors" value={stats.totalContributors} icon={<Users className="w-4 h-4" />} />
          <StatCard label="Leaderboard Size" value={leaderboard.length} icon={<Star className="w-4 h-4" />} />
          <StatCard
            label="Top Score"
            value={leaderboard[0]?.score ?? 0}
            icon={<Trophy className="w-4 h-4" />}
          />
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Rank</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Contributor</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Tier</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase px-5 py-3">Score</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase px-5 py-3">
                <Hammer className="w-3.5 h-3.5 inline" /> Bounties
              </th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase px-5 py-3">
                <Trophy className="w-3.5 h-3.5 inline" /> Hacks Won
              </th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase px-5 py-3">
                <Scroll className="w-3.5 h-3.5 inline" /> Quests
              </th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-500">
                  No contributors yet
                </td>
              </tr>
            ) : (
              leaderboard.map((contributor, index) => (
                <tr key={contributor.address} className="border-b border-gray-800/50 hover:bg-gray-800/30 cursor-pointer" onClick={() => navigate(`/reputation/${contributor.address}`)}>
                  <td className="px-5 py-3 text-gray-400">{index + 1}</td>
                  <td className="px-5 py-3">
                    <span className="text-white font-mono text-sm">
                      {contributor.address.slice(0, 8)}...{contributor.address.slice(-4)}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <TierBadge tier={contributor.tier} />
                  </td>
                  <td className="px-5 py-3 text-right text-white font-semibold">{contributor.score}</td>
                  <td className="px-5 py-3 text-right text-gray-300">{contributor.bountiesCompleted}</td>
                  <td className="px-5 py-3 text-right text-gray-300">{contributor.hackathonsWon}</td>
                  <td className="px-5 py-3 text-right text-gray-300">{contributor.questsCompleted}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
