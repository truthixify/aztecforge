import { useToast } from "../components/Toast";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { pools } from '../lib/api';

export function CreatePoolPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({
    purpose: '',
    paymentToken: '0x0000000000000000000000000000000000000001',
    poolType: 0,
  });

  const mutation = useMutation({
    mutationFn: () => pools.create(form),
    onSuccess: () => { toast.success('Pool created'); navigate('/pools'); },
  });

  const update = (field: string, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Create a Funding Pool</h1>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Purpose</label>
          <input type="text" value={form.purpose} onChange={(e) => update('purpose', e.target.value)}
            className="w-full bg-gray-900 border border-[var(--line)] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[var(--accent-500)]"
            placeholder="e.g., Fund Aztec developer education" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Pool Type</label>
          <select value={form.poolType} onChange={(e) => update('poolType', Number(e.target.value))}
            className="w-full bg-gray-900 border border-[var(--line)] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[var(--accent-500)]">
            <option value={0}>Open (curator allocates freely)</option>
            <option value={1}>Quadratic (donation-weighted matching)</option>
            <option value={2}>Retroactive (reward past contributions)</option>
            <option value={3}>Streaming (continuous distribution)</option>
          </select>
        </div>
        <div className="flex gap-3 pt-4">
          <button onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !form.purpose}
            className="bg-[var(--accent-600)] hover:bg-[var(--accent-500)] disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-medium transition-colors">
            {mutation.isPending ? 'Creating...' : 'Create Pool'}
          </button>
          <button onClick={() => navigate('/pools')}
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-6 py-2.5 rounded-lg font-medium transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
