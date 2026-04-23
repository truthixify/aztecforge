import { useState, useEffect } from 'react';
import { useAztec } from '../contexts/AztecContext';
import type { Contract } from '@aztec/aztec.js/contracts';
import { AztecAddress } from '@aztec/aztec.js/addresses';

// Contract addresses — set these after deployment
const CONTRACT_ADDRESSES = {
  bountyBoard: import.meta.env.VITE_BOUNTY_CONTRACT ?? '',
  reputation: import.meta.env.VITE_REPUTATION_CONTRACT ?? '',
  fundingPool: import.meta.env.VITE_FUNDING_POOL_CONTRACT ?? '',
  peerAllocation: import.meta.env.VITE_PEER_ALLOCATION_CONTRACT ?? '',
  hackathon: import.meta.env.VITE_HACKATHON_CONTRACT ?? '',
  quest: import.meta.env.VITE_QUEST_CONTRACT ?? '',
  token: import.meta.env.VITE_TOKEN_CONTRACT ?? '',
};

export function useContractAddresses() {
  return CONTRACT_ADDRESSES;
}

/**
 * Hook to get a contract instance connected to the user's wallet.
 * Pass the compiled contract artifact and deployed address.
 *
 * Usage:
 * ```
 * const { contract, loading } = useContract(BountyBoardArtifact, CONTRACT_ADDRESSES.bountyBoard);
 * if (contract) {
 *   await contract.methods.create_bounty(...).send();
 * }
 * ```
 */
export function useContract(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ContractClass: any,
  addressStr: string,
) {
  const { wallet } = useAztec();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!wallet || !addressStr) {
      setContract(null);
      return;
    }

    setLoading(true);
    const address = AztecAddress.fromString(addressStr);

    ContractClass.at(address, wallet)
      .then((c: Contract) => setContract(c))
      .catch((err: Error) => {
        console.error('Failed to connect to contract:', err);
        setContract(null);
      })
      .finally(() => setLoading(false));
  }, [wallet, addressStr, ContractClass]);

  return { contract, loading };
}
