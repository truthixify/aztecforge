import { Link } from 'react-router-dom';
import { ArrowRight, Hammer, Trophy, Coins, Users, Scroll, Star } from 'lucide-react';

const MODULES = [
  { to: '/bounties', label: 'Bounties', icon: Hammer, hint: 'Task-based rewards' },
  { to: '/hackathons', label: 'Hackathons', icon: Trophy, hint: 'Time-boxed competitions' },
  { to: '/pools', label: 'Funding Pools', icon: Coins, hint: 'Pooled grant capital' },
  { to: '/circles', label: 'Peer Rewards', icon: Users, hint: 'GIVE allocation circles' },
  { to: '/quests', label: 'Quests', icon: Scroll, hint: 'Verifiable actions' },
  { to: '/reputation', label: 'Reputation', icon: Star, hint: 'On-chain standing' },
];

const STATS = [
  { label: 'Active bounties', value: '12' },
  { label: 'USDC in escrow', value: '$142k' },
  { label: 'Contributors', value: '384' },
  { label: 'Hackathons live', value: '3' },
];

const STEPS = [
  { step: '01', title: 'Fund escrow', body: 'Deposit USDC into a private escrow. Amounts can be shielded \u2014 contributors see only status, not totals.' },
  { step: '02', title: 'Builders claim & submit', body: 'Anyone can claim open work. Submissions link code, URLs, and proofs. Judges review with attestations.' },
  { step: '03', title: 'Settle on approval', body: 'On approval, escrow releases atomically to the claimer and reputation posts to the shared leaderboard.' },
];

export function LandingPage() {
  return (
    <div className="relative">
      {/* Animated background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
        <div
          className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-30 blur-3xl anim-drift"
          style={{ background: 'radial-gradient(circle, var(--accent-500), transparent 65%)' }}
        />
        <div
          className="absolute top-[30%] -left-60 w-[600px] h-[600px] rounded-full opacity-20 blur-3xl anim-drift"
          style={{ background: 'radial-gradient(circle, var(--accent-400), transparent 65%)', animationDelay: '-7s' }}
        />
      </div>

      {/* Hero */}
      <section className="pt-12 sm:pt-16 md:pt-28 pb-16 md:pb-32">
        <div className="max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--accent-500)]/30 bg-[var(--accent-500)]/10 text-[var(--accent-300)] text-xs font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-400)]" style={{ animation: 'pulseGlow 2s ease-in-out infinite' }} />
            Live on Aztec testnet
          </div>

          <h1 className="text-[2.5rem] leading-[1.05] sm:text-5xl md:text-7xl font-semibold text-white tracking-tight break-words">
            Private incentives
            <br />
            for <span className="bg-clip-text text-transparent bg-gradient-to-r from-[var(--accent-300)] via-[var(--accent-400)] to-[var(--accent-500)]">on-chain communities</span>
          </h1>

          <p className="mt-6 text-base sm:text-lg md:text-xl text-gray-400 max-w-2xl leading-relaxed">
            Six composable primitives for coordinating builders, grants, and reputation &mdash; all with optional reward privacy, settled trustlessly on Aztec Network.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row flex-wrap gap-3">
            <Link
              to="/bounties"
              className="group inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[var(--accent-600)] hover:bg-[var(--accent-500)] text-white font-medium text-sm transition-colors whitespace-nowrap"
            >
              Enter the forge
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/quests"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[var(--bg-1)] border border-[var(--line)] hover:border-[var(--bg-3)] text-gray-200 font-medium text-sm transition-colors whitespace-nowrap"
            >
              Explore quests
            </Link>
          </div>

          {/* Stats strip */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-px rounded-2xl overflow-hidden border border-[var(--line)] bg-[var(--line)]">
            {STATS.map((s) => (
              <div key={s.label} className="bg-[var(--bg-0)]/70 backdrop-blur-sm px-5 py-4">
                <div className="text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1.5">{s.label}</div>
                <div className="text-2xl md:text-3xl font-semibold text-white tabular-nums tracking-tight">{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modules */}
      <section className="py-12 md:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-12">
            <div className="text-xs uppercase tracking-[0.2em] text-[var(--accent-400)] font-medium mb-3">Six primitives</div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white tracking-tight">
              Composable by design.
            </h2>
            <p className="mt-3 text-gray-400 leading-relaxed">
              Mix and match primitives to shape how your community coordinates. Each module settles independently but shares reputation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {MODULES.map((m) => (
              <Link
                key={m.to}
                to={m.to}
                className="group text-left relative rounded-2xl border border-[var(--line)] bg-[var(--bg-1)]/60 backdrop-blur-sm p-6 hover:border-[var(--accent-500)]/40 hover:bg-[var(--bg-1)] hover:-translate-y-0.5 transition-all overflow-hidden"
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-[var(--accent-500)]/10 via-transparent to-transparent pointer-events-none" />
                <div className="relative">
                  <div className="w-10 h-10 rounded-lg bg-[var(--bg-2)] border border-[var(--line)] flex items-center justify-center mb-5 group-hover:border-[var(--accent-500)]/30 group-hover:bg-[var(--accent-500)]/10 transition-colors">
                    <m.icon className="w-5 h-5 text-[var(--accent-400)]" />
                  </div>
                  <h3 className="text-lg font-semibold text-white tracking-tight">{m.label}</h3>
                  <p className="mt-1.5 text-sm text-gray-400 leading-relaxed">{m.hint}</p>
                  <div className="mt-5 flex items-center gap-1.5 text-xs text-gray-500 group-hover:text-[var(--accent-300)] transition-colors">
                    Open module
                    <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-12 md:py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="text-xs uppercase tracking-[0.2em] text-[var(--accent-400)] font-medium mb-3">Built for privacy</div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white tracking-tight">
              Reward. Verify. Settle.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {STEPS.map((s) => (
              <div key={s.step} className="relative rounded-2xl border border-[var(--line)] bg-[var(--bg-1)]/50 p-6">
                <div className="font-mono text-xs text-[var(--accent-400)] mb-4">{s.step}</div>
                <h3 className="text-lg font-semibold text-white tracking-tight">{s.title}</h3>
                <p className="mt-2 text-sm text-gray-400 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-16 md:pb-32">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl border border-[var(--line)] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-600)]/15 via-transparent to-[var(--accent-500)]/10" />
            <div
              className="absolute -top-20 -right-20 w-80 h-80 rounded-full blur-3xl opacity-40 anim-drift"
              style={{ background: 'radial-gradient(circle, var(--accent-500), transparent 70%)' }}
            />
            <div className="relative p-6 sm:p-10 md:p-14 text-center">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white tracking-tight">
                Post your first bounty in under a minute.
              </h2>
              <p className="mt-3 text-gray-400 max-w-md mx-auto">
                No accounts, no paperwork. Just an Aztec address and a task worth doing.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row flex-wrap gap-3 justify-center">
                <Link
                  to="/bounties/new"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-white hover:bg-gray-100 text-gray-950 font-medium text-sm transition-colors whitespace-nowrap"
                >
                  <Hammer className="w-4 h-4" />
                  Post a bounty
                </Link>
                <Link
                  to="/bounties"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[var(--bg-1)] border border-[var(--line)] hover:border-[var(--bg-3)] text-gray-200 font-medium text-sm transition-colors whitespace-nowrap"
                >
                  Browse the board
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
