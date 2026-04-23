import clsx from 'clsx';
import { BountyStatus, HackathonStatus, ReputationTier } from '../types';

const bountyStatusConfig: Record<BountyStatus, { label: string; color: string }> = {
  [BountyStatus.OPEN]: { label: 'Open', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  [BountyStatus.CLAIMED]: { label: 'Claimed', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  [BountyStatus.SUBMITTED]: { label: 'Submitted', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  [BountyStatus.APPROVED]: { label: 'Completed', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  [BountyStatus.CANCELLED]: { label: 'Cancelled', color: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
  [BountyStatus.DISPUTED]: { label: 'Disputed', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

const hackathonStatusConfig: Record<HackathonStatus, { label: string; color: string }> = {
  [HackathonStatus.REGISTRATION]: { label: 'Registration', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  [HackathonStatus.BUILDING]: { label: 'Building', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  [HackathonStatus.JUDGING]: { label: 'Judging', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  [HackathonStatus.COMPLETED]: { label: 'Completed', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  [HackathonStatus.CANCELLED]: { label: 'Cancelled', color: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
};

const tierConfig: Record<ReputationTier, { label: string; color: string }> = {
  [ReputationTier.NEWCOMER]: { label: 'Newcomer', color: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
  [ReputationTier.CONTRIBUTOR]: { label: 'Contributor', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  [ReputationTier.BUILDER]: { label: 'Builder', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  [ReputationTier.EXPERT]: { label: 'Expert', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  [ReputationTier.CORE]: { label: 'Core', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
};

export function BountyStatusBadge({ status }: { status: BountyStatus }) {
  const config = bountyStatusConfig[status];
  return (
    <span className={clsx('px-2.5 py-0.5 rounded-full text-xs font-medium border', config.color)}>
      {config.label}
    </span>
  );
}

export function HackathonStatusBadge({ status }: { status: HackathonStatus }) {
  const config = hackathonStatusConfig[status];
  return (
    <span className={clsx('px-2.5 py-0.5 rounded-full text-xs font-medium border', config.color)}>
      {config.label}
    </span>
  );
}

export function TierBadge({ tier }: { tier: ReputationTier }) {
  const config = tierConfig[tier];
  return (
    <span className={clsx('px-2.5 py-0.5 rounded-full text-xs font-medium border', config.color)}>
      {config.label}
    </span>
  );
}
