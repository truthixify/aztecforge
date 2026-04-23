import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { AztecWallet } from '@azguardwallet/aztec-wallet';
import type { Wallet } from '@aztec/aztec.js/wallet';
import type { AztecAddress } from '@aztec/aztec.js/addresses';
import { setSender } from '../lib/api';

type ConnectionMode = 'azguard' | 'embedded' | null;

interface AztecContextType {
  wallet: Wallet | null;
  address: AztecAddress | null;
  isConnecting: boolean;
  isConnected: boolean;
  connectionMode: ConnectionMode;
  error: string | null;
  connectAzguard: () => Promise<void>;
  connectEmbedded: () => Promise<void>;
  disconnect: () => void;
}

const AztecContext = createContext<AztecContextType>({
  wallet: null,
  address: null,
  isConnecting: false,
  isConnected: false,
  connectionMode: null,
  error: null,
  connectAzguard: async () => {},
  connectEmbedded: async () => {},
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
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>(null);
  const [error, setError] = useState<string | null>(null);
  const [azguardWallet, setAzguardWallet] = useState<AztecWallet | null>(null);

  // Track Azguard disconnection events
  useEffect(() => {
    if (!azguardWallet) return;

    const handleDisconnected = () => {
      setWallet(null);
      setAddress(null);
      setConnectionMode(null);
      setSender('');
    };

    azguardWallet.onDisconnected.addHandler(handleDisconnected);
    return () => {
      azguardWallet.onDisconnected.removeHandler(handleDisconnected);
    };
  }, [azguardWallet]);

  // Connect via Azguard Wallet (real wallet - browser extension / mobile)
  const connectAzguard = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const aztecWallet = await AztecWallet.connect(
        {
          name: 'AztecForge',
          description: 'Private community incentive platform on Aztec Network',
          url: window.location.origin,
        },
        import.meta.env.VITE_AZTEC_CHAIN ?? 'sandbox',
      );

      const accounts = await aztecWallet.getAccounts();
      const addr = accounts[0].item;

      setAzguardWallet(aztecWallet);
      setWallet(aztecWallet as unknown as Wallet);
      setAddress(addr);
      setConnectionMode('azguard');
      setSender(addr.toString());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect Azguard wallet';
      setError(message);
      console.error('Azguard connection failed:', err);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Connect via embedded wallet (development / local sandbox only)
  const connectEmbedded = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const { EmbeddedWallet } = await import('@aztec/wallets/embedded');
      const nodeUrl = import.meta.env.VITE_AZTEC_NODE_URL ?? 'http://localhost:8080';

      const embeddedWallet = await EmbeddedWallet.create(nodeUrl);

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
        const account = await embeddedWallet.createSchnorrAccount();
        setAddress(account.address);
        setSender(account.address.toString());
      }

      setWallet(embeddedWallet);
      setConnectionMode('embedded');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect embedded wallet';
      setError(message);
      console.error('Embedded wallet connection failed:', err);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    if (azguardWallet) {
      try {
        await azguardWallet.disconnect();
      } catch {
        // Ignore disconnect errors
      }
    }
    setWallet(null);
    setAddress(null);
    setAzguardWallet(null);
    setConnectionMode(null);
    setError(null);
    setSender('');
  }, [azguardWallet]);

  return (
    <AztecContext.Provider
      value={{
        wallet,
        address,
        isConnecting,
        isConnected: wallet !== null,
        connectionMode,
        error,
        connectAzguard,
        connectEmbedded,
        disconnect,
      }}
    >
      {children}
    </AztecContext.Provider>
  );
}
