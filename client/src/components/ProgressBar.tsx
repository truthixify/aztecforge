interface ProgressBarProps {
  value: number;
  max: number;
  className?: string;
  accent?: 'accent' | 'green' | 'blue';
}

export function ProgressBar({ value, max, className = '', accent = 'accent' }: ProgressBarProps) {
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0);
  const fills = {
    accent: 'bg-[var(--accent-500)]',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
  };

  return (
    <div className={`w-full h-1.5 bg-gray-800 rounded-full overflow-hidden ${className}`}>
      <div
        className={`h-full ${fills[accent]} transition-all duration-500`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
