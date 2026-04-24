import { useQuery } from '@tanstack/react-query';
import { useBountyBoard, hasContracts } from './useContracts';
import { useContractCall } from './useContractCall';
import { useAztec } from '../contexts/AztecContext';
import { listings as listingsApi } from '../lib/api';

/**
 * Hook to read bounty data. Uses on-chain contract calls when contracts
 * are deployed and wallet is connected. Falls back to the REST API otherwise.
 */
export function useBountyStats() {
  const { contract } = useBountyBoard();
  const { address } = useAztec();
  const onChain = !!contract && !!address;

  return useQuery({
    queryKey: ['bounties', 'stats', onChain ? 'chain' : 'api'],
    queryFn: async () => {
      if (onChain && contract) {
        const [posted, completed, escrowed, paid] = await Promise.all([
          contract.methods.get_total_bounties_posted().simulate({ from: address }),
          contract.methods.get_total_bounties_completed().simulate({ from: address }),
          contract.methods.get_total_value_escrowed().simulate({ from: address }),
          contract.methods.get_total_value_paid().simulate({ from: address }),
        ]);
        return {
          totalBountiesPosted: Number(posted),
          totalBountiesCompleted: Number(completed),
          totalValueEscrowed: String(escrowed),
          totalValuePaid: String(paid),
        };
      }
      return listingsApi.stats();
    },
  });
}

export function useBountyCount() {
  const { contract } = useBountyBoard();
  const { address } = useAztec();
  const onChain = !!contract && !!address;

  return useQuery({
    queryKey: ['bounties', 'count', onChain ? 'chain' : 'api'],
    queryFn: async () => {
      if (onChain && contract) {
        const count = await contract.methods.get_bounty_count().simulate({ from: address });
        return Number(count);
      }
      const list = await listingsApi.list();
      return list.length;
    },
  });
}

export function useBountyDetail(bountyId: number) {
  const { contract } = useBountyBoard();
  const { address } = useAztec();
  const onChain = !!contract && !!address;

  return useQuery({
    queryKey: ['bounties', bountyId, onChain ? 'chain' : 'api'],
    queryFn: async () => {
      if (onChain && contract) {
        const [status, creator, amount, token, claimer, deadline, description, submission, isPublic, escrow] =
          await Promise.all([
            contract.methods.get_bounty_status(BigInt(bountyId)).simulate({ from: address }),
            contract.methods.get_bounty_creator(BigInt(bountyId)).simulate({ from: address }),
            contract.methods.get_bounty_amount(BigInt(bountyId)).simulate({ from: address }),
            contract.methods.get_bounty_token(BigInt(bountyId)).simulate({ from: address }),
            contract.methods.get_bounty_claimer(BigInt(bountyId)).simulate({ from: address }),
            contract.methods.get_bounty_deadline(BigInt(bountyId)).simulate({ from: address }),
            contract.methods.get_bounty_description(BigInt(bountyId)).simulate({ from: address }),
            contract.methods.get_bounty_submission(BigInt(bountyId)).simulate({ from: address }),
            contract.methods.is_amount_public(BigInt(bountyId)).simulate({ from: address }),
            contract.methods.get_escrow_balance(BigInt(bountyId)).simulate({ from: address }),
          ]);

        return {
          id: bountyId,
          status: Number(status),
          creator: creator.toString(),
          rewardAmount: String(amount),
          paymentToken: token.toString(),
          claimer: claimer.toString(),
          deadline: Number(deadline),
          descriptionHash: description.toString(),
          submissionHash: submission.toString(),
          isAmountPublic: Boolean(isPublic),
          escrowBalance: String(escrow),
          // These fields come from the server/off-chain storage
          title: `Bounty #${bountyId}`,
          description: '',
          skills: [],
          difficulty: 'medium',
        };
      }
      return listingsApi.get(bountyId);
    },
  });
}
