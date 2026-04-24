interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}

export function StatCard({ label, value, sub, accent }: StatCardProps) {
  return (
    <div className="bg-[var(--bg-1)]/60 border border-[var(--line)] rounded-lg px-4 py-3 hover:border-[var(--bg-3)] transition-colors min-w-0">
      <div className="text-gray-500 text-[10px] uppercase tracking-[0.08em] font-medium mb-2 whitespace-nowrap">
        {label}
      </div>
      <div className="flex items-baseline gap-1.5 min-w-0 whitespace-nowrap">
        <div className={`text-[22px] leading-none font-semibold tabular-nums tracking-tight ${accent || 'text-white'}`}>
          {value}
        </div>
        {sub && <div className="text-[11px] text-gray-500">{sub}</div>}
      </div>
    </div>
  );
}
