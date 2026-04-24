import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Users, Gift, BarChart3, User, DollarSign, Plus, Trash2 } from 'lucide-react';
import { circles } from '../lib/api';
import { MetadataGrid } from '../components/MetadataGrid';
import { ProgressBar } from '../components/ProgressBar';
import { ListSkeleton } from '../components/Skeleton';

export function CircleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const circleId = Number(id);
  const qc = useQueryClient();
  const [newMember, setNewMember] = useState('');
  const [giveAllocations, setGiveAllocations] = useState<Record<string, number>>({});
  const [claimEpoch, setClaimEpoch] = useState(0);

  const { data: circle, isLoading } = useQuery({ queryKey: ['circles', circleId], queryFn: () => circles.get(circleId) });
  const { data: members = [] } = useQuery<string[]>({ queryKey: ['circles', circleId, 'members'], queryFn: () => circles.members(circleId) });

  const addMemberMut = useMutation({
    mutationFn: () => circles.addMember(circleId, newMember),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['circles', circleId] }); setNewMember(''); },
  });

  const removeMemberMut = useMutation({
    mutationFn: (member: string) => fetch(`/api/peer-allocation/circles/${circleId}/members/${member}`, {
      method: 'DELETE', headers: { 'x-sender': 'admin' },
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['circles', circleId] }),
  });

  const giveMut = useMutation({
    mutationFn: async () => {
      for (const [recipient, amount] of Object.entries(giveAllocations)) {
        if (amount > 0) {
          await circles.give(circleId, { recipient, amount });
        }
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['circles', circleId] }); setGiveAllocations({}); },
  });

  const advanceEpochMut = useMutation({
    mutationFn: () => circles.advanceEpoch(circleId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['circles', circleId] }),
  });

  const claimMut = useMutation({
    mutationFn: () => circles.claimReward(circleId, claimEpoch),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['circles', circleId] });
      alert(`Claimed reward: ${data.reward} USDC`);
    },
  });

  if (isLoading || !circle) return <ListSkeleton count={2} />;

  const totalGiveAllocated = Object.values(giveAllocations).reduce((s, v) => s + v, 0);
  const giveRemaining = circle.givePerMember - totalGiveAllocated;

  return (
    <div className="max-w-3xl mx-auto">
      <Link to="/circles" className="flex items-center gap-2 text-gray-400 hover:text-gray-200 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Circles
      </Link>

      <div className="bg-[var(--bg-1)]/60 border border-[var(--line)] rounded-xl p-8 mb-6">
        <h1 className="text-2xl font-bold text-white mb-4">{circle.name}</h1>

        <MetadataGrid items={[
          { icon: <User className="w-4 h-4" />, label: 'Admin', value: `${String(circle.admin).slice(0, 10)}...`, mono: true },
          { icon: <BarChart3 className="w-4 h-4" />, label: 'Current Epoch', value: `#${circle.currentEpoch}` },
          { icon: <Users className="w-4 h-4" />, label: 'Members', value: circle.memberCount },
          { icon: <Gift className="w-4 h-4" />, label: 'GIVE/Member', value: circle.givePerMember },
          { icon: <DollarSign className="w-4 h-4" />, label: 'Reward Pool', value: `${circle.rewardPool} USDC` },
          { icon: <DollarSign className="w-4 h-4" />, label: 'Total Distributed', value: `${circle.totalDistributed} USDC` },
        ]} />

        <div className="mt-6">
          <button onClick={() => advanceEpochMut.mutate()} disabled={advanceEpochMut.isPending}
            className="bg-[var(--accent-600)] hover:bg-[var(--accent-500)] disabled:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            {advanceEpochMut.isPending ? 'Advancing...' : 'Advance Epoch'}
          </button>
        </div>
      </div>

      {/* Members */}
      <div className="bg-[var(--bg-1)]/60 border border-[var(--line)] rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" /> Members ({members.length})
        </h2>
        <div className="space-y-2 mb-4">
          {members.map((m) => (
            <div key={m} className="flex justify-between items-center py-2 border-b border-gray-800/50 last:border-0">
              <span className="font-mono text-sm text-gray-300">{m}</span>
              <button onClick={() => removeMemberMut.mutate(m)} className="text-red-400 hover:text-red-300">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <input value={newMember} onChange={(e) => setNewMember(e.target.value)} placeholder="Member address"
            className="flex-1 bg-gray-800 border border-[var(--line)] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[var(--accent-500)]" />
          <button onClick={() => addMemberMut.mutate()} disabled={!newMember}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      {/* GIVE Allocation */}
      <div className="bg-[var(--bg-1)]/60 border border-[var(--line)] rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
          <Gift className="w-5 h-5 text-purple-400" /> Allocate GIVE (Epoch #{circle.currentEpoch})
        </h2>
        <div className="flex justify-between text-sm text-gray-400 mb-3">
          <span>{totalGiveAllocated} / {circle.givePerMember} GIVE allocated</span>
          <span className={giveRemaining < 0 ? 'text-red-400' : ''}>{giveRemaining} remaining</span>
        </div>
        <ProgressBar value={totalGiveAllocated} max={circle.givePerMember} className="mb-4" />

        <div className="space-y-2 mb-4">
          {members.map((m) => (
            <div key={m} className="flex items-center gap-3">
              <span className="font-mono text-xs text-gray-400 w-32 truncate">{m}</span>
              <input
                type="number" min={0} max={giveRemaining + (giveAllocations[m] ?? 0)}
                value={giveAllocations[m] ?? 0}
                onChange={(e) => setGiveAllocations((prev) => ({ ...prev, [m]: Number(e.target.value) }))}
                className="w-20 bg-gray-800 border border-[var(--line)] rounded-lg px-3 py-1.5 text-white text-sm text-center"
              />
              <span className="text-xs text-gray-500">GIVE</span>
            </div>
          ))}
        </div>

        <button onClick={() => giveMut.mutate()} disabled={totalGiveAllocated === 0 || giveRemaining < 0 || giveMut.isPending}
          className="bg-[var(--accent-600)] hover:bg-[var(--accent-500)] disabled:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          {giveMut.isPending ? 'Submitting...' : 'Submit Allocations'}
        </button>
      </div>

      {/* Claim Rewards */}
      <div className="bg-[var(--bg-1)]/60 border border-[var(--line)] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-400" /> Claim Epoch Reward
        </h2>
        <div className="flex gap-3">
          <div>
            <label className="text-xs text-gray-500">Epoch #</label>
            <input type="number" min={0} value={claimEpoch} onChange={(e) => setClaimEpoch(Number(e.target.value))}
              className="w-20 bg-gray-800 border border-[var(--line)] rounded-lg px-3 py-2 text-white text-sm" />
          </div>
          <button onClick={() => claimMut.mutate()} disabled={claimMut.isPending}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium self-end">
            {claimMut.isPending ? 'Claiming...' : 'Claim Reward'}
          </button>
        </div>
      </div>
    </div>
  );
}
