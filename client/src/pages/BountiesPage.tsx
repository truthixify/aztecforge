import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Hammer, Clock, EyeOff, Plus } from 'lucide-react';
import { bounties } from '../lib/api';
import { BountyStatusBadge } from '../components/StatusBadge';
import { StatCard } from '../components/StatCard';
import type { Bounty, BountyStats } from '../types';

const DIFFICULTY_DOT: Record<string, string> = {
  easy: 'bg-green-400',
  medium: 'bg-yellow-400',
  hard: 'bg-red-400',
};

export function BountiesPage() {
  const { data: bountyList = [] } = useQuery<Bounty[]>({
    queryKey: ['bounties'],
    queryFn: () => bounties.list(),
  });

  const { data: stats } = useQuery<BountyStats>({
    queryKey: ['bounties', 'stats'],
    queryFn: () => bounties.stats(),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Bounties</h1>
          <p className="text-gray-400 mt-1">Find tasks, ship work, earn on-chain rewards.</p>
        </div>
        <Link
          to="/bounties/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--accent-600)] hover:bg-[var(--accent-500)] text-white transition-colors"
        >
          <Plus className="w-4 h-4" />
          Post Bounty
        </Link>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Posted" value={stats.totalBountiesPosted} />
          <StatCard label="Completed" value={stats.totalBountiesCompleted} />
          <StatCard label="Escrowed" value={stats.totalValueEscrowed} sub="USDC" accent="text-green-400" />
          <StatCard label="Paid out" value={stats.totalValuePaid} sub="USDC" />
        </div>
      )}

      {/* List */}
      <div className="space-y-2">
        {bountyList.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-gray-800 rounded-xl">
            <Hammer className="w-10 h-10 mx-auto text-gray-600 mb-3" />
            <div className="text-gray-300 font-medium">No bounties yet</div>
            <div className="text-sm text-gray-500 mt-1">Be the first to post a bounty</div>
            <div className="mt-4">
              <Link to="/bounties/new" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--accent-600)] hover:bg-[var(--accent-500)] text-white transition-colors">
                <Plus className="w-4 h-4" /> Post Bounty
              </Link>
            </div>
          </div>
        ) : (
          bountyList.map((bounty) => (
            <Link
              key={bounty.id}
              to={`/bounties/${bounty.id}`}
              className="block bg-[var(--bg-1)]/60 border border-[var(--line)] rounded-xl p-5 hover:border-[var(--bg-3)] hover:bg-[var(--bg-1)] transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <h3 className="text-[15px] font-semibold text-white tracking-tight truncate">{bounty.title}</h3>
                    <BountyStatusBadge status={bounty.status} />
                  </div>
                  <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed">{bounty.description}</p>
                  <div className="flex items-center gap-3 mt-3">
                    {bounty.skills?.map((skill) => (
                      <span key={skill} className="inline-flex items-center px-2 py-0.5 rounded-md text-xs border bg-gray-800 text-gray-300 border-gray-700/50">
                        {skill}
                      </span>
                    ))}
                    {bounty.difficulty && (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                        <span className={`w-1.5 h-1.5 rounded-full ${DIFFICULTY_DOT[bounty.difficulty] || 'bg-gray-400'}`} />
                        <span className="capitalize">{bounty.difficulty}</span>
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      {bounty.deadline}
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  {bounty.isAmountPublic ? (
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-lg font-bold text-green-400 tabular-nums tracking-tight">
                        {Number(bounty.rewardAmount).toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-500 font-mono">USDC</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-gray-500 italic text-sm">
                      <EyeOff className="w-3.5 h-3.5" />
                      Hidden
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
