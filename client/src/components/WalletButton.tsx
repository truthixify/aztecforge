import { useState, useRef, useEffect } from 'react';
import { useAztec } from '../contexts/AztecContext';
import { useToast } from './Toast';
import { Wallet, ChevronDown, Check, LogOut, Shield, Code, Copy } from 'lucide-react';

export function WalletButton() {
  const { isConnected, isConnecting, address, connectionMode, error, connectAzguard, connectEmbedded, disconnect } = useAztec();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const prevError = useRef<string | null>(null);
  const wasConnected = useRef(false);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Show errors as toasts
  useEffect(() => {
    if (error && error !== prevError.current) {
      toast.error(error);
    }
    prevError.current = error;
  }, [error, toast]);

  // Toast on connect/disconnect
  useEffect(() => {
    if (isConnected && address && !wasConnected.current) {
      const t = `${address.toString().slice(0, 8)}\u2026${address.toString().slice(-4)}`;
      toast.success('Wallet connected', t);
    }
    wasConnected.current = isConnected;
  }, [isConnected, address, toast]);

  const truncate = (a: string, n = 5) => `${a.slice(0, 2 + n)}\u2026${a.slice(-n)}`;

  const copyAddr = () => {
    if (address) {
      navigator.clipboard?.writeText(address.toString());
      setCopied(true);
      toast.success('Address copied');
      setTimeout(() => setCopied(false), 1200);
    }
  };

  if (!isConnected || !address) {
    return (
      <div ref={ref} className="relative w-full">
        <button
          onClick={() => setOpen((x) => !x)}
          disabled={isConnecting}
          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-[var(--accent-600)] hover:bg-[var(--accent-500)] text-white transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isConnecting ? (
            <div className="w-3.5 h-3.5 border-2 border-current border-r-transparent rounded-full animate-spin" />
          ) : (
            <Wallet className="w-4 h-4" />
          )}
          {isConnecting ? 'Connecting\u2026' : 'Connect wallet'}
        </button>

        {open && !isConnecting && (
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-[var(--bg-1)] border border-[var(--line)] rounded-xl shadow-2xl overflow-hidden z-50" style={{ animation: 'slideDown 0.15s ease-out' }}>
            <div className="p-2">
              <button
                onClick={() => { setOpen(false); connectAzguard(); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--bg-2)] transition-colors text-left cursor-pointer"
              >
                <Shield className="w-4 h-4 text-[var(--accent-400)]" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white">Azguard Wallet</div>
                  <div className="text-[11px] text-gray-500">Browser extension or mobile</div>
                </div>
              </button>

              <button
                onClick={() => { setOpen(false); connectEmbedded(); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--bg-2)] transition-colors text-left cursor-pointer"
              >
                <Code className="w-4 h-4 text-blue-400" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white">Dev Wallet</div>
                  <div className="text-[11px] text-gray-500">Local sandbox only</div>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const addrStr = address.toString();
  const modeLabel = connectionMode === 'azguard' ? 'Azguard' : 'Sandbox';

  return (
    <div ref={ref} className="relative w-full">
      <button
        onClick={() => setOpen((x) => !x)}
        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-[var(--bg-1)] border border-[var(--line)] hover:border-[var(--bg-3)] transition-colors text-left cursor-pointer"
      >
        <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[var(--accent-500)] to-[var(--accent-700)] flex items-center justify-center shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-green-300" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-mono text-xs text-white truncate leading-tight">{truncate(addrStr, 5)}</div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider leading-tight">{modeLabel}</div>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-[var(--bg-1)] border border-[var(--line)] rounded-xl shadow-2xl overflow-hidden z-50" style={{ animation: 'slideDown 0.15s ease-out' }}>
          <div className="p-3 border-b border-[var(--line)]">
            <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Connected</div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-gray-200 truncate flex-1">{addrStr}</span>
              <button onClick={copyAddr} className="text-gray-500 hover:text-gray-200 transition-colors p-1 rounded hover:bg-[var(--bg-2)] cursor-pointer">
                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          <div className="p-2">
            <button
              onClick={() => { disconnect(); setOpen(false); toast.info('Wallet disconnected'); }}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-red-400 hover:bg-red-500/5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
