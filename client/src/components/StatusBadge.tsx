import clsx from 'clsx';
import { BountyStatus, HackathonStatus, ReputationTier } from '../types';
import { Star } from 'lucide-react';

const statusStyles: Record<string, { bg: string; text: string; border: string; label: string }> = {
  open: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20', label: 'Open' },
  active: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20', label: 'Active' },
  claimed: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', label: 'Claimed' },
  submitted: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20', label: 'Submitted' },
  approved: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', label: 'Completed' },
  cancelled: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20', label: 'Cancelled' },
  disputed: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', label: 'Disputed' },
  registration: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20', label: 'Registration' },
  building: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', label: 'Building' },
  judging: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20', label: 'Judging' },
  completed: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', label: 'Completed' },
  inactive: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20', label: 'Inactive' },
  paused: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20', label: 'Paused' },
};

function StatusBadge({ status, children }: { status: string; children?: React.ReactNode }) {
  const s = statusStyles[status] || statusStyles.open;
  return (
    <span className={clsx('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border', s.bg, s.text, s.border)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {children || s.label}
    </span>
  );
}

const bountyStatusMap: Record<BountyStatus, string> = {
  [BountyStatus.OPEN]: 'open',
  [BountyStatus.CLAIMED]: 'claimed',
  [BountyStatus.SUBMITTED]: 'submitted',
  [BountyStatus.APPROVED]: 'approved',
  [BountyStatus.CANCELLED]: 'cancelled',
  [BountyStatus.DISPUTED]: 'disputed',
};

const hackathonStatusMap: Record<HackathonStatus, string> = {
  [HackathonStatus.REGISTRATION]: 'registration',
  [HackathonStatus.BUILDING]: 'building',
  [HackathonStatus.JUDGING]: 'judging',
  [HackathonStatus.COMPLETED]: 'completed',
  [HackathonStatus.CANCELLED]: 'cancelled',
};

const tierConfig: Record<ReputationTier, { label: string; bg: string; color: string; border: string }> = {
  [ReputationTier.NEWCOMER]: { label: 'Newcomer', bg: 'bg-gray-500/10', color: 'text-gray-400', border: 'border-gray-500/20' },
  [ReputationTier.CONTRIBUTOR]: { label: 'Contributor', bg: 'bg-blue-500/10', color: 'text-blue-400', border: 'border-blue-500/20' },
  [ReputationTier.BUILDER]: { label: 'Builder', bg: 'bg-green-500/10', color: 'text-green-400', border: 'border-green-500/20' },
  [ReputationTier.EXPERT]: { label: 'Expert', bg: 'bg-yellow-500/10', color: 'text-yellow-400', border: 'border-yellow-500/20' },
  [ReputationTier.CORE]: { label: 'Core', bg: 'bg-purple-500/10', color: 'text-purple-400', border: 'border-purple-500/20' },
};

export function BountyStatusBadge({ status }: { status: BountyStatus }) {
  return <StatusBadge status={bountyStatusMap[status]} />;
}

export function HackathonStatusBadge({ status }: { status: HackathonStatus }) {
  return <StatusBadge status={hackathonStatusMap[status]} />;
}

export function TierBadge({ tier }: { tier: ReputationTier }) {
  const config = tierConfig[tier];
  return (
    <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border', config.bg, config.color, config.border)}>
      <Star className="w-3 h-3 fill-current" />
      {config.label}
    </span>
  );
}
