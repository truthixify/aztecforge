import { useState, useRef, useEffect } from 'react';
import { useAztec } from '../contexts/AztecContext';
import { Loader2, ChevronDown, Shield, Code } from 'lucide-react';

export function WalletButton() {
  const { isConnected, isConnecting, address, connectionMode, error, connectAzguard, connectEmbedded, disconnect } = useAztec();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (isConnecting) {
    return (
      <button
        disabled
        className="flex items-center gap-2 bg-gray-800 text-gray-400 px-4 py-2 rounded-lg text-sm font-medium"
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        Connecting...
      </button>
    );
  }

  if (isConnected && address) {
    const truncated = `${address.toString().slice(0, 6)}...${address.toString().slice(-4)}`;
    const modeLabel = connectionMode === 'azguard' ? 'Azguard' : 'Dev';

    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 bg-gray-800 px-3 py-2 rounded-lg">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-sm font-mono text-gray-300">{truncated}</span>
          <span className="text-xs text-gray-500">({modeLabel})</span>
        </div>
        <button
          onClick={disconnect}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        Connect Wallet
        <ChevronDown className="w-3.5 h-3.5" />
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-64 bg-gray-900 border border-gray-800 rounded-xl shadow-xl z-50 overflow-hidden">
          <button
            onClick={() => { connectAzguard(); setShowDropdown(false); }}
            className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-800 transition-colors text-left"
          >
            <Shield className="w-5 h-5 text-purple-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-white">Azguard Wallet</p>
              <p className="text-xs text-gray-500">Connect your Aztec wallet</p>
            </div>
          </button>

          <div className="border-t border-gray-800" />

          <button
            onClick={() => { connectEmbedded(); setShowDropdown(false); }}
            className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-800 transition-colors text-left"
          >
            <Code className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-white">Dev Wallet</p>
              <p className="text-xs text-gray-500">Embedded wallet for local sandbox</p>
            </div>
          </button>
        </div>
      )}

      {error && (
        <p className="absolute right-0 mt-1 text-xs text-red-400 max-w-64 truncate" title={error}>
          {error}
        </p>
      )}
    </div>
  );
}
