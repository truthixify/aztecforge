import { Link, Outlet, useLocation } from 'react-router-dom';
import { Hammer, Trophy, Users, Coins, Star, Scroll } from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { to: '/', label: 'Bounties', icon: Hammer },
  { to: '/hackathons', label: 'Hackathons', icon: Trophy },
  { to: '/pools', label: 'Funding Pools', icon: Coins },
  { to: '/circles', label: 'Peer Rewards', icon: Users },
  { to: '/quests', label: 'Quests', icon: Scroll },
  { to: '/reputation', label: 'Reputation', icon: Star },
];

export function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <Hammer className="w-6 h-6 text-purple-400" />
              <span className="text-xl font-bold text-white">AztecForge</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive =
                  item.to === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={clsx(
                      'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-purple-500/10 text-purple-400'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800',
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
