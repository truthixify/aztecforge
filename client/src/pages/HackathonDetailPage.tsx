import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Trophy, Users, FileText, DollarSign, User, Clock } from 'lucide-react';
import { listings } from '../lib/api';
import { HackathonStatusBadge } from '../components/StatusBadge';
import { MetadataGrid } from '../components/MetadataGrid';
import { Tabs } from '../components/Tabs';
import { DetailSkeleton } from '../components/Skeleton';
import { HackathonStatus } from '../types';

export function HackathonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const hackId = Number(id);
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('teams');
  const [teamName, setTeamName] = useState('');
  const [submitForm, setSubmitForm] = useState({ trackIndex: 0, projectName: '', description: '', repoUrl: '', demoUrl: '' });
  const [scoreForm, setScoreForm] = useState<{ subId: number | null; score: number }>({ subId: null, score: 80 });
  const [prizeForm, setPrizeForm] = useState({ teamId: 0, placement: 1, prizeAmount: '' });

  const { data: hack, isLoading } = useQuery({ queryKey: ['hackathons', hackId], queryFn: () => listings.get(hackId) });
  const { data: teams = [] } = useQuery({ queryKey: ['hackathons', hackId, 'teams'], queryFn: () => listings.submissions(hackId) });
  const { data: submissions = [] } = useQuery({ queryKey: ['hackathons', hackId, 'submissions'], queryFn: () => listings.submissions(hackId) });

  const registerTeam = useMutation({
    mutationFn: () => listings.submit(hackId, { teamName }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hackathons', hackId] }); setTeamName(''); },
  });
  const submitProject = useMutation({
    mutationFn: () => listings.submit(hackId, { ...submitForm, teamId: teams[0]?.teamId ?? 0 }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hackathons', hackId] }); setSubmitForm({ trackIndex: 0, projectName: '', description: '', repoUrl: '', demoUrl: '' }); },
  });
  const scoreSub = useMutation({
    mutationFn: () => listings.updateLabel(hackId, scoreForm.subId!, { score: scoreForm.score }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hackathons', hackId, 'submissions'] }); setScoreForm({ subId: null, score: 80 }); },
  });
  const startBuilding = useMutation({ mutationFn: () => listings.closeSubmissions(hackId), onSuccess: () => qc.invalidateQueries({ queryKey: ['hackathons', hackId] }) });
  const startJudging = useMutation({ mutationFn: () => listings.closeSubmissions(hackId), onSuccess: () => qc.invalidateQueries({ queryKey: ['hackathons', hackId] }) });
  const finalize = useMutation({ mutationFn: () => listings.announceWinners(hackId), onSuccess: () => qc.invalidateQueries({ queryKey: ['hackathons', hackId] }) });
  const awardPrize = useMutation({
    mutationFn: () => listings.selectWinner(hackId, prizeForm),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hackathons', hackId] }); setPrizeForm({ teamId: 0, placement: 1, prizeAmount: '' }); },
  });

  if (isLoading || !hack) return <DetailSkeleton />;

  const tabItems = [
    { id: 'teams', label: 'Teams', count: teams.length },
    { id: 'submissions', label: 'Submissions', count: submissions.length },
    { id: 'prizes', label: 'Prizes' },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <Link to="/hackathons" className="flex items-center gap-2 text-gray-400 hover:text-gray-200 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Hackathons
      </Link>

      <div className="bg-[var(--bg-1)]/60 border border-[var(--line)] rounded-xl p-8 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-white">{hack.name}</h1>
              <HackathonStatusBadge status={hack.status} />
            </div>
            <div className="flex gap-2 mt-2">
              {hack.tracks?.map((t: string) => (
                <span key={t} className="bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded text-xs">{t}</span>
              ))}
            </div>
          </div>
          <p className="text-2xl font-bold text-green-400">{hack.prizePool} USDC</p>
        </div>
        <p className="text-gray-400 mb-6">{hack.description}</p>

        <MetadataGrid items={[
          { icon: <Trophy className="w-4 h-4" />, label: 'Prize Pool', value: `${hack.prizePool} USDC` },
          { icon: <Users className="w-4 h-4" />, label: 'Teams', value: hack.teamCount },
          { icon: <FileText className="w-4 h-4" />, label: 'Submissions', value: hack.submissionCount },
          { icon: <User className="w-4 h-4" />, label: 'Organizer', value: `${String(hack.organizer).slice(0, 10)}...`, mono: true },
        ]} />

        {/* Phase transition buttons */}
        <div className="flex gap-3 mt-6">
          {hack.status === HackathonStatus.REGISTRATION && (
            <button onClick={() => startBuilding.mutate()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">Start Building Phase</button>
          )}
          {hack.status === HackathonStatus.BUILDING && (
            <button onClick={() => startJudging.mutate()} className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium">Start Judging Phase</button>
          )}
          {hack.status === HackathonStatus.JUDGING && (
            <button onClick={() => finalize.mutate()} className="bg-[var(--accent-600)] hover:bg-[var(--accent-500)] text-white px-4 py-2 rounded-lg text-sm font-medium">Finalize Results</button>
          )}
        </div>
      </div>

      <Tabs tabs={tabItems} activeTab={activeTab} onChange={setActiveTab} />

      <div className="mt-6">
        {activeTab === 'teams' && (
          <div>
            <div className="space-y-2 mb-6">
              {teams.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No teams registered yet</p>
              ) : (
                teams.map((t: { teamId: number; name: string; lead: string; memberCount: number }) => (
                  <div key={t.teamId} className="bg-[var(--bg-1)]/60 border border-[var(--line)] rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <p className="text-white font-medium">{t.name}</p>
                      <p className="text-xs text-gray-500 font-mono">{String(t.lead).slice(0, 12)}...</p>
                    </div>
                    <span className="text-sm text-gray-400">{t.memberCount} member{t.memberCount !== 1 ? 's' : ''}</span>
                  </div>
                ))
              )}
            </div>
            {hack.status === HackathonStatus.REGISTRATION && (
              <div className="flex gap-3">
                <input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Team name"
                  className="flex-1 bg-gray-900 border border-[var(--line)] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[var(--accent-500)]" />
                <button onClick={() => registerTeam.mutate()} disabled={!teamName}
                  className="bg-[var(--accent-600)] hover:bg-[var(--accent-500)] disabled:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                  Register Team
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'submissions' && (
          <div>
            <div className="space-y-2 mb-6">
              {submissions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No submissions yet</p>
              ) : (
                submissions.map((s: { submissionId: number; projectName: string; trackIndex: number; averageScore: number; repoUrl: string }) => (
                  <div key={s.submissionId} className="bg-[var(--bg-1)]/60 border border-[var(--line)] rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-white font-medium">{s.projectName}</p>
                        <p className="text-xs text-gray-500">Track {s.trackIndex} | Score: {s.averageScore}/100</p>
                      </div>
                      <div className="flex gap-2">
                        {s.repoUrl && <a href={s.repoUrl} target="_blank" rel="noreferrer" className="text-purple-400 text-xs hover:underline">Repo</a>}
                        {hack.status === HackathonStatus.JUDGING && (
                          <button onClick={() => setScoreForm({ subId: s.submissionId, score: 80 })}
                            className="text-yellow-400 text-xs hover:underline">Score</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {scoreForm.subId !== null && (
              <div className="bg-gray-950/50 border border-[var(--line)] rounded-lg p-4 mb-4">
                <p className="text-sm text-white mb-2">Score Submission #{scoreForm.subId}</p>
                <div className="flex gap-3">
                  <input type="number" min={0} max={100} value={scoreForm.score} onChange={(e) => setScoreForm((p) => ({ ...p, score: Number(e.target.value) }))}
                    className="w-20 bg-gray-900 border border-[var(--line)] rounded-lg px-3 py-2 text-white text-sm" />
                  <button onClick={() => scoreSub.mutate()} className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium">Submit Score</button>
                  <button onClick={() => setScoreForm({ subId: null, score: 80 })} className="text-gray-400 text-sm">Cancel</button>
                </div>
              </div>
            )}

            {(hack.status === HackathonStatus.REGISTRATION || hack.status === HackathonStatus.BUILDING) && (
              <div className="bg-gray-950/50 border border-[var(--line)] rounded-lg p-4">
                <p className="text-sm text-white mb-3">Submit Project</p>
                <div className="space-y-3">
                  <input value={submitForm.projectName} onChange={(e) => setSubmitForm((p) => ({ ...p, projectName: e.target.value }))} placeholder="Project name"
                    className="w-full bg-gray-900 border border-[var(--line)] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[var(--accent-500)]" />
                  <textarea value={submitForm.description} onChange={(e) => setSubmitForm((p) => ({ ...p, description: e.target.value }))} placeholder="Description" rows={3}
                    className="w-full bg-gray-900 border border-[var(--line)] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[var(--accent-500)]" />
                  <input value={submitForm.repoUrl} onChange={(e) => setSubmitForm((p) => ({ ...p, repoUrl: e.target.value }))} placeholder="Repository URL"
                    className="w-full bg-gray-900 border border-[var(--line)] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[var(--accent-500)]" />
                  <button onClick={() => submitProject.mutate()} disabled={!submitForm.projectName || !submitForm.repoUrl}
                    className="bg-[var(--accent-600)] hover:bg-[var(--accent-500)] disabled:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium">Submit</button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'prizes' && (
          <div>
            <p className="text-gray-500 text-center py-4 text-sm">Prizes are awarded after the hackathon is finalized.</p>
            {hack.status === HackathonStatus.COMPLETED && (
              <div className="bg-gray-950/50 border border-[var(--line)] rounded-lg p-4">
                <p className="text-sm text-white mb-3">Award Prize</p>
                <div className="flex gap-3 items-end">
                  <div>
                    <label className="text-xs text-gray-500">Team ID</label>
                    <input type="number" value={prizeForm.teamId} onChange={(e) => setPrizeForm((p) => ({ ...p, teamId: Number(e.target.value) }))}
                      className="w-20 bg-gray-900 border border-[var(--line)] rounded-lg px-3 py-2 text-white text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Placement</label>
                    <input type="number" min={1} value={prizeForm.placement} onChange={(e) => setPrizeForm((p) => ({ ...p, placement: Number(e.target.value) }))}
                      className="w-16 bg-gray-900 border border-[var(--line)] rounded-lg px-3 py-2 text-white text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Amount</label>
                    <input value={prizeForm.prizeAmount} onChange={(e) => setPrizeForm((p) => ({ ...p, prizeAmount: e.target.value }))} placeholder="USDC"
                      className="w-28 bg-gray-900 border border-[var(--line)] rounded-lg px-3 py-2 text-white text-sm" />
                  </div>
                  <button onClick={() => awardPrize.mutate()} disabled={!prizeForm.prizeAmount}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium">Award</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
