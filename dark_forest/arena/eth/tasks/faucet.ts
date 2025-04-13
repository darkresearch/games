import { BigNumber, utils } from 'ethers';
import { formatEther, parseEther } from 'ethers/lib/utils';
import { subtask, task, types } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { writeToContractsPackage } from '../utils/deploy';

function weiToEth(wei: BigNumber): number {
  return parseFloat(utils.formatEther(wei));
}

task('faucet:deploy', 'change the faucet amount players')
  .addPositionalParam('value', 'amount to fund faucet with', undefined, types.float)
  .setAction(deployFaucet);

async function deployFaucet(args: { value: number }, hre: HardhatRuntimeEnvironment) {
  const [deployer] = await hre.ethers.getSigners();

  const factory = await hre.ethers.getContractFactory('DFArenaFaucet');
  const faucet = await factory.deploy();
  await faucet.deployTransaction.wait();

  console.log(`Faucet deployed to: ${faucet.address}`);

  if (args.value > 0) {
    const deployerBalance = weiToEth(await deployer.getBalance());
    console.log(`deployer balance ${deployerBalance}`);
    if (deployerBalance < args.value) throw new Error('Not enough funds');

    console.log(`funding faucet with ${args.value}`);

    const tx = await deployer.sendTransaction({
      to: faucet.address,
      value: hre.ethers.utils.parseEther(args.value.toString()),
    });
    await tx.wait();

    console.log(
      `Sent ${args.value} to faucet contract (${faucet.address}) to fund drips in faucet`
    );

    const whitelistBalance = await hre.ethers.provider.getBalance(faucet.address);
    console.log(`Faucet balance ${weiToEth(whitelistBalance)}`);
  }

  const tsContents = `
    /**
     * The address for the Faucet contract. Useful for lobbies.
     */
    export const FAUCET_ADDRESS = '${faucet.address}';
  `;
  const append = true;
  writeToContractsPackage(hre, tsContents, append);
  console.log('appended Faucet address to contracts');

  const faucetContract = await hre.ethers.getContractAt('DFArenaFaucet', faucet.address);
  console.log('owner', await faucetContract.getOwner());
}

task('faucet:changeDrip', 'change the faucet amount players')
  .addPositionalParam('value', 'drip value (in ether or xDAI)', undefined, types.float)
  .setAction(changeDrip);

async function changeDrip(args: { value: number }, hre: HardhatRuntimeEnvironment) {
  try {
    await hre.run('utils:assertChainId');

    if (!hre.contracts.FAUCET_ADDRESS) throw new Error('Faucet address not found');

    const contract = await hre.ethers.getContractAt('DFArenaFaucet', hre.contracts.FAUCET_ADDRESS);

    const txReceipt = await contract.changeDrip(hre.ethers.utils.parseEther(args.value.toString()));
    await txReceipt.wait();

    console.log(`changed drip to ${formatEther(await contract.getDripAmount())}`);
  } catch (error) {
    console.log('change drip failed', error);
  }
}

task('faucet:changeWaitTime', 'change the cooldown between drips')
  .addPositionalParam('seconds', 'seconds to', undefined, types.float)
  .setAction(changeWaitTime);

async function changeWaitTime(args: { seconds: number }, hre: HardhatRuntimeEnvironment) {
  try {
    await hre.run('utils:assertChainId');

    if (!hre.contracts.FAUCET_ADDRESS) throw new Error('Faucet address not found');

    const contract = await hre.ethers.getContractAt('DFArenaFaucet', hre.contracts.FAUCET_ADDRESS);

    const txReceipt = await contract.changeWaitTime(args.seconds);
    await txReceipt.wait();

    console.log(`changed drip to ${formatEther(await contract.getDripAmount())}`);
  } catch (error) {
    console.log('change drip failed', error);
  }
}

task('faucet:withdraw', 'withdraw all funds from faucet')
  .addOptionalParam('address', 'withdraw address', undefined, types.string)
  .setAction(withdraw);

async function withdraw(args: { address: string }, hre: HardhatRuntimeEnvironment) {
  try {
    await hre.run('utils:assertChainId');

    if (!hre.contracts.FAUCET_ADDRESS) throw new Error('Faucet address not found');

    const contract = await hre.ethers.getContractAt('DFArenaFaucet', hre.contracts.FAUCET_ADDRESS);

    var address = args.address ? args.address : await contract.getOwner();

    var whitelistBalance = await contract.getBalance();
    console.log(`Withdrawing ${weiToEth(whitelistBalance)} from faucet to ${address}`);

    const txReceipt = await contract.withdraw(address);
    await txReceipt.wait();

    console.log(`faucet  balance is now ${formatEther(await contract.getBalance())}`);
  } catch (error) {
    console.log('change drip failed', error);
  }
}

task('faucet:fund', 'send more funds to faucet')
  .addParam('value', 'amount to fund', 0, types.float)
  .setAction(fund);

async function fund(args: { value: number }, hre: HardhatRuntimeEnvironment) {
  try {
    await hre.run('utils:assertChainId');

    const [deployer] = await hre.ethers.getSigners();

    if (!hre.contracts.FAUCET_ADDRESS) throw new Error('Faucet address not found');

    const faucet = await hre.ethers.getContractAt('DFArenaFaucet', hre.contracts.FAUCET_ADDRESS);

    if (args.value > 0) {
      const deployerBalance = weiToEth(await deployer.getBalance());
      console.log(`deployer balance ${deployerBalance}`);
      if (deployerBalance < args.value) throw new Error('Not enough funds');

      console.log(`funding faucet with ${args.value}`);

      const tx = await deployer.sendTransaction({
        to: faucet.address,
        value: hre.ethers.utils.parseEther(args.value.toString()),
      });
      await tx.wait();

      console.log(
        `Sent ${args.value} to faucet contract (${faucet.address}) to fund drips in faucet`
      );

      const whitelistBalance = await hre.ethers.provider.getBalance(faucet.address);
      console.log(`Faucet balance ${weiToEth(whitelistBalance)}`);
    }

    console.log(`faucet  balance is now ${formatEther(await faucet.getBalance())}`);
  } catch (error) {
    console.log('change drip failed', error);
  }
}
