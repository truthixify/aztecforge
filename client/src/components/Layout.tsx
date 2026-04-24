import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Hammer, Trophy, Users, Coins, Star, Scroll, Menu, X, Home } from 'lucide-react';
import clsx from 'clsx';
import { LogoMark } from './LogoMark';
import { WalletButton } from './WalletButton';

const NAV_ITEMS = [
  { to: '/bounties', key: 'bounties', label: 'Bounties', icon: Hammer, hint: 'Task-based rewards' },
  { to: '/hackathons', key: 'hackathons', label: 'Hackathons', icon: Trophy, hint: 'Time-boxed competitions' },
  { to: '/pools', key: 'pools', label: 'Funding Pools', icon: Coins, hint: 'Pooled grant capital' },
  { to: '/circles', key: 'circles', label: 'Peer Rewards', icon: Users, hint: 'GIVE allocation circles' },
  { to: '/quests', key: 'quests', label: 'Quests', icon: Scroll, hint: 'Verifiable actions' },
  { to: '/reputation', key: 'reputation', label: 'Reputation', icon: Star, hint: 'On-chain standing' },
];

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [mobileOpen]);

  const isActive = (to: string) => {
    if (to === '/') return location.pathname === '/';
    return location.pathname === to || location.pathname.startsWith(to + '/');
  };

  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen text-gray-100">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed top-0 left-0 bottom-0 w-60 border-r border-[var(--line)] bg-[var(--bg-0)]/70 backdrop-blur-xl flex-col z-30">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 px-5 h-16 border-b border-[var(--line)] hover:bg-[var(--bg-1)]/50 transition-colors"
        >
          <LogoMark size={24} />
          <div className="text-left">
            <div className="text-[15px] font-semibold text-white tracking-tight leading-none">AztecForge</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">Private incentives</div>
          </div>
        </button>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          <Link
            to="/"
            className={clsx(
              'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
              isHome ? 'bg-[var(--bg-2)] text-white' : 'text-gray-500 hover:text-gray-200 hover:bg-[var(--bg-1)]',
            )}
          >
            <Home className="w-4 h-4" />
            Home
          </Link>

          <div className="pt-4 pb-1 px-3 text-[10px] uppercase tracking-wider text-gray-600 font-medium">Modules</div>

          {NAV_ITEMS.map((item) => {
            const active = isActive(item.to);
            return (
              <Link
                key={item.key}
                to={item.to}
                className={clsx(
                  'group w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative',
                  active ? 'bg-[var(--bg-2)] text-white' : 'text-gray-500 hover:text-gray-200 hover:bg-[var(--bg-1)]',
                )}
              >
                {active && <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-[var(--accent-400)]" />}
                <item.icon className={clsx('w-4 h-4 transition-colors', active ? 'text-[var(--accent-400)]' : 'text-gray-600 group-hover:text-gray-400')} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-[var(--line)]">
          <WalletButton />
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-40 backdrop-blur-xl bg-[var(--bg-0)]/85 border-b border-[var(--line)]">
        <div className="h-14 px-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <LogoMark size={22} />
            <span className="text-[15px] font-semibold text-white tracking-tight">AztecForge</span>
          </Link>
          <button onClick={() => setMobileOpen(true)} className="p-2 -mr-2 rounded-lg hover:bg-[var(--bg-1)] text-gray-300">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" style={{ animation: 'fadeIn 0.15s ease-out' }} onClick={() => setMobileOpen(false)} />
          <div className="absolute top-0 right-0 bottom-0 w-[85%] max-w-[320px] bg-[var(--bg-0)] border-l border-[var(--line)] flex flex-col" style={{ animation: 'slideIn 0.2s ease-out' }}>
            <div className="flex items-center justify-between h-14 px-4 border-b border-[var(--line)]">
              <div className="flex items-center gap-2">
                <LogoMark size={22} />
                <span className="text-[15px] font-semibold text-white">AztecForge</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-2 -mr-2 rounded-lg hover:bg-[var(--bg-1)] text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
              <Link to="/" className={clsx('w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors', isHome ? 'bg-[var(--bg-2)] text-white' : 'text-gray-400 hover:bg-[var(--bg-1)] hover:text-gray-200')}>
                <Home className="w-4 h-4" /> Home
              </Link>
              <div className="pt-4 pb-1 px-3 text-[10px] uppercase tracking-wider text-gray-600 font-medium">Modules</div>
              {NAV_ITEMS.map((item) => {
                const active = isActive(item.to);
                return (
                  <Link key={item.key} to={item.to} className={clsx('w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors', active ? 'bg-[var(--bg-2)] text-white' : 'text-gray-400 hover:bg-[var(--bg-1)] hover:text-gray-200')}>
                    <item.icon className={clsx('w-4 h-4', active ? 'text-[var(--accent-400)]' : 'text-gray-600')} />
                    <div className="flex-1 text-left">
                      <div>{item.label}</div>
                      <div className="text-[11px] text-gray-600 mt-0.5">{item.hint}</div>
                    </div>
                  </Link>
                );
              })}
            </nav>
            <div className="p-3 border-t border-[var(--line)]">
              <WalletButton />
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="md:ml-60 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
