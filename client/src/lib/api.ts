import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Transform errors into readable messages
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      const serverMsg = error.response.data?.message;
      if (status === 502 || status === 503) {
        return Promise.reject(new Error('Server is not running. Start it with: cd server && pnpm start:dev'));
      }
      if (status === 404) return Promise.reject(new Error(serverMsg || 'Not found'));
      if (status === 400) return Promise.reject(new Error(serverMsg || 'Invalid request'));
      if (status === 403) return Promise.reject(new Error(serverMsg || 'Permission denied'));
      return Promise.reject(new Error(serverMsg || `Server error (${status})`));
    }
    if (error.code === 'ERR_NETWORK') {
      return Promise.reject(new Error('Cannot connect to server. Is it running?'));
    }
    return Promise.reject(error);
  },
);

export function setSender(address: string) {
  api.defaults.headers.common['x-sender'] = address;
}

// ─── Users ───────────────────────────────────────────────

export const users = {
  me: () => api.get('/users/me').then((r) => r.data),
  get: (wallet: string) => api.get(`/users/${wallet}`).then((r) => r.data),
  leaderboard: (limit?: number) =>
    api.get('/users/leaderboard', { params: { limit } }).then((r) => r.data),
  updateProfile: (data: Record<string, unknown>) =>
    api.patch('/users/me', data).then((r) => r.data),
};

// ─── Organizations ───────────────────────────────────────

export const organizations = {
  list: () => api.get('/organizations').then((r) => r.data),
  get: (id: number) => api.get(`/organizations/${id}`).then((r) => r.data),
  getBySlug: (slug: string) => api.get(`/organizations/slug/${slug}`).then((r) => r.data),
  my: () => api.get('/organizations/my').then((r) => r.data),
  create: (data: { name: string; slug: string; logo?: string; website?: string; description?: string; industry?: string; twitter?: string }) =>
    api.post('/organizations', data).then((r) => r.data),
  inviteMember: (orgId: number, walletAddress: string, role?: string) =>
    api.post(`/organizations/${orgId}/members`, { walletAddress, role }).then((r) => r.data),
  removeMember: (orgId: number, userId: number) =>
    api.delete(`/organizations/${orgId}/members/${userId}`).then((r) => r.data),
  updateMemberRole: (orgId: number, userId: number, role: string) =>
    api.patch(`/organizations/${orgId}/members/${userId}/role`, { role }).then((r) => r.data),
};

// ─── Listings (bounties, projects, grants, hackathons) ───

export const listings = {
  list: (params?: { type?: string; status?: string; orgId?: number }) =>
    api.get('/listings', { params }).then((r) => r.data),
  get: (id: number) => api.get(`/listings/${id}`).then((r) => r.data),
  getBySlug: (slug: string) => api.get(`/listings/slug/${slug}`).then((r) => r.data),
  stats: () => api.get('/listings/stats').then((r) => r.data),
  create: (data: {
    orgId: number;
    title: string;
    slug: string;
    description: string;
    type?: string;
    compensationType?: string;
    token?: string;
    rewardAmount?: string;
    rewards?: Record<string, number>;
    maxWinners?: number;
    maxBonusSpots?: number;
    isRewardPublic?: boolean;
    deadline: string;
    announcementDate?: string;
    skills?: string[];
    difficulty?: string;
    acceptedFormats?: string[];
    tracks?: string[];
    region?: string;
  }) => api.post('/listings', data).then((r) => r.data),

  // Status transitions
  publish: (id: number) => api.patch(`/listings/${id}/publish`).then((r) => r.data),
  closeSubmissions: (id: number) => api.patch(`/listings/${id}/close-submissions`).then((r) => r.data),
  announceWinners: (id: number) => api.patch(`/listings/${id}/announce-winners`).then((r) => r.data),
  complete: (id: number) => api.patch(`/listings/${id}/complete`).then((r) => r.data),
  cancel: (id: number) => api.patch(`/listings/${id}/cancel`).then((r) => r.data),
  extendDeadline: (id: number, deadline: string) =>
    api.patch(`/listings/${id}/extend-deadline`, { deadline }).then((r) => r.data),

  // Submissions
  submissions: (id: number) => api.get(`/listings/${id}/submissions`).then((r) => r.data),
  submit: (id: number, data: { link: string; tweet?: string; additionalInfo?: string; ask?: string }) =>
    api.post(`/listings/${id}/submissions`, data).then((r) => r.data),

  // Review (org-side)
  updateLabel: (subId: number, label: string) =>
    api.patch(`/listings/submissions/${subId}/label`, { label }).then((r) => r.data),
  updateNotes: (subId: number, notes: string) =>
    api.patch(`/listings/submissions/${subId}/notes`, { notes }).then((r) => r.data),
  selectWinner: (subId: number, position: number, rewardAmount: string) =>
    api.patch(`/listings/submissions/${subId}/select-winner`, { position, rewardAmount }).then((r) => r.data),
  removeWinner: (subId: number) =>
    api.patch(`/listings/submissions/${subId}/remove-winner`).then((r) => r.data),
  markPaid: (subId: number, txHash: string) =>
    api.patch(`/listings/submissions/${subId}/pay`, { txHash }).then((r) => r.data),
};

