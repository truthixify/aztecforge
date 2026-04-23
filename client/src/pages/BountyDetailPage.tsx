import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Clock, User, FileText, DollarSign } from 'lucide-react';
import { bounties } from '../lib/api';
import { BountyStatusBadge } from '../components/StatusBadge';
import { BountyStatus, type Bounty } from '../types';

export function BountyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const bountyId = Number(id);
  const queryClient = useQueryClient();

  const { data: bounty, isLoading } = useQuery<Bounty>({
    queryKey: ['bounties', bountyId],
    queryFn: () => bounties.get(bountyId),
  });

  const claimMutation = useMutation({
    mutationFn: () => bounties.claim(bountyId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bounties', bountyId] }),
  });

  const approveMutation = useMutation({
    mutationFn: () => bounties.approve(bountyId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bounties', bountyId] }),
  });

  const rejectMutation = useMutation({
    mutationFn: () => bounties.reject(bountyId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bounties', bountyId] }),
  });

  const cancelMutation = useMutation({
    mutationFn: () => bounties.cancel(bountyId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bounties', bountyId] }),
  });

  if (isLoading || !bounty) {
    return <div className="text-gray-500">Loading...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-gray-200 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Bounties
      </Link>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-white">{bounty.title}</h1>
              <BountyStatusBadge status={bounty.status} />
            </div>
            {bounty.skills?.length > 0 && (
              <div className="flex gap-2 mt-2">
                {bounty.skills.map((skill) => (
                  <span key={skill} className="bg-gray-800 px-2 py-0.5 rounded text-xs text-gray-300">
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="text-right">
            {bounty.isAmountPublic ? (
              <p className="text-2xl font-bold text-green-400">{bounty.rewardAmount} USDC</p>
            ) : (
              <p className="text-lg text-gray-500 italic">Hidden reward</p>
            )}
            {bounty.difficulty && (
              <p className="text-sm text-gray-500 capitalize mt-1">{bounty.difficulty}</p>
            )}
          </div>
        </div>

        <div className="prose prose-invert max-w-none mb-8">
          <p className="text-gray-300 whitespace-pre-wrap">{bounty.description}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 p-4 bg-gray-800/50 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <User className="w-4 h-4" />
            <div>
              <p className="text-xs text-gray-500">Creator</p>
              <p className="text-gray-300 font-mono text-xs">{bounty.creator.slice(0, 10)}...</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Clock className="w-4 h-4" />
            <div>
              <p className="text-xs text-gray-500">Deadline</p>
              <p className="text-gray-300">Block {bounty.deadline}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <DollarSign className="w-4 h-4" />
            <div>
              <p className="text-xs text-gray-500">Escrow</p>
              <p className="text-gray-300">{bounty.escrowBalance} USDC</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <FileText className="w-4 h-4" />
            <div>
              <p className="text-xs text-gray-500">Claimer</p>
              <p className="text-gray-300 font-mono text-xs">
                {bounty.claimer || 'None'}
              </p>
            </div>
          </div>
        </div>

        {bounty.submissionHash && (
          <div className="mb-8 p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
            <p className="text-sm text-yellow-400 font-medium mb-1">Submission</p>
            <p className="text-gray-300 font-mono text-sm">{bounty.submissionHash}</p>
          </div>
        )}

        <div className="flex gap-3">
          {bounty.status === BountyStatus.OPEN && (
            <button
              onClick={() => claimMutation.mutate()}
              disabled={claimMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium transition-colors"
            >
              {claimMutation.isPending ? 'Claiming...' : 'Claim Bounty'}
            </button>
          )}
          {bounty.status === BountyStatus.SUBMITTED && (
            <>
              <button
                onClick={() => approveMutation.mutate()}
                disabled={approveMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-medium transition-colors"
              >
                {approveMutation.isPending ? 'Approving...' : 'Approve & Pay'}
              </button>
              <button
                onClick={() => rejectMutation.mutate()}
                disabled={rejectMutation.isPending}
                className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg font-medium transition-colors"
              >
                Reject
              </button>
            </>
          )}
          {(bounty.status === BountyStatus.OPEN || bounty.status === BountyStatus.CLAIMED) && (
            <button
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
              className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-5 py-2 rounded-lg font-medium transition-colors"
            >
              Cancel Bounty
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
