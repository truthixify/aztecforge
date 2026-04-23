import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/Layout';
import { BountiesPage } from './pages/BountiesPage';
import { BountyDetailPage } from './pages/BountyDetailPage';
import { CreateBountyPage } from './pages/CreateBountyPage';
import { ReputationPage } from './pages/ReputationPage';
import { HackathonsPage } from './pages/HackathonsPage';
import { PoolsPage } from './pages/PoolsPage';
import { CirclesPage } from './pages/CirclesPage';
import { QuestsPage } from './pages/QuestsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<BountiesPage />} />
            <Route path="/bounties" element={<BountiesPage />} />
            <Route path="/bounties/new" element={<CreateBountyPage />} />
            <Route path="/bounties/:id" element={<BountyDetailPage />} />
            <Route path="/reputation" element={<ReputationPage />} />
            <Route path="/hackathons" element={<HackathonsPage />} />
            <Route path="/pools" element={<PoolsPage />} />
            <Route path="/circles" element={<CirclesPage />} />
            <Route path="/quests" element={<QuestsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