// ─── Funding Pools ───────────────────────────────────────

export const pools = {
  list: () => api.get('/funding-pools').then((r) => r.data),
  get: (id: number) => api.get(`/funding-pools/${id}`).then((r) => r.data),
  stats: () => api.get('/funding-pools/stats').then((r) => r.data),
  balance: (id: number) => api.get(`/funding-pools/${id}/balance`).then((r) => r.data),
  create: (data: { paymentToken: string; purpose: string; poolType: number }) =>
    api.post('/funding-pools', data).then((r) => r.data),
  deposit: (id: number, amount: string) =>
    api.post(`/funding-pools/${id}/deposit`, { amount }).then((r) => r.data),
  allocate: (id: number, data: { recipient: string; amount: string; reason: string }) =>
    api.post(`/funding-pools/${id}/allocate`, data).then((r) => r.data),
  pause: (id: number) => api.patch(`/funding-pools/${id}/pause`).then((r) => r.data),
  resume: (id: number) => api.patch(`/funding-pools/${id}/resume`).then((r) => r.data),
  close: (id: number) => api.patch(`/funding-pools/${id}/close`).then((r) => r.data),
};

// ─── Peer Allocation Circles ─────────────────────────────

export const circles = {
  list: () => api.get('/peer-allocation/circles').then((r) => r.data),
  get: (id: number) => api.get(`/peer-allocation/circles/${id}`).then((r) => r.data),
  members: (id: number) => api.get(`/peer-allocation/circles/${id}/members`).then((r) => r.data),
  create: (data: { name: string; paymentToken: string; epochDurationBlocks: number; givePerMember: number; rewardPoolPerEpoch: string }) =>
    api.post('/peer-allocation/circles', data).then((r) => r.data),
  addMember: (id: number, member: string) =>
    api.post(`/peer-allocation/circles/${id}/members`, { member }).then((r) => r.data),
  removeMember: (id: number, member: string) =>
    api.delete(`/peer-allocation/circles/${id}/members/${member}`).then((r) => r.data),
  give: (id: number, data: { recipient: string; amount: number }) =>
    api.post(`/peer-allocation/circles/${id}/give`, data).then((r) => r.data),
  advanceEpoch: (id: number) =>
    api.patch(`/peer-allocation/circles/${id}/advance-epoch`).then((r) => r.data),
  claimReward: (id: number, epoch: number) =>
    api.post(`/peer-allocation/circles/${id}/claim/${epoch}`).then((r) => r.data),
};

// ─── Dashboard Stats ─────────────────────────────────────

export const stats = {
  dashboard: () => api.get('/stats').then((r) => r.data),
};

export default api;
