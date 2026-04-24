import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach sender address to every request
export function setSender(address: string) {
  api.defaults.headers.common['x-sender'] = address;
}

// Bounties
export const bounties = {
  list: (params?: { status?: number; creator?: string }) =>
    api.get('/bounties', { params }).then((r) => r.data),
  get: (id: number) => api.get(`/bounties/${id}`).then((r) => r.data),
  stats: () => api.get('/bounties/stats').then((r) => r.data),
  create: (data: {
    paymentToken: string;
    rewardAmount: string;
    title: string;
    description: string;
    deadlineBlock: number;
    isAmountPublic?: boolean;
    skills?: string[];
    difficulty?: string;
  }) => api.post('/bounties', data).then((r) => r.data),
  submissions: (id: number) => api.get(`/bounties/${id}/submissions`).then((r) => r.data),
  submit: (id: number, data: { submissionUrl: string; notes?: string }) =>
    api.post(`/bounties/${id}/submissions`, data).then((r) => r.data),
  selectWinner: (id: number, subId: number) =>
    api.patch(`/bounties/${id}/submissions/${subId}/select`).then((r) => r.data),
  rejectSubmission: (id: number, subId: number) =>
    api.patch(`/bounties/${id}/submissions/${subId}/reject`).then((r) => r.data),
  closeSubmissions: (id: number) => api.patch(`/bounties/${id}/close-submissions`).then((r) => r.data),
  cancel: (id: number) => api.patch(`/bounties/${id}/cancel`).then((r) => r.data),
};

// Reputation
export const reputation = {
  list: () => api.get('/reputation').then((r) => r.data),
  get: (address: string) => api.get(`/reputation/${address}`).then((r) => r.data),
  leaderboard: (limit?: number) =>
    api.get('/reputation/leaderboard', { params: { limit } }).then((r) => r.data),
  stats: () => api.get('/reputation/stats').then((r) => r.data),
  checkGate: (address: string, gateId: number) =>
    api.get(`/reputation/${address}/gate/${gateId}`).then((r) => r.data),
};

// Funding Pools
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

// Peer Allocation
export const circles = {
  list: () => api.get('/peer-allocation/circles').then((r) => r.data),
  get: (id: number) => api.get(`/peer-allocation/circles/${id}`).then((r) => r.data),
  members: (id: number) => api.get(`/peer-allocation/circles/${id}/members`).then((r) => r.data),
  create: (data: {
    name: string;
    paymentToken: string;
    epochDurationBlocks: number;
    givePerMember: number;
    rewardPoolPerEpoch: string;
  }) => api.post('/peer-allocation/circles', data).then((r) => r.data),
  addMember: (id: number, member: string) =>
    api.post(`/peer-allocation/circles/${id}/members`, { member }).then((r) => r.data),
  give: (id: number, data: { recipient: string; amount: number }) =>
    api.post(`/peer-allocation/circles/${id}/give`, data).then((r) => r.data),
  advanceEpoch: (id: number) =>
    api.patch(`/peer-allocation/circles/${id}/advance-epoch`).then((r) => r.data),
  removeMember: (id: number, member: string) =>
    api.delete(`/peer-allocation/circles/${id}/members/${member}`).then((r) => r.data),
  claimReward: (id: number, epoch: number) =>
    api.post(`/peer-allocation/circles/${id}/claim/${epoch}`).then((r) => r.data),
};

// Hackathons
export const hackathons = {
  list: () => api.get('/hackathons').then((r) => r.data),
  get: (id: number) => api.get(`/hackathons/${id}`).then((r) => r.data),
  teams: (id: number) => api.get(`/hackathons/${id}/teams`).then((r) => r.data),
  submissions: (id: number) => api.get(`/hackathons/${id}/submissions`).then((r) => r.data),
  create: (data: {
    name: string;
    description: string;
    paymentToken: string;
    totalPrizePool: string;
    submissionDeadline: number;
    judgingDeadline: number;
    tracks: string[];
  }) => api.post('/hackathons', data).then((r) => r.data),
  registerTeam: (id: number, data: { teamName: string; members?: string[] }) =>
    api.post(`/hackathons/${id}/teams`, data).then((r) => r.data),
  submitProject: (id: number, data: {
    teamId: number;
    trackIndex: number;
    projectName: string;
    description: string;
    repoUrl: string;
    demoUrl?: string;
  }) => api.post(`/hackathons/${id}/submissions`, data).then((r) => r.data),
  score: (id: number, subId: number, data: { score: number; feedback?: string }) =>
    api.post(`/hackathons/${id}/submissions/${subId}/score`, data).then((r) => r.data),
  awardPrize: (id: number, data: { teamId: number; placement: number; prizeAmount: string }) =>
    api.post(`/hackathons/${id}/prizes`, data).then((r) => r.data),
  startBuilding: (id: number) => api.patch(`/hackathons/${id}/start-building`).then((r) => r.data),
  startJudging: (id: number) => api.patch(`/hackathons/${id}/start-judging`).then((r) => r.data),
  finalize: (id: number) => api.patch(`/hackathons/${id}/finalize`).then((r) => r.data),
  addJudge: (id: number, judge: string) => api.post(`/hackathons/${id}/judges`, { judge }).then((r) => r.data),
};

// Quests
export const quests = {
  list: (params?: { status?: number; creator?: string }) =>
    api.get('/quests', { params }).then((r) => r.data),
  get: (id: number) => api.get(`/quests/${id}`).then((r) => r.data),
  stats: () => api.get('/quests/stats').then((r) => r.data),
  completions: (id: number) => api.get(`/quests/${id}/completions`).then((r) => r.data),
  create: (data: {
    name: string;
    description: string;
    questType: number;
    paymentToken: string;
    rewardPerCompletion: string;
    maxCompletions: number;
    deadlineBlock: number;
    reputationGateId?: number;
  }) => api.post('/quests', data).then((r) => r.data),
  complete: (id: number, verificationUrl: string) =>
    api.post(`/quests/${id}/complete`, { verificationUrl }).then((r) => r.data),
  verify: (id: number, data: { completer: string; verificationUrl: string }) =>
    api.post(`/quests/${id}/verify`, data).then((r) => r.data),
  deactivate: (id: number) => api.patch(`/quests/${id}/deactivate`).then((r) => r.data),
  addVerifier: (id: number, verifier: string) =>
    api.post(`/quests/${id}/verifiers`, { verifier }).then((r) => r.data),
};

export default api;

// Dashboard stats
export const stats = {
  dashboard: () => api.get("/stats").then((r) => r.data),
};
