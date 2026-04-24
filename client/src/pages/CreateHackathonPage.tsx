import { useToast } from "../components/Toast";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { listings } from '../lib/api';

export function CreateHackathonPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({
    name: '',
    description: '',
    totalPrizePool: '',
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    judgingDeadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    tracks: '',
  });

  const mutation = useMutation({
    mutationFn: () =>
      listings.create({
        orgId: 1,
        title: form.name,
        slug: form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        description: form.description,
        type: 'HACKATHON',
        rewardAmount: form.totalPrizePool,
        deadline: new Date(form.deadline).toISOString(),
        judgingDeadline: new Date(form.judgingDeadline).toISOString(),
        tracks: form.tracks.split(',').map((t) => t.trim()).filter(Boolean),
      }),
    onSuccess: () => { toast.success('Hackathon created'); navigate('/hackathons'); },
  });

  const update = (field: string, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Create a Hackathon</h1>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Hackathon Name</label>
          <input type="text" value={form.name} onChange={(e) => update('name', e.target.value)}
            className="w-full bg-gray-900 border border-[var(--line)] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[var(--accent-500)]"
            placeholder="e.g., AztecForge Privacy Hackathon #1" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
          <textarea value={form.description} onChange={(e) => update('description', e.target.value)} rows={4}
            className="w-full bg-gray-900 border border-[var(--line)] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[var(--accent-500)]"
            placeholder="Build privacy-first applications on Aztec..." />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Total Prize Pool (USDC)</label>
            <input type="text" value={form.totalPrizePool} onChange={(e) => update('totalPrizePool', e.target.value)}
              className="w-full bg-gray-900 border border-[var(--line)] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[var(--accent-500)]"
              placeholder="50000" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Tracks (comma-separated)</label>
            <input type="text" value={form.tracks} onChange={(e) => update('tracks', e.target.value)}
              className="w-full bg-gray-900 border border-[var(--line)] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[var(--accent-500)]"
              placeholder="DeFi, Social, Tooling, Gaming" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Submission Deadline</label>
            <input type="date" value={form.deadline} onChange={(e) => update('deadline', e.target.value)}
              className="w-full bg-gray-900 border border-[var(--line)] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[var(--accent-500)]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Judging Deadline</label>
            <input type="date" value={form.judgingDeadline} onChange={(e) => update('judgingDeadline', e.target.value)}
              className="w-full bg-gray-900 border border-[var(--line)] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[var(--accent-500)]" />
          </div>
        </div>
        <div className="flex gap-3 pt-4">
          <button onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !form.name || !form.description || !form.totalPrizePool}
            className="bg-[var(--accent-600)] hover:bg-[var(--accent-500)] disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-medium transition-colors">
            {mutation.isPending ? 'Creating...' : 'Create Hackathon'}
          </button>
          <button onClick={() => navigate('/hackathons')}
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-6 py-2.5 rounded-lg font-medium transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
