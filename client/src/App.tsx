import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AztecProvider } from './contexts/AztecContext';
import { Layout } from './components/Layout';
import { BountiesPage } from './pages/BountiesPage';
import { BountyDetailPage } from './pages/BountyDetailPage';
import { CreateBountyPage } from './pages/CreateBountyPage';
import { ReputationPage } from './pages/ReputationPage';
import { ReputationDetailPage } from './pages/ReputationDetailPage';
import { HackathonsPage } from './pages/HackathonsPage';
import { HackathonDetailPage } from './pages/HackathonDetailPage';
import { CreateHackathonPage } from './pages/CreateHackathonPage';
import { PoolsPage } from './pages/PoolsPage';
import { PoolDetailPage } from './pages/PoolDetailPage';
import { CreatePoolPage } from './pages/CreatePoolPage';
import { CirclesPage } from './pages/CirclesPage';
import { CircleDetailPage } from './pages/CircleDetailPage';
import { CreateCirclePage } from './pages/CreateCirclePage';
import { QuestsPage } from './pages/QuestsPage';
import { QuestDetailPage } from './pages/QuestDetailPage';
import { CreateQuestPage } from './pages/CreateQuestPage';

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
    <AztecProvider>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<BountiesPage />} />
            <Route path="/bounties" element={<BountiesPage />} />
            <Route path="/bounties/new" element={<CreateBountyPage />} />
            <Route path="/bounties/:id" element={<BountyDetailPage />} />

            <Route path="/hackathons" element={<HackathonsPage />} />
            <Route path="/hackathons/new" element={<CreateHackathonPage />} />
            <Route path="/hackathons/:id" element={<HackathonDetailPage />} />

            <Route path="/pools" element={<PoolsPage />} />
            <Route path="/pools/new" element={<CreatePoolPage />} />
            <Route path="/pools/:id" element={<PoolDetailPage />} />

            <Route path="/circles" element={<CirclesPage />} />
            <Route path="/circles/new" element={<CreateCirclePage />} />
            <Route path="/circles/:id" element={<CircleDetailPage />} />

            <Route path="/quests" element={<QuestsPage />} />
            <Route path="/quests/new" element={<CreateQuestPage />} />
            <Route path="/quests/:id" element={<QuestDetailPage />} />

            <Route path="/reputation" element={<ReputationPage />} />
            <Route path="/reputation/:address" element={<ReputationDetailPage />} />
          </Route>
        </Routes>
        <ToastContainer
          position="top-right"
          autoClose={4000}
          theme="dark"
          toastClassName="bg-gray-900 border border-gray-800"
        />
      </BrowserRouter>
    </QueryClientProvider>
    </AztecProvider>
  );
}
