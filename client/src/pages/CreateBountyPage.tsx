import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { bounties } from '../lib/api';
import { useToast } from '../components/Toast';

export function CreateBountyPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({
    title: '',
    description: '',
    paymentToken: '0x0000000000000000000000000000000000000001',
    rewardAmount: '',
    deadlineBlock: 100000,
    isAmountPublic: true,
    skills: '',
    difficulty: 'medium',
  });

  const mutation = useMutation({
    mutationFn: () =>
      bounties.create({
        ...form,
        skills: form.skills ? form.skills.split(',').map((s) => s.trim()) : [],
      }),
    onSuccess: (data) => { toast.success('Bounty created', data.title); navigate(`/bounties/${data.id}`); },
  });

  const update = (field: string, value: string | number | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Post a Bounty</h1>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            className="w-full bg-gray-900 border border-[var(--line)] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[var(--accent-500)]"
            placeholder="e.g., Build a Noir Merkle proof library"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            rows={5}
            className="w-full bg-gray-900 border border-[var(--line)] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[var(--accent-500)]"
            placeholder="Detailed requirements for the bounty..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Reward Amount (USDC)</label>
            <input
              type="text"
              value={form.rewardAmount}
              onChange={(e) => update('rewardAmount', e.target.value)}
              className="w-full bg-gray-900 border border-[var(--line)] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[var(--accent-500)]"
              placeholder="5000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Deadline (block #)</label>
            <input
              type="number"
              value={form.deadlineBlock}
              onChange={(e) => update('deadlineBlock', Number(e.target.value))}
              className="w-full bg-gray-900 border border-[var(--line)] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[var(--accent-500)]"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Skills (comma-separated)</label>
            <input
              type="text"
              value={form.skills}
              onChange={(e) => update('skills', e.target.value)}
              className="w-full bg-gray-900 border border-[var(--line)] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[var(--accent-500)]"
              placeholder="noir, typescript, react"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Difficulty</label>
            <select
              value={form.difficulty}
              onChange={(e) => update('difficulty', e.target.value)}
              className="w-full bg-gray-900 border border-[var(--line)] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[var(--accent-500)]"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isAmountPublic"
            checked={form.isAmountPublic}
            onChange={(e) => update('isAmountPublic', e.target.checked)}
            className="rounded border-gray-700 bg-gray-900"
          />
          <label htmlFor="isAmountPublic" className="text-sm text-gray-400">
            Show reward amount publicly (recommended so contributors know what they are working for)
          </label>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !form.title || !form.description || !form.rewardAmount}
            className="bg-[var(--accent-600)] hover:bg-[var(--accent-500)] disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
          >
            {mutation.isPending ? 'Creating...' : 'Post Bounty'}
          </button>
          <button
            onClick={() => navigate('/')}
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-6 py-2.5 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}
