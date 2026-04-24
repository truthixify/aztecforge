import { useToast } from "../components/Toast";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { circles } from '../lib/api';

export function CreateCirclePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    paymentToken: '0x0000000000000000000000000000000000000001',
    epochDurationBlocks: 14400,
    givePerMember: 100,
    rewardPoolPerEpoch: '',
  });

  const mutation = useMutation({
    mutationFn: () => circles.create(form),
    onSuccess: () => { useToast().success('Created'); navigate('/circles'),
  });

  const update = (field: string, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Create a Peer Reward Circle</h1>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Circle Name</label>
          <input type="text" value={form.name} onChange={(e) => update('name', e.target.value)}
            className="w-full bg-gray-900 border border-[var(--line)] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[var(--accent-500)]"
            placeholder="e.g., Core Contributors" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">GIVE per Member</label>
            <input type="number" value={form.givePerMember} onChange={(e) => update('givePerMember', Number(e.target.value))}
              className="w-full bg-gray-900 border border-[var(--line)] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[var(--accent-500)]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Reward Pool per Epoch (USDC)</label>
            <input type="text" value={form.rewardPoolPerEpoch} onChange={(e) => update('rewardPoolPerEpoch', e.target.value)}
              className="w-full bg-gray-900 border border-[var(--line)] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[var(--accent-500)]"
              placeholder="10000" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Epoch Duration (blocks)</label>
          <input type="number" value={form.epochDurationBlocks} onChange={(e) => update('epochDurationBlocks', Number(e.target.value))}
            className="w-full bg-gray-900 border border-[var(--line)] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[var(--accent-500)]" />
          <p className="text-xs text-gray-500 mt-1">14400 blocks is about 1 day at 6s/block</p>
        </div>
        <div className="flex gap-3 pt-4">
          <button onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !form.name || !form.rewardPoolPerEpoch}
            className="bg-[var(--accent-600)] hover:bg-[var(--accent-500)] disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-medium transition-colors">
            {mutation.isPending ? 'Creating...' : 'Create Circle'}
          </button>
          <button onClick={() => navigate('/circles')}
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-6 py-2.5 rounded-lg font-medium transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
