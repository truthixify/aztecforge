import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users, Gift, BarChart3 } from 'lucide-react';
import { circles } from '../lib/api';
import type { Circle } from '../types';

export function CirclesPage() {
  const { data: circleList = [] } = useQuery<Circle[]>({
    queryKey: ['circles'],
    queryFn: () => circles.list(),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Peer Rewards</h1>
          <p className="text-gray-400 mt-1">Allocate GIVE to recognize your peers each epoch</p>
        </div>
        <Link
          to="/circles/new"
          className="bg-[var(--accent-600)] hover:bg-[var(--accent-500)] text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Create Circle
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {circleList.length === 0 ? (
          <div className="col-span-2 text-center py-16 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No peer reward circles yet</p>
          </div>
        ) : (
          circleList.map((circle) => (
            <Link
              key={circle.id}
              to={`/circles/${circle.id}`}
              className="bg-[var(--bg-1)]/60 border border-[var(--line)] rounded-xl p-6 hover:border-[var(--bg-3)] hover:bg-[var(--bg-1)] transition-colors"
            >
              <h3 className="text-lg font-semibold text-white mb-2">{circle.name}</h3>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <p className="text-xs text-gray-500">Members</p>
                  <p className="text-lg font-semibold text-white flex items-center gap-1">
                    <Users className="w-4 h-4 text-gray-400" />
                    {circle.memberCount}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">GIVE/Member</p>
                  <p className="text-lg font-semibold text-white flex items-center gap-1">
                    <Gift className="w-4 h-4 text-gray-400" />
                    {circle.givePerMember}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Epoch</p>
                  <p className="text-lg font-semibold text-white flex items-center gap-1">
                    <BarChart3 className="w-4 h-4 text-gray-400" />
                    #{circle.currentEpoch}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-800">
                <span className="text-sm text-gray-500">Reward pool: {circle.rewardPool} USDC</span>
                <span className="text-sm text-gray-500">Distributed: {circle.totalDistributed} USDC</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
