/**
 * Deploy all AztecForge contracts to a local Aztec network.
 *
 * Prerequisites:
 *   1. Run `aztec start --local-network` in another terminal
 *   2. Run `cd contracts && ./build.sh` to compile contracts
 *   3. Run `cd contracts && aztec codegen target --outdir ../client/src/artifacts`
 *
 * Usage:
 *   npx tsx scripts/deploy.ts
 *
 * Outputs deployed contract addresses to scripts/deployed.json and client/.env.local
 */

import { createAztecNodeClient } from '@aztec/aztec.js/node';
import { EmbeddedWallet } from '@aztec/wallets/embedded';
import { SponsoredFeePaymentMethod } from '@aztec/aztec.js/fee';
import { Fr } from '@aztec/aztec.js/fields';
import { getInitialTestAccountsData } from '@aztec/accounts/testing';
import { BountyBoardContract } from '../client/src/artifacts/BountyBoard.js';
import { ReputationRegistryContract } from '../client/src/artifacts/ReputationRegistry.js';
import { FundingPoolContract } from '../client/src/artifacts/FundingPool.js';
import { PeerAllocationContract } from '../client/src/artifacts/PeerAllocation.js';
import { HackathonEngineContract } from '../client/src/artifacts/HackathonEngine.js';
import { QuestTrackerContract } from '../client/src/artifacts/QuestTracker.js';
import { TokenContract } from '../client/src/artifacts/Token.js';
import fs from 'fs';
import path from 'path';

const NODE_URL = process.env.AZTEC_NODE_URL ?? 'http://localhost:8080';
const DEPLOY_TIMEOUT = 120_000;

async function main() {
  console.log('🔗 Connecting to Aztec node at', NODE_URL);
  const node = createAztecNodeClient(NODE_URL);

  console.log('👛 Setting up wallet...');
  const wallet = await EmbeddedWallet.create(node, {
    ephemeral: true,
    pxeConfig: { proverEnabled: false },
  });

  const [accountData] = await getInitialTestAccountsData();
  if (!accountData) {
    throw new Error('No test accounts available. Make sure the local network is running.');
  }

  await wallet.createSchnorrAccount(
    accountData.secret,
    accountData.salt,
    accountData.signingKey,
  );

  const admin = accountData.address;
  console.log('👤 Admin address:', admin.toString());

  // Try to get sponsored FPC for fee payment
  let feeOptions: { paymentMethod?: SponsoredFeePaymentMethod } = {};
  try {
    const { SponsoredFPCContractArtifact } = await import('@aztec/noir-contracts.js/SponsoredFPC');
    const sponsoredFPCAddress = (await node.getNodeInfo()).protocolContractAddresses.sponsoredFPC;
    if (sponsoredFPCAddress) {
      const sponsoredFPCInstance = await node.getContract(sponsoredFPCAddress);
      if (sponsoredFPCInstance) {
        await wallet.registerContract(sponsoredFPCInstance, SponsoredFPCContractArtifact);
        feeOptions = { paymentMethod: new SponsoredFeePaymentMethod(sponsoredFPCAddress) };
        console.log('💰 Sponsored FPC configured at', sponsoredFPCAddress.toString());
      }
    }
  } catch (e) {
    console.log('⚠️  Sponsored FPC not available, using default fees');
  }

  const deployContract = async (name: string, ContractClass: any, ...constructorArgs: any[]) => {
    console.log(`\n📝 Deploying ${name}...`);

    const deployRequest = ContractClass.deploy(wallet, ...constructorArgs);
    await deployRequest.simulate({ from: admin });

    const { contract, receipt } = await deployRequest.send({
      from: admin,
      fee: feeOptions,
      wait: { timeout: DEPLOY_TIMEOUT },
    });

    console.log(`✅ ${name} deployed at: ${contract.address}`);
    return contract.address.toString();
  };

  // Deploy all contracts
  const addresses: Record<string, string> = {};

  // Token first (other contracts need it)
  addresses.token = await deployContract(
    'Token',
    TokenContract,
    admin,
    Fr.fromString('0x' + Buffer.from('AztecForge Token').toString('hex').padEnd(62, '0')),
    Fr.fromString('0x' + Buffer.from('AFT').toString('hex').padEnd(62, '0')),
    18,
  );

  addresses.bountyBoard = await deployContract('BountyBoard', BountyBoardContract, admin);
  addresses.reputation = await deployContract('ReputationRegistry', ReputationRegistryContract, admin);
  addresses.fundingPool = await deployContract('FundingPool', FundingPoolContract, admin);
  addresses.peerAllocation = await deployContract('PeerAllocation', PeerAllocationContract, admin);
  addresses.hackathon = await deployContract('HackathonEngine', HackathonEngineContract, admin);
  addresses.quest = await deployContract('QuestTracker', QuestTrackerContract, admin);

  // Authorize BountyBoard, HackathonEngine, QuestTracker as reputation updaters
  console.log('\n🔐 Authorizing reputation updaters...');
  const repContract = await ReputationRegistryContract.at(
    (await import('@aztec/aztec.js/addresses')).AztecAddress.fromString(addresses.reputation),
    wallet,
  );

  for (const [name, addr] of [
    ['BountyBoard', addresses.bountyBoard],
    ['HackathonEngine', addresses.hackathon],
    ['QuestTracker', addresses.quest],
    ['PeerAllocation', addresses.peerAllocation],
  ]) {
    const aztecAddr = (await import('@aztec/aztec.js/addresses')).AztecAddress.fromString(addr);
    await repContract.methods.authorize_updater(aztecAddr).simulate({ from: admin });
    await repContract.methods.authorize_updater(aztecAddr).send({
      from: admin,
      fee: feeOptions,
      wait: { timeout: DEPLOY_TIMEOUT },
    });
    console.log(`  ✅ ${name} authorized as reputation updater`);
  }

  // Save addresses
  const deployedPath = path.resolve(__dirname, 'deployed.json');
  fs.writeFileSync(deployedPath, JSON.stringify(addresses, null, 2));
  console.log(`\n📄 Addresses saved to ${deployedPath}`);

  // Write client .env.local
  const envContent = [
    `VITE_AZTEC_NODE_URL=${NODE_URL}`,
    `VITE_AZTEC_CHAIN=sandbox`,
    `VITE_TOKEN_CONTRACT=${addresses.token}`,
    `VITE_BOUNTY_CONTRACT=${addresses.bountyBoard}`,
    `VITE_REPUTATION_CONTRACT=${addresses.reputation}`,
    `VITE_FUNDING_POOL_CONTRACT=${addresses.fundingPool}`,
    `VITE_PEER_ALLOCATION_CONTRACT=${addresses.peerAllocation}`,
    `VITE_HACKATHON_CONTRACT=${addresses.hackathon}`,
    `VITE_QUEST_CONTRACT=${addresses.quest}`,
    `VITE_ADMIN_ADDRESS=${admin.toString()}`,
  ].join('\n');

  const envPath = path.resolve(__dirname, '..', 'client', '.env.local');
  fs.writeFileSync(envPath, envContent);
  console.log(`📄 Client env saved to ${envPath}`);

  console.log('\n🎉 All contracts deployed!\n');
  console.log('Addresses:');
  for (const [name, addr] of Object.entries(addresses)) {
    console.log(`  ${name}: ${addr}`);
  }
  console.log(`\nAdmin: ${admin.toString()}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Deployment failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  });
