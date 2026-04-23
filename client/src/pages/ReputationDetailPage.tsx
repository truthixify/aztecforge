import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Star, Hammer, Trophy, Coins, Scroll, Users, Gift, CheckCircle } from 'lucide-react';
import { reputation } from '../lib/api';
import { TierBadge } from '../components/StatusBadge';
import { ListSkeleton } from '../components/Skeleton';
import type { ContributorReputation } from '../types';

export function ReputationDetailPage() {
  const { address } = useParams<{ address: string }>();
  const [gateId, setGateId] = useState('');
  const [gateResult, setGateResult] = useState<boolean | null>(null);

  const { data: rep, isLoading, error } = useQuery<ContributorReputation>({
    queryKey: ['reputation', address],
    queryFn: () => reputation.get(address!),
    enabled: !!address,
  });

  const checkGate = async () => {
    if (!address || !gateId) return;
    const result = await reputation.checkGate(address, Number(gateId));
    setGateResult(result.passes);
  };

  if (isLoading) return <ListSkeleton count={2} />;
  if (error || !rep) {
    return (
      <div className="max-w-3xl mx-auto">
        <Link to="/reputation" className="flex items-center gap-2 text-gray-400 hover:text-gray-200 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Leaderboard
        </Link>
        <div className="text-center py-16 text-gray-500">
          <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">Contributor not found</p>
          <p className="text-sm mt-1">This address has no reputation data yet</p>
        </div>
      </div>
    );
  }

  const stats = [
    { icon: <Hammer className="w-5 h-5 text-blue-400" />, label: 'Bounties Completed', value: rep.bountiesCompleted, sub: `${(rep as unknown as Record<string, string>).bountiesTotalEarned ?? '0'} USDC earned` },
    { icon: <Trophy className="w-5 h-5 text-yellow-400" />, label: 'Hackathons Won', value: rep.hackathonsWon, sub: `${(rep as unknown as Record<string, number>).hackathonsParticipated ?? 0} participated` },
    { icon: <Coins className="w-5 h-5 text-green-400" />, label: 'Grants Received', value: rep.grantsReceived, sub: `${(rep as unknown as Record<string, string>).grantsTotalEarned ?? '0'} USDC earned` },
    { icon: <Scroll className="w-5 h-5 text-purple-400" />, label: 'Quests Completed', value: rep.questsCompleted },
    { icon: <Gift className="w-5 h-5 text-pink-400" />, label: 'Peer GIVE Received', value: (rep as unknown as Record<string, string>).peerGiveReceived ?? '0' },
    { icon: <Users className="w-5 h-5 text-cyan-400" />, label: 'Peer Epochs', value: (rep as unknown as Record<string, number>).peerEpochsParticipated ?? 0 },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <Link to="/reputation" className="flex items-center gap-2 text-gray-400 hover:text-gray-200 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Leaderboard
      </Link>

      {/* Header */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="font-mono text-lg text-white mb-2">{address}</p>
            <div className="flex items-center gap-3">
              <TierBadge tier={rep.tier} />
              <span className="text-gray-400">Score: <span className="text-white font-bold">{rep.score}</span></span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold text-white">{rep.score}</p>
            <p className="text-xs text-gray-500">Reputation Score</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                {stat.icon}
                <span className="text-xs text-gray-500">{stat.label}</span>
              </div>
              <p className="text-xl font-bold text-white">{stat.value}</p>
              {stat.sub && <p className="text-xs text-gray-500 mt-1">{stat.sub}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Score Breakdown</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-400">
            <span>Bounties ({rep.bountiesCompleted} x 10)</span>
            <span className="text-white">{rep.bountiesCompleted * 10}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Hackathon Wins ({rep.hackathonsWon} x 50)</span>
            <span className="text-white">{rep.hackathonsWon * 50}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Grants ({rep.grantsReceived} x 30)</span>
            <span className="text-white">{rep.grantsReceived * 30}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Quests ({rep.questsCompleted} x 5)</span>
            <span className="text-white">{rep.questsCompleted * 5}</span>
          </div>
          <div className="border-t border-gray-800 pt-2 flex justify-between font-medium">
            <span className="text-gray-300">Total</span>
            <span className="text-white">{rep.score}</span>
          </div>
        </div>
      </div>

      {/* Gate Check */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" /> Gate Check
        </h2>
        <p className="text-sm text-gray-400 mb-3">Check if this contributor passes a reputation gate.</p>
        <div className="flex gap-3">
          <input value={gateId} onChange={(e) => setGateId(e.target.value)} placeholder="Gate ID"
            className="w-28 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-purple-500" />
          <button onClick={checkGate} disabled={!gateId}
            className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium">Check</button>
        </div>
        {gateResult !== null && (
          <div className={`mt-3 px-4 py-2 rounded-lg text-sm ${gateResult ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
            {gateResult ? 'Passes gate requirements' : 'Does not pass gate requirements'}
          </div>
        )}
      </div>
    </div>
  );
}
