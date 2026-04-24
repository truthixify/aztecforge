import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { listings } from '../lib/api';
import { useToast } from '../components/Toast';

const SUBMISSION_FORMATS = [
  { id: 'github_repo', label: 'GitHub Repository', desc: 'Link to a public or private repo' },
  { id: 'deployed_url', label: 'Deployed URL', desc: 'Live app, site, or demo' },
  { id: 'figma_link', label: 'Figma / Design File', desc: 'Mockups, wireframes, prototypes' },
  { id: 'document', label: 'Document / Write-up', desc: 'Research, spec, or tutorial' },
  { id: 'video', label: 'Video / Demo', desc: 'Loom, YouTube, or recorded walkthrough' },
  { id: 'pull_request', label: 'Pull Request', desc: 'PR to an existing repo' },
  { id: 'npm_package', label: 'Published Package', desc: 'npm, crates.io, or similar' },
  { id: 'other', label: 'Other', desc: 'Any format not listed above' },
];

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
    acceptedFormats: ['github_repo', 'deployed_url'] as string[],
  });

  const mutation = useMutation({
    mutationFn: () =>
      listings.create({
        ...form,
        skills: form.skills ? form.skills.split(',').map((s) => s.trim()).filter(Boolean) : [],
        acceptedFormats: form.acceptedFormats,
      }),
    onSuccess: (data) => { toast.success('Bounty created', data.title); navigate(`/bounties/${data.id}`); },
  });

  const update = (field: string, value: string | number | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const toggleFormat = (id: string) => {
    setForm((prev) => ({
      ...prev,
      acceptedFormats: prev.acceptedFormats.includes(id)
        ? prev.acceptedFormats.filter((f) => f !== id)
        : [...prev.acceptedFormats, id],
    }));
  };

  const inputCls = "w-full bg-[var(--bg-0)]/60 border border-[var(--line)] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[var(--accent-500)]";

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Post a Bounty</h1>
      <p className="text-gray-400 mb-8">Describe the work, set the reward, and choose what submissions you'll accept.</p>

      <div className="space-y-6">
        <div>
          <label className="text-sm font-medium text-gray-300 mb-1.5 block">Title <span className="text-red-400">*</span></label>
          <input type="text" value={form.title} onChange={(e) => update('title', e.target.value)}
            className={inputCls} placeholder="e.g., Build a Noir Merkle proof library" />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-300 mb-1.5 block">Description <span className="text-red-400">*</span></label>
          <textarea value={form.description} onChange={(e) => update('description', e.target.value)}
            rows={6} className={`${inputCls} resize-none`}
            placeholder="What needs to be built? What are the requirements? How will submissions be evaluated?" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1.5 block">Reward (USDC) <span className="text-red-400">*</span></label>
            <input type="text" value={form.rewardAmount} onChange={(e) => update('rewardAmount', e.target.value)}
              className={inputCls} placeholder="5000" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1.5 block">Deadline (block #)</label>
            <input type="number" value={form.deadlineBlock} onChange={(e) => update('deadlineBlock', Number(e.target.value))}
              className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1.5 block">Skills (comma-separated)</label>
            <input type="text" value={form.skills} onChange={(e) => update('skills', e.target.value)}
              className={inputCls} placeholder="noir, typescript, react" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1.5 block">Difficulty</label>
            <select value={form.difficulty} onChange={(e) => update('difficulty', e.target.value)} className={inputCls}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        {/* Accepted submission formats */}
        <div>
          <label className="text-sm font-medium text-gray-300 mb-1.5 block">Accepted Submission Formats</label>
          <p className="text-xs text-gray-500 mb-3">Select what types of submissions you'll review. Contributors will see this before submitting.</p>
          <div className="grid grid-cols-2 gap-2">
            {SUBMISSION_FORMATS.map((fmt) => {
              const selected = form.acceptedFormats.includes(fmt.id);
              return (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => toggleFormat(fmt.id)}
                  className={`text-left p-3 rounded-lg border transition-colors cursor-pointer ${
                    selected
                      ? 'bg-[var(--accent-500)]/10 border-[var(--accent-500)]/30 text-white'
                      : 'bg-[var(--bg-0)]/40 border-[var(--line)] text-gray-400 hover:border-[var(--bg-3)]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                      selected ? 'border-[var(--accent-400)] bg-[var(--accent-500)]' : 'border-gray-600'
                    }`}>
                      {selected && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <span className="text-sm font-medium">{fmt.label}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1 ml-6">{fmt.desc}</p>
                </button>
              );
            })}
          </div>
          {form.acceptedFormats.length === 0 && (
            <p className="text-xs text-red-400 mt-2">Select at least one submission format</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => update('isAmountPublic', !form.isAmountPublic)}
            className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 cursor-pointer ${
              form.isAmountPublic ? 'border-[var(--accent-400)] bg-[var(--accent-500)]' : 'border-gray-600'
            }`}
          >
            {form.isAmountPublic && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
          </button>
          <label className="text-sm text-gray-400 cursor-pointer" onClick={() => update('isAmountPublic', !form.isAmountPublic)}>
            Show reward amount publicly (recommended so contributors know what they're working for)
          </label>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !form.title || !form.description || !form.rewardAmount || form.acceptedFormats.length === 0}
            className="px-6 py-2.5 rounded-lg font-medium bg-[var(--accent-600)] hover:bg-[var(--accent-500)] text-white transition-colors cursor-pointer disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed"
          >
            {mutation.isPending ? 'Creating...' : 'Post Bounty'}
          </button>
          <button
            onClick={() => navigate('/bounties')}
            className="px-6 py-2.5 rounded-lg font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
