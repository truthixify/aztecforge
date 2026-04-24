import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import { users } from '../lib/api';
import { StatsSkeleton, TableSkeleton } from '../components/Skeleton';
import { TierBadge } from '../components/StatusBadge';
import { StatCard } from '../components/StatCard';
import type { ContributorReputation } from '../types';

export function ReputationPage() {
  const navigate = useNavigate();
  const { data: leaderboard = [], isLoading } = useQuery<ContributorReputation[]>({
    queryKey: ['reputation', 'leaderboard'],
    queryFn: () => users.leaderboard(20),
  });

  const { data: stats, isLoading: statsLoading } = useQuery<{ totalContributors: number }>({
    queryKey: ['reputation', 'stats'],
    queryFn: () => users.leaderboard(1).then((l: unknown[]) => ({ totalContributors: l.length })),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Reputation</h1>
        <p className="text-gray-400 mt-1">Contributor leaderboard and on-chain standing.</p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <StatCard label="Contributors" value={stats.totalContributors} />
          <StatCard label="Leaderboard" value={leaderboard.length} />
          <StatCard label="Top score" value={leaderboard[0]?.score ?? 0} />
        </div>
      )}

      <div className="bg-[var(--bg-1)]/60 border border-[var(--line)] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--line)]">
              <th className="text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider px-5 py-3">#</th>
              <th className="text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Contributor</th>
              <th className="text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Tier</th>
              <th className="text-right text-[10px] font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Score</th>
              <th className="text-right text-[10px] font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Bounties</th>
              <th className="text-right text-[10px] font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Hack wins</th>
              <th className="text-right text-[10px] font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Quests</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-16">
                  <Star className="w-10 h-10 mx-auto text-gray-600 mb-3" />
                  <div className="text-gray-300 font-medium">No contributors yet</div>
                  <div className="text-sm text-gray-500 mt-1">Complete bounties or quests to appear here</div>
                </td>
              </tr>
            ) : (
              leaderboard.map((c, i) => (
                <tr
                  key={c.address}
                  className="border-b border-[var(--line)]/50 hover:bg-[var(--bg-2)]/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/reputation/${c.address}`)}
                >
                  <td className="px-5 py-3 text-gray-500 text-sm tabular-nums">{i + 1}</td>
                  <td className="px-5 py-3">
                    <span className="font-mono text-xs text-gray-300">
                      {c.address.slice(0, 6)}...{c.address.slice(-4)}
                    </span>
                  </td>
                  <td className="px-5 py-3"><TierBadge tier={c.tier} /></td>
                  <td className="px-5 py-3 text-right text-white font-semibold tabular-nums">{c.score}</td>
                  <td className="px-5 py-3 text-right text-gray-400 tabular-nums">{c.bountiesCompleted}</td>
                  <td className="px-5 py-3 text-right text-gray-400 tabular-nums">{c.hackathonsWon}</td>
                  <td className="px-5 py-3 text-right text-gray-400 tabular-nums">{c.questsCompleted}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
