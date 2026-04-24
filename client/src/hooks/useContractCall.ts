import { useState, useCallback } from 'react';
import { useAztec } from '../contexts/AztecContext';
import { useToast } from '../components/Toast';

/**
 * Hook for executing contract method calls with the simulate-then-send pattern.
 *
 * Usage:
 * ```tsx
 * const { execute, loading } = useContractCall();
 *
 * const handleCreate = async () => {
 *   const result = await execute(
 *     bountyContract.methods.create_bounty(token, amount, hash, deadline, true, nonce),
 *     'Bounty created'
 *   );
 * };
 * ```
 */
export function useContractCall() {
  const { address } = useAztec();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const execute = useCallback(
    async (
      method: { simulate: (opts?: any) => Promise<any>; send: (opts?: any) => Promise<any> },
      successMessage?: string,
      options?: { timeout?: number },
    ) => {
      if (!address) {
        toast.error('Connect your wallet first');
        return null;
      }

      setLoading(true);
      try {
        // Simulate first to catch revert reasons
        await method.simulate({ from: address });

        // Send the transaction
        const receipt = await method.send({
          from: address,
          wait: { timeout: options?.timeout ?? 60_000 },
        });

        if (successMessage) {
          toast.success(successMessage);
        }

        return receipt;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Transaction failed';
        toast.error(message);
        console.error('Contract call failed:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [address, toast],
  );

  /**
   * Call a view/read-only function on a contract.
   */
  const view = useCallback(
    async (
      method: { simulate: (opts?: any) => Promise<any> },
    ) => {
      if (!address) return null;

      try {
        const result = await method.simulate({ from: address });
        return result;
      } catch (err: unknown) {
        console.error('Contract view failed:', err);
        return null;
      }
    },
    [address],
  );

  return { execute, view, loading };
}
