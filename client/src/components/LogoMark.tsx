interface LogoMarkProps {
  size?: number;
}

export function LogoMark({ size = 28 }: LogoMarkProps) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 40 40" className="w-full h-full" aria-hidden="true">
        <defs>
          <linearGradient id="af-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--accent-300)" />
            <stop offset="100%" stopColor="var(--accent-600)" />
          </linearGradient>
          <linearGradient id="af-grad-dim" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--accent-500)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--accent-400)" stopOpacity="0.55" />
          </linearGradient>
        </defs>
        <path
          d="M20 2 L28 10 L28 18 L38 20 L28 22 L28 30 L20 38 L12 30 L12 22 L2 20 L12 18 L12 10 Z"
          fill="url(#af-grad-dim)"
        />
        <path
          d="M20 8 L25 13 L25 18 L30 20 L25 22 L25 27 L20 32 L15 27 L15 22 L10 20 L15 18 L15 13 Z"
          fill="url(#af-grad)"
        />
        <rect x="18.5" y="14" width="3" height="12" rx="0.5" fill="var(--bg-0)" />
      </svg>
    </div>
  );
}
