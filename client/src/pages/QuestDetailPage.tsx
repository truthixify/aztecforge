import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Scroll, User, DollarSign, Clock, Zap, CheckCircle } from 'lucide-react';
import { quests } from '../lib/api';
import { MetadataGrid } from '../components/MetadataGrid';
import { ProgressBar } from '../components/ProgressBar';
import { ListSkeleton } from '../components/Skeleton';
import { QuestType } from '../types';

const questTypeLabels: Record<QuestType, string> = {
  [QuestType.ON_CHAIN]: 'On-Chain',
  [QuestType.CONTENT]: 'Content',
  [QuestType.DEVELOPMENT]: 'Development',
  [QuestType.COMMUNITY]: 'Community',
};

export function QuestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const questId = Number(id);
  const qc = useQueryClient();
  const [verificationUrl, setVerificationUrl] = useState('');
  const [verifyForm, setVerifyForm] = useState({ completer: '', verificationUrl: '' });
  const [verifierAddr, setVerifierAddr] = useState('');

  const { data: quest, isLoading } = useQuery({ queryKey: ['quests', questId], queryFn: () => quests.get(questId) });
  const { data: completions = [] } = useQuery({ queryKey: ['quests', questId, 'completions'], queryFn: () => quests.completions(questId) });

  const completeMut = useMutation({
    mutationFn: () => quests.complete(questId, verificationUrl),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['quests', questId] }); setVerificationUrl(''); },
  });

  const verifyMut = useMutation({
    mutationFn: () => quests.verify(questId, verifyForm),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['quests', questId] }); setVerifyForm({ completer: '', verificationUrl: '' }); },
  });

  const deactivateMut = useMutation({
    mutationFn: () => fetch(`/api/quests/${questId}/deactivate`, { method: 'PATCH', headers: { 'x-sender': 'creator' } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quests', questId] }),
  });

  const addVerifierMut = useMutation({
    mutationFn: () => fetch(`/api/quests/${questId}/verifiers`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-sender': 'creator' },
      body: JSON.stringify({ verifier: verifierAddr }),
    }),
    onSuccess: () => setVerifierAddr(''),
  });

  if (isLoading || !quest) return <ListSkeleton count={2} />;

  const isUnlimited = quest.maxCompletions === 0;

  return (
    <div className="max-w-3xl mx-auto">
      <Link to="/quests" className="flex items-center gap-2 text-gray-400 hover:text-gray-200 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Quests
      </Link>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-white">{quest.name}</h1>
              <span className={`px-2 py-0.5 rounded text-xs ${quest.questType === 0 ? 'bg-blue-500/10 text-blue-400' : quest.questType === 1 ? 'bg-green-500/10 text-green-400' : quest.questType === 2 ? 'bg-purple-500/10 text-purple-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                {questTypeLabels[quest.questType as QuestType]}
              </span>
              {quest.status === 0 ? (
                <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full text-xs">Active</span>
              ) : (
                <span className="bg-gray-500/10 text-gray-400 border border-gray-500/20 px-2 py-0.5 rounded-full text-xs">Inactive</span>
              )}
            </div>
          </div>
          <p className="text-2xl font-bold text-green-400">{quest.rewardPerCompletion} USDC</p>
        </div>

        <p className="text-gray-400 mb-6 whitespace-pre-wrap">{quest.description}</p>

        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>{quest.completionCount} / {isUnlimited ? 'unlimited' : quest.maxCompletions} completions</span>
            {!isUnlimited && <span>{Math.round((quest.completionCount / quest.maxCompletions) * 100)}%</span>}
          </div>
          {!isUnlimited && <ProgressBar value={quest.completionCount} max={quest.maxCompletions} />}
        </div>

        <MetadataGrid items={[
          { icon: <User className="w-4 h-4" />, label: 'Creator', value: `${String(quest.creator).slice(0, 10)}...`, mono: true },
          { icon: <DollarSign className="w-4 h-4" />, label: 'Reward', value: `${quest.rewardPerCompletion} USDC` },
          { icon: <Clock className="w-4 h-4" />, label: 'Deadline', value: `Block ${quest.deadline}` },
          { icon: <Zap className="w-4 h-4" />, label: 'Reputation Gate', value: quest.reputationGateId || 'None' },
        ]} />
      </div>

      {/* Completions */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-400" /> Completions ({completions.length})
        </h2>
        {completions.length === 0 ? (
          <p className="text-gray-500 text-sm">No completions yet</p>
        ) : (
          <div className="space-y-2">
            {completions.map((c: { completer: string; verificationUrl: string }, i: number) => (
              <div key={i} className="flex justify-between items-center text-sm py-2 border-b border-gray-800/50 last:border-0">
                <span className="font-mono text-gray-300 text-xs">{c.completer}</span>
                <a href={c.verificationUrl} target="_blank" rel="noreferrer" className="text-purple-400 text-xs hover:underline">Proof</a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-4">
        {quest.status === 0 && quest.questType === 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-sm font-medium text-white mb-3">Complete This Quest</h3>
            <div className="flex gap-3">
              <input value={verificationUrl} onChange={(e) => setVerificationUrl(e.target.value)} placeholder="Verification URL or proof"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-purple-500" />
              <button onClick={() => completeMut.mutate()} disabled={!verificationUrl || completeMut.isPending}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                {completeMut.isPending ? 'Completing...' : 'Complete'}
              </button>
            </div>
          </div>
        )}

        {quest.status === 0 && quest.questType !== 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-sm font-medium text-white mb-3">Verify a Completion (Verifier Only)</h3>
            <div className="space-y-3">
              <input value={verifyForm.completer} onChange={(e) => setVerifyForm((p) => ({ ...p, completer: e.target.value }))} placeholder="Completer address"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-purple-500" />
              <div className="flex gap-3">
                <input value={verifyForm.verificationUrl} onChange={(e) => setVerifyForm((p) => ({ ...p, verificationUrl: e.target.value }))} placeholder="Verification URL"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-purple-500" />
                <button onClick={() => verifyMut.mutate()} disabled={!verifyForm.completer || !verifyForm.verificationUrl}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium">Verify</button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-sm font-medium text-white mb-3">Creator Controls</h3>
          <div className="flex gap-3 mb-3">
            <input value={verifierAddr} onChange={(e) => setVerifierAddr(e.target.value)} placeholder="Verifier address"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-purple-500" />
            <button onClick={() => addVerifierMut.mutate()} disabled={!verifierAddr}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Add Verifier</button>
          </div>
          {quest.status === 0 && (
            <button onClick={() => deactivateMut.mutate()} className="bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 px-4 py-2 rounded-lg text-sm font-medium">
              Deactivate Quest
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
