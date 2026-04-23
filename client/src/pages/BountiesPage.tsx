import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Hammer, Clock, DollarSign, BarChart3 } from 'lucide-react';
import { bounties } from '../lib/api';
import { BountyStatusBadge } from '../components/StatusBadge';
import { StatCard } from '../components/StatCard';
import type { Bounty, BountyStats } from '../types';

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
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Bounties</h1>
          <p className="text-gray-400 mt-1">Find tasks, build, and earn rewards</p>
        </div>
        <Link
          to="/bounties/new"
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Post Bounty
        </Link>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Posted" value={stats.totalBountiesPosted} icon={<Hammer className="w-4 h-4" />} />
          <StatCard label="Completed" value={stats.totalBountiesCompleted} icon={<BarChart3 className="w-4 h-4" />} />
          <StatCard label="Value Escrowed" value={`${stats.totalValueEscrowed} USDC`} icon={<DollarSign className="w-4 h-4" />} />
          <StatCard label="Value Paid" value={`${stats.totalValuePaid} USDC`} icon={<DollarSign className="w-4 h-4" />} />
        </div>
      )}

      <div className="space-y-3">
        {bountyList.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Hammer className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No bounties yet</p>
            <p className="text-sm mt-1">Be the first to post a bounty</p>
          </div>
        ) : (
          bountyList.map((bounty) => (
            <Link
              key={bounty.id}
              to={`/bounties/${bounty.id}`}
              className="block bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">{bounty.title}</h3>
                    <BountyStatusBadge status={bounty.status} />
                  </div>
                  <p className="text-gray-400 text-sm line-clamp-2">{bounty.description}</p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                    {bounty.skills?.map((skill) => (
                      <span key={skill} className="bg-gray-800 px-2 py-0.5 rounded text-xs text-gray-300">
                        {skill}
                      </span>
                    ))}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Block {bounty.deadline}
                    </span>
                  </div>
                </div>
                <div className="text-right ml-4">
                  {bounty.isAmountPublic ? (
                    <p className="text-lg font-bold text-green-400">{bounty.rewardAmount} USDC</p>
                  ) : (
                    <p className="text-sm text-gray-500 italic">Hidden reward</p>
                  )}
                  {bounty.difficulty && (
                    <p className="text-xs text-gray-500 mt-1 capitalize">{bounty.difficulty}</p>
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
