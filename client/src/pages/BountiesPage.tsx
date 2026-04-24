import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Hammer, Clock, EyeOff, Plus, FileText } from 'lucide-react';
import { listings } from '../lib/api';
import { StatsSkeleton, ListSkeleton } from '../components/Skeleton';
import { StatCard } from '../components/StatCard';
import type { Bounty, BountyStats } from '../types';

const DIFFICULTY_DOT: Record<string, string> = {
  easy: 'bg-green-400',
  medium: 'bg-yellow-400',
  hard: 'bg-red-400',
};

const BOUNTY_STATUS: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Draft', color: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
  OPEN: { label: 'Open', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  REVIEW: { label: 'Reviewing', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  CLOSED: { label: 'Winners Announced', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  COMPLETED: { label: 'Completed', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  CANCELLED: { label: 'Cancelled', color: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
};

export function BountiesPage() {
  const { data: bountyList = [], isLoading } = useQuery<Bounty[]>({
    queryKey: ['bounties'],
    queryFn: () => listings.list({ type: "BOUNTY" }),
  });

  const { data: stats, isLoading: statsLoading } = useQuery<BountyStats>({
    queryKey: ['bounties', 'stats'],
    queryFn: () => listings.stats(),
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
      {statsLoading ? <StatsSkeleton count={4} /> : stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Posted" value={stats.totalBountiesPosted} />
          <StatCard label="Completed" value={stats.totalBountiesCompleted} />
          <StatCard label="Escrowed" value={stats.totalValueEscrowed} sub="USDC" accent="text-green-400" />
          <StatCard label="Paid out" value={stats.totalValuePaid} sub="USDC" />
        </div>
      )}

      {/* List */}
      {isLoading ? <ListSkeleton count={4} /> : <div className="space-y-2">
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
                    {(() => { const s = BOUNTY_STATUS[bounty.status] ?? BOUNTY_STATUS.OPEN; return (
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${s.color}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />{s.label}
                      </span>
                    ); })()}
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
                    {(bounty as Record<string, unknown>).submissionCount !== undefined && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <FileText className="w-3 h-3" />
                        {String((bounty as Record<string, unknown>).submissionCount)} submissions
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      {bounty.deadline ? new Date(bounty.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No deadline'}
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
      </div>}
    </div>
  );
}
