import { useState, useEffect, useMemo } from 'react';
import { useAztec } from '../contexts/AztecContext';
import type { Contract } from '@aztec/aztec.js/contracts';
import { AztecAddress } from '@aztec/aztec.js/addresses';
import { Fr } from '@aztec/aztec.js/fields';
import { BountyBoardContract } from '../artifacts/BountyBoard';
import { ReputationRegistryContract } from '../artifacts/ReputationRegistry';
import { FundingPoolContract } from '../artifacts/FundingPool';
import { PeerAllocationContract } from '../artifacts/PeerAllocation';
import { HackathonEngineContract } from '../artifacts/HackathonEngine';
import { QuestTrackerContract } from '../artifacts/QuestTracker';
import { TokenContract } from '../artifacts/Token';

const ADDRESSES = {
  bountyBoard: import.meta.env.VITE_BOUNTY_CONTRACT ?? '',
  reputation: import.meta.env.VITE_REPUTATION_CONTRACT ?? '',
  fundingPool: import.meta.env.VITE_FUNDING_POOL_CONTRACT ?? '',
  peerAllocation: import.meta.env.VITE_PEER_ALLOCATION_CONTRACT ?? '',
  hackathon: import.meta.env.VITE_HACKATHON_CONTRACT ?? '',
  quest: import.meta.env.VITE_QUEST_CONTRACT ?? '',
  token: import.meta.env.VITE_TOKEN_CONTRACT ?? '',
};

export function useContractAddresses() {
  return ADDRESSES;
}

export function hasContracts(): boolean {
  return Object.values(ADDRESSES).some((a) => a.length > 0);
}

function useContractInstance<T extends Contract>(
  ContractClass: { at: (address: AztecAddress, wallet: any) => Promise<T> },
  addressStr: string,
) {
  const { wallet } = useAztec();
  const [contract, setContract] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!wallet || !addressStr) {
      setContract(null);
      return;
    }

    setLoading(true);
    setError(null);

    const address = AztecAddress.fromString(addressStr);
    ContractClass.at(address, wallet)
      .then((c) => setContract(c))
      .catch((err: Error) => {
        console.error('Failed to connect to contract:', err);
        setError(err.message);
        setContract(null);
      })
      .finally(() => setLoading(false));
  }, [wallet, addressStr, ContractClass]);

  return { contract, loading, error };
}

// Individual contract hooks
export function useBountyBoard() {
  return useContractInstance(BountyBoardContract, ADDRESSES.bountyBoard);
}

export function useReputationRegistry() {
  return useContractInstance(ReputationRegistryContract, ADDRESSES.reputation);
}

export function useFundingPool() {
  return useContractInstance(FundingPoolContract, ADDRESSES.fundingPool);
}

export function usePeerAllocation() {
  return useContractInstance(PeerAllocationContract, ADDRESSES.peerAllocation);
}

export function useHackathonEngine() {
  return useContractInstance(HackathonEngineContract, ADDRESSES.hackathon);
}

export function useQuestTracker() {
  return useContractInstance(QuestTrackerContract, ADDRESSES.quest);
}

export function useToken() {
  return useContractInstance(TokenContract, ADDRESSES.token);
}

// All contracts at once
export function useAllContracts() {
  const bountyBoard = useBountyBoard();
  const reputation = useReputationRegistry();
  const fundingPool = useFundingPool();
  const peerAllocation = usePeerAllocation();
  const hackathon = useHackathonEngine();
  const quest = useQuestTracker();
  const token = useToken();

  const loading = bountyBoard.loading || reputation.loading || fundingPool.loading ||
    peerAllocation.loading || hackathon.loading || quest.loading || token.loading;

  return { bountyBoard, reputation, fundingPool, peerAllocation, hackathon, quest, token, loading };
}
