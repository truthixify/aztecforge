import { LogoMark } from './LogoMark';

interface LoadingProps {
  title?: string;
  message?: string;
  fullscreen?: boolean;
}

/**
 * Beautiful loading component with animated logo.
 * Use fullscreen=true for page-level loading, false for inline/card loading.
 */
export function Loading({ title, message, fullscreen = false }: LoadingProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4 py-8">
      {/* Pulsing logo */}
      <div className="relative">
        <div
          className="absolute inset-0 rounded-full blur-xl opacity-40"
          style={{
            background: 'radial-gradient(circle, var(--accent-500), transparent 70%)',
            animation: 'pulseGlow 2s ease-in-out infinite',
          }}
        />
        <div style={{ animation: 'pulseGlow 2s ease-in-out infinite' }}>
          <LogoMark size={48} />
        </div>
      </div>

      {/* Spinner ring */}
      <div className="w-6 h-6 border-2 border-[var(--accent-500)]/30 border-t-[var(--accent-400)] rounded-full animate-spin" />

      {/* Text */}
      {title && <div className="text-sm font-medium text-white">{title}</div>}
      {message && <div className="text-xs text-gray-500 max-w-xs text-center">{message}</div>}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        {content}
      </div>
    );
  }

  return content;
}

/**
 * Loading overlay shown as a modal backdrop.
 * Used for contract transactions or long operations.
 */
export function LoadingOverlay({ title, message }: { title: string; message?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" style={{ animation: 'fadeIn 0.15s ease-out' }} />
      <div
        className="relative bg-[var(--bg-1)] border border-[var(--line)] rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4"
        style={{ animation: 'fadeUp 0.2s ease-out' }}
      >
        <Loading title={title} message={message} />
      </div>
    </div>
  );
}
