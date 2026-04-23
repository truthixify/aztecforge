import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Coins, Users, ArrowDown, ArrowUp } from 'lucide-react';
import { pools } from '../lib/api';
import { StatCard } from '../components/StatCard';
import { PoolType, type FundingPool } from '../types';

const poolTypeLabels: Record<PoolType, string> = {
  [PoolType.OPEN]: 'Open',
  [PoolType.QUADRATIC]: 'Quadratic',
  [PoolType.RETROACTIVE]: 'Retroactive',
  [PoolType.STREAMING]: 'Streaming',
};

export function PoolsPage() {
  const { data: poolList = [] } = useQuery<FundingPool[]>({
    queryKey: ['pools'],
    queryFn: () => pools.list(),
  });

  const { data: stats } = useQuery<{ totalPoolsCreated: number; totalValueDeposited: string; totalValueDisbursed: string }>({
    queryKey: ['pools', 'stats'],
    queryFn: () => pools.stats(),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Funding Pools</h1>
          <p className="text-gray-400 mt-1">Community-funded pools for ecosystem growth</p>
        </div>
        <Link
          to="/pools/new"
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Create Pool
        </Link>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatCard label="Total Pools" value={stats.totalPoolsCreated} icon={<Coins className="w-4 h-4" />} />
          <StatCard label="Total Deposited" value={`${stats.totalValueDeposited} USDC`} icon={<ArrowDown className="w-4 h-4" />} />
          <StatCard label="Total Disbursed" value={`${stats.totalValueDisbursed} USDC`} icon={<ArrowUp className="w-4 h-4" />} />
        </div>
      )}

      <div className="space-y-3">
        {poolList.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Coins className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No funding pools yet</p>
          </div>
        ) : (
          poolList.map((pool) => (
            <Link
              key={pool.id}
              to={`/pools/${pool.id}`}
              className="block bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-semibold text-white">{pool.purpose}</h3>
                    <span className="bg-gray-800 text-gray-300 px-2 py-0.5 rounded text-xs">
                      {poolTypeLabels[pool.poolType]}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {pool.contributorCount} contributors
                    </span>
                    <span>{pool.recipientCount} recipients</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-400">{pool.totalDeposited} USDC</p>
                  <p className="text-xs text-gray-500">{pool.totalDisbursed} disbursed</p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
