import { useToast } from "../components/Toast";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { quests } from '../lib/api';

export function CreateQuestPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({
    name: '',
    description: '',
    questType: 0,
    paymentToken: '0x0000000000000000000000000000000000000001',
    rewardPerCompletion: '',
    maxCompletions: 50,
    deadlineBlock: 200000,
  });

  const mutation = useMutation({
    mutationFn: () => quests.create(form),
    onSuccess: () => { toast.success('Quest created'); navigate('/quests'); },
  });

  const update = (field: string, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Create a Quest</h1>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Quest Name</label>
          <input type="text" value={form.name} onChange={(e) => update('name', e.target.value)}
            className="w-full bg-gray-900 border border-[var(--line)] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[var(--accent-500)]"
            placeholder="e.g., Deploy your first Noir contract" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
          <textarea value={form.description} onChange={(e) => update('description', e.target.value)} rows={4}
            className="w-full bg-gray-900 border border-[var(--line)] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[var(--accent-500)]"
            placeholder="What should the contributor do?" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Quest Type</label>
            <select value={form.questType} onChange={(e) => update('questType', Number(e.target.value))}
              className="w-full bg-gray-900 border border-[var(--line)] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[var(--accent-500)]">
              <option value={0}>On-Chain</option>
              <option value={1}>Content</option>
              <option value={2}>Development</option>
              <option value={3}>Community</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Reward per Completion (USDC)</label>
            <input type="text" value={form.rewardPerCompletion} onChange={(e) => update('rewardPerCompletion', e.target.value)}
              className="w-full bg-gray-900 border border-[var(--line)] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[var(--accent-500)]"
              placeholder="100" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Max Completions (0 = unlimited)</label>
            <input type="number" value={form.maxCompletions} onChange={(e) => update('maxCompletions', Number(e.target.value))}
              className="w-full bg-gray-900 border border-[var(--line)] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[var(--accent-500)]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Deadline (block #)</label>
            <input type="number" value={form.deadlineBlock} onChange={(e) => update('deadlineBlock', Number(e.target.value))}
              className="w-full bg-gray-900 border border-[var(--line)] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[var(--accent-500)]" />
          </div>
        </div>
        <div className="flex gap-3 pt-4">
          <button onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !form.name || !form.description || !form.rewardPerCompletion}
            className="bg-[var(--accent-600)] hover:bg-[var(--accent-500)] disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-medium transition-colors">
            {mutation.isPending ? 'Creating...' : 'Create Quest'}
          </button>
          <button onClick={() => navigate('/quests')}
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-6 py-2.5 rounded-lg font-medium transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
