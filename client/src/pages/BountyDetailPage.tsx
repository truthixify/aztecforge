import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Clock, User, DollarSign, ExternalLink, Check, X as XIcon } from 'lucide-react';
import { listings } from '../lib/api';
import { useToast } from '../components/Toast';
import { DetailSkeleton } from '../components/Skeleton';

const STATUS_LABELS: Record<number, { label: string; color: string }> = {
  0: { label: 'Open', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  1: { label: 'Reviewing', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  2: { label: 'Completed', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  3: { label: 'Cancelled', color: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
};

const SUB_STATUS: Record<number, { label: string; color: string }> = {
  0: { label: 'Pending', color: 'text-yellow-400' },
  1: { label: 'Winner', color: 'text-green-400' },
  2: { label: 'Rejected', color: 'text-gray-500' },
};

export function BountyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const bountyId = Number(id);
  const qc = useQueryClient();
  const toast = useToast();
  const [submitUrl, setSubmitUrl] = useState('');
  const [submitNotes, setSubmitNotes] = useState('');

  const { data: bounty, isLoading } = useQuery({
    queryKey: ['bounties', bountyId],
    queryFn: () => listings.get(bountyId),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['bounties'] });

  const submitMut = useMutation({
    mutationFn: () => listings.submit(bountyId, { submissionUrl: submitUrl, notes: submitNotes }),
    onSuccess: () => { toast.success('Submission sent'); setSubmitUrl(''); setSubmitNotes(''); invalidate(); },
  });

  const selectWinnerMut = useMutation({
    mutationFn: (subId: number) => listings.selectWinner(bountyId, subId),
    onSuccess: () => { toast.success('Winner selected and paid'); invalidate(); },
  });

  const rejectSubMut = useMutation({
    mutationFn: (subId: number) => listings.updateLabel(bountyId, subId),
    onSuccess: () => { toast.success('Submission rejected'); invalidate(); },
  });

  const closeSubsMut = useMutation({
    mutationFn: () => listings.closeSubmissions(bountyId),
    onSuccess: () => { toast.success('Submissions closed'); invalidate(); },
  });

  const cancelMut = useMutation({
    mutationFn: () => listings.cancel(bountyId),
    onSuccess: () => { toast.success('Bounty cancelled'); invalidate(); },
  });

  if (isLoading || !bounty) return <DetailSkeleton />;

  const statusCfg = STATUS_LABELS[bounty.status] ?? STATUS_LABELS[0];
  const isOpen = bounty.status === 0;
  const isReviewing = bounty.status === 1;
  const isCompleted = bounty.status === 2;

  return (
    <div className="max-w-3xl mx-auto">
      <Link to="/bounties" className="flex items-center gap-2 text-gray-400 hover:text-gray-200 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Bounties
      </Link>

      <div className="bg-[var(--bg-1)]/60 border border-[var(--line)] rounded-xl p-8 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">{bounty.title}</h1>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${statusCfg.color}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {statusCfg.label}
              </span>
            </div>
            {bounty.skills?.length > 0 && (
              <div className="flex gap-2 mt-2">
                {bounty.skills.map((s: string) => (
                  <span key={s} className="px-2 py-0.5 rounded-md text-xs border bg-gray-800 text-gray-300 border-gray-700/50">{s}</span>
                ))}
              </div>
            )}
          </div>
          <div className="text-right shrink-0">
            {bounty.isAmountPublic ? (
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-green-400 tabular-nums">{Number(bounty.rewardAmount).toLocaleString()}</span>
                <span className="text-xs text-gray-500 font-mono">USDC</span>
              </div>
            ) : (
              <span className="text-gray-500 italic text-sm">Hidden reward</span>
            )}
          </div>
        </div>

        <p className="text-gray-300 whitespace-pre-wrap leading-relaxed mb-6">{bounty.description}</p>

        {/* Accepted submission formats */}
        {bounty.acceptedFormats?.length > 0 && (
          <div className="mb-6">
            <div className="text-[11px] uppercase tracking-wider text-gray-500 mb-2">Accepted submissions</div>
            <div className="flex flex-wrap gap-2">
              {bounty.acceptedFormats.map((fmt: string) => (
                <span key={fmt} className="px-2 py-1 rounded-md text-xs border bg-[var(--bg-2)] text-gray-300 border-[var(--line)] capitalize">
                  {fmt.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-950/50 border border-gray-800 rounded-xl">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-gray-500 mb-1"><User className="w-3 h-3" /> Creator</div>
            <div className="text-sm font-mono text-gray-200 truncate">{bounty.creator?.slice(0, 10)}...</div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-gray-500 mb-1"><Clock className="w-3 h-3" /> Deadline</div>
            <div className="text-sm text-gray-200">Block {bounty.deadline}</div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-gray-500 mb-1"><DollarSign className="w-3 h-3" /> Escrow</div>
            <div className="text-sm text-gray-200">{bounty.escrowBalance} USDC</div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-gray-500 mb-1">Submissions</div>
            <div className="text-sm text-gray-200">{bounty.submissionCount ?? bounty.submissions?.length ?? 0}</div>
          </div>
        </div>

        {(isOpen || isReviewing) && (
          <div className="flex gap-3 mt-6">
            {isOpen && (
              <button onClick={() => closeSubsMut.mutate()} disabled={closeSubsMut.isPending}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-yellow-600/10 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-600/20 cursor-pointer">
                Close Submissions
              </button>
            )}
            <button onClick={() => cancelMut.mutate()} disabled={cancelMut.isPending}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600/10 text-red-400 border border-red-500/20 hover:bg-red-600/20 cursor-pointer">
              Cancel Bounty
            </button>
          </div>
        )}

        {isCompleted && bounty.winner && (
          <div className="mt-6 p-4 bg-green-500/5 border border-green-500/20 rounded-lg">
            <div className="text-sm text-green-400 font-medium mb-1">Winner</div>
            <div className="font-mono text-sm text-gray-200">{bounty.winner}</div>
          </div>
        )}
      </div>

      {/* Submissions */}
      <div className="bg-[var(--bg-1)]/60 border border-[var(--line)] rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Submissions ({bounty.submissions?.length ?? 0})</h2>

        {(!bounty.submissions || bounty.submissions.length === 0) ? (
          <p className="text-gray-500 text-sm py-4">No submissions yet.</p>
        ) : (
          <div className="space-y-3">
            {bounty.submissions.map((sub: { id: number; submitter: string; submissionUrl: string; notes: string; status: number }) => {
              const subCfg = SUB_STATUS[sub.status] ?? SUB_STATUS[0];
              return (
                <div key={sub.id} className="border border-[var(--line)] rounded-lg p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-gray-300">{sub.submitter.slice(0, 10)}...</span>
                        <span className={`text-[11px] font-medium ${subCfg.color}`}>{subCfg.label}</span>
                      </div>
                      {sub.notes && <p className="text-sm text-gray-400 mb-2">{sub.notes}</p>}
                      <a href={sub.submissionUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-[var(--accent-400)] hover:underline">
                        <ExternalLink className="w-3 h-3" /> {sub.submissionUrl}
                      </a>
                    </div>
                    {sub.status === 0 && (isOpen || isReviewing) && (
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => selectWinnerMut.mutate(sub.id)} disabled={selectWinnerMut.isPending}
                          className="p-1.5 rounded-md bg-green-600/10 text-green-400 hover:bg-green-600/20 cursor-pointer" title="Select as winner">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => rejectSubMut.mutate(sub.id)} disabled={rejectSubMut.isPending}
                          className="p-1.5 rounded-md bg-red-600/10 text-red-400 hover:bg-red-600/20 cursor-pointer" title="Reject">
                          <XIcon className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    {sub.status === 1 && (
                      <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">Winner</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Submit work */}
      {isOpen && (
        <div className="bg-[var(--bg-1)]/60 border border-[var(--line)] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Submit Your Work</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-1 block">Submission URL</label>
              <input value={submitUrl} onChange={(e) => setSubmitUrl(e.target.value)} placeholder="https://github.com/your-repo"
                className="w-full bg-[var(--bg-0)]/60 border border-[var(--line)] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[var(--accent-500)]" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 mb-1 block">Notes (optional)</label>
              <textarea value={submitNotes} onChange={(e) => setSubmitNotes(e.target.value)} rows={3} placeholder="Describe your work..."
                className="w-full bg-[var(--bg-0)]/60 border border-[var(--line)] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[var(--accent-500)] resize-none" />
            </div>
            <button onClick={() => submitMut.mutate()} disabled={!submitUrl || submitMut.isPending}
              className="px-5 py-2.5 rounded-lg text-sm font-medium bg-[var(--accent-600)] hover:bg-[var(--accent-500)] text-white cursor-pointer disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed">
              {submitMut.isPending ? 'Submitting...' : 'Submit Work'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
