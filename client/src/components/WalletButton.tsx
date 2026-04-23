import { useAztec } from '../contexts/AztecContext';
import { Loader2 } from 'lucide-react';

export function WalletButton() {
  const { isConnected, isConnecting, address, error, connect, disconnect } = useAztec();

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
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 bg-gray-800 px-3 py-2 rounded-lg">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-sm font-mono text-gray-300">{truncated}</span>
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
    <div>
      <button
        onClick={connect}
        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        Connect Wallet
      </button>
      {error && (
        <p className="text-xs text-red-400 mt-1 max-w-48 truncate" title={error}>
          {error}
        </p>
      )}
    </div>
  );
}
