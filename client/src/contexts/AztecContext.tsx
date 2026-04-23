import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { EmbeddedWallet } from '@aztec/wallets/embedded';
import type { Wallet } from '@aztec/aztec.js/wallet';
import type { AztecAddress } from '@aztec/aztec.js/addresses';
import { setSender } from '../lib/api';

interface AztecContextType {
  wallet: Wallet | null;
  address: AztecAddress | null;
  isConnecting: boolean;
  isConnected: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const AztecContext = createContext<AztecContextType>({
  wallet: null,
  address: null,
  isConnecting: false,
  isConnected: false,
  error: null,
  connect: async () => {},
  disconnect: () => {},
});

export function useAztec() {
  return useContext(AztecContext);
}

interface AztecProviderProps {
  children: ReactNode;
}

export function AztecProvider({ children }: AztecProviderProps) {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [address, setAddress] = useState<AztecAddress | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const nodeUrl = process.env.AZTEC_NODE_URL ?? 'http://localhost:8080';

      const embeddedWallet = await EmbeddedWallet.create(nodeUrl);

      // For development: use test accounts if available
      try {
        const { getInitialTestAccountsData } = await import('@aztec/accounts/testing');
        const [accountData] = await getInitialTestAccountsData();
        if (accountData) {
          await embeddedWallet.createSchnorrAccount(
            accountData.secret,
            accountData.salt,
            accountData.signingKey,
          );
          setAddress(accountData.address);
          setSender(accountData.address.toString());
        }
      } catch {
        // No test accounts available — create a fresh ephemeral account
        const account = await embeddedWallet.createSchnorrAccount();
        const addr = account.address;
        setAddress(addr);
        setSender(addr.toString());
      }

      setWallet(embeddedWallet);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(message);
      console.error('Aztec wallet connection failed:', err);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setWallet(null);
    setAddress(null);
    setSender('');
  }, []);

  return (
    <AztecContext.Provider
      value={{
        wallet,
        address,
        isConnecting,
        isConnected: wallet !== null,
        error,
        connect,
        disconnect,
      }}
    >
      {children}
    </AztecContext.Provider>
  );
}
