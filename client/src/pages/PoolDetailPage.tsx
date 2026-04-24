import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Coins, User, DollarSign, ArrowDown, ArrowUp, Users } from 'lucide-react';
import { pools } from '../lib/api';
import { MetadataGrid } from '../components/MetadataGrid';
import { ProgressBar } from '../components/ProgressBar';
import { ListSkeleton } from '../components/Skeleton';
import { PoolType } from '../types';

const poolTypeLabels: Record<PoolType, string> = {
  [PoolType.OPEN]: 'Open',
  [PoolType.QUADRATIC]: 'Quadratic',
  [PoolType.RETROACTIVE]: 'Retroactive',
  [PoolType.STREAMING]: 'Streaming',
};

export function PoolDetailPage() {
  const { id } = useParams<{ id: string }>();
  const poolId = Number(id);
  const qc = useQueryClient();
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [allocForm, setAllocForm] = useState({ recipient: '', amount: '', reason: '' });

  const { data: pool, isLoading } = useQuery({ queryKey: ['pools', poolId], queryFn: () => pools.get(poolId) });
  const { data: balance } = useQuery({ queryKey: ['pools', poolId, 'balance'], queryFn: () => pools.balance(poolId) });

  const depositMut = useMutation({
    mutationFn: () => pools.deposit(poolId, depositAmount),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pools', poolId] }); setDepositAmount(''); },
  });

  const allocateMut = useMutation({
    mutationFn: () => pools.allocate(poolId, allocForm),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pools', poolId] }); setAllocForm({ recipient: '', amount: '', reason: '' }); },
  });

  const pauseMut = useMutation({
    mutationFn: () => pools.pause(poolId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pools', poolId] }),
  });
  const resumeMut = useMutation({
    mutationFn: () => pools.resume(poolId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pools', poolId] }),
  });
  const closeMut = useMutation({
    mutationFn: () => pools.close(poolId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pools', poolId] }),
  });

  if (isLoading || !pool) return <ListSkeleton count={2} />;

  const deposited = Number(pool.totalDeposited);
  const disbursed = Number(pool.totalDisbursed);
  const available = balance?.availableBalance ?? String(deposited - disbursed);

  return (
    <div className="max-w-3xl mx-auto">
      <Link to="/pools" className="flex items-center gap-2 text-gray-400 hover:text-gray-200 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Pools
      </Link>

      <div className="bg-[var(--bg-1)]/60 border border-[var(--line)] rounded-xl p-8 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-white">{pool.purpose}</h1>
              <span className="bg-gray-800 text-gray-300 px-2 py-0.5 rounded text-xs">{poolTypeLabels[pool.poolType as PoolType]}</span>
              {pool.status === 0 && <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full text-xs">Active</span>}
              {pool.status === 1 && <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded-full text-xs">Paused</span>}
              {pool.status === 2 && <span className="bg-gray-500/10 text-gray-400 border border-gray-500/20 px-2 py-0.5 rounded-full text-xs">Closed</span>}
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-green-400">{available} USDC</p>
            <p className="text-xs text-gray-500">Available</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Disbursed: {pool.totalDisbursed} USDC</span>
            <span>Deposited: {pool.totalDeposited} USDC</span>
          </div>
          <ProgressBar value={disbursed} max={deposited || 1} />
        </div>

        <MetadataGrid items={[
          { icon: <User className="w-4 h-4" />, label: 'Curator', value: `${String(pool.curator).slice(0, 10)}...`, mono: true },
          { icon: <DollarSign className="w-4 h-4" />, label: 'Total Deposited', value: `${pool.totalDeposited} USDC` },
          { icon: <DollarSign className="w-4 h-4" />, label: 'Total Disbursed', value: `${pool.totalDisbursed} USDC` },
          { icon: <Users className="w-4 h-4" />, label: 'Contributors', value: pool.contributorCount },
        ]} />

        {/* Curator controls */}
        <div className="flex gap-3 mt-6">
          {pool.status === 0 && (
            <button onClick={() => pauseMut.mutate()} className="bg-yellow-600/10 hover:bg-yellow-600/20 text-yellow-400 border border-yellow-500/20 px-4 py-2 rounded-lg text-sm font-medium">Pause Pool</button>
          )}
          {pool.status === 1 && (
            <button onClick={() => resumeMut.mutate()} className="bg-green-600/10 hover:bg-green-600/20 text-green-400 border border-green-500/20 px-4 py-2 rounded-lg text-sm font-medium">Resume Pool</button>
          )}
          {pool.status !== 2 && (
            <button onClick={() => closeMut.mutate()} className="bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 px-4 py-2 rounded-lg text-sm font-medium">Close Pool</button>
          )}
        </div>
      </div>

      {/* Deposit */}
      {pool.status === 0 && (
        <div className="bg-[var(--bg-1)]/60 border border-[var(--line)] rounded-xl p-6 mb-4">
          <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <ArrowDown className="w-4 h-4 text-green-400" /> Deposit
          </h3>
          <div className="flex gap-3">
            <input value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder="Amount (USDC)"
              className="flex-1 bg-gray-800 border border-[var(--line)] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[var(--accent-500)]" />
            <button onClick={() => depositMut.mutate()} disabled={!depositAmount || depositMut.isPending}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
              {depositMut.isPending ? 'Depositing...' : 'Deposit'}
            </button>
          </div>
        </div>
      )}

      {/* Allocate (curator) */}
      {pool.status === 0 && (
        <div className="bg-[var(--bg-1)]/60 border border-[var(--line)] rounded-xl p-6">
          <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <ArrowUp className="w-4 h-4 text-purple-400" /> Allocate (Curator)
          </h3>
          <div className="space-y-3">
            <input value={allocForm.recipient} onChange={(e) => setAllocForm((p) => ({ ...p, recipient: e.target.value }))} placeholder="Recipient address"
              className="w-full bg-gray-800 border border-[var(--line)] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[var(--accent-500)]" />
            <div className="flex gap-3">
              <input value={allocForm.amount} onChange={(e) => setAllocForm((p) => ({ ...p, amount: e.target.value }))} placeholder="Amount (USDC)"
                className="flex-1 bg-gray-800 border border-[var(--line)] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[var(--accent-500)]" />
              <input value={allocForm.reason} onChange={(e) => setAllocForm((p) => ({ ...p, reason: e.target.value }))} placeholder="Reason"
                className="flex-1 bg-gray-800 border border-[var(--line)] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[var(--accent-500)]" />
            </div>
            <button onClick={() => allocateMut.mutate()} disabled={!allocForm.recipient || !allocForm.amount || allocateMut.isPending}
              className="bg-[var(--accent-600)] hover:bg-[var(--accent-500)] disabled:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
              {allocateMut.isPending ? 'Allocating...' : 'Allocate'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
