// We import Chai to use its asserting functions here.
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { loadFixture, MockProvider } from 'ethereum-waffle';
import { DFArenaFaucet } from '@darkforest_eth/contracts/typechain';
import { formatEther, formatUnits, parseEther } from 'ethers/lib/utils';
import { BigNumber } from 'ethers';
import * as hre from 'hardhat';
import { increaseBlockchainTime } from './utils/TestUtils';

const fixture = async function () {
  await hre.network.provider.send('evm_setAutomine', [true]);

  const FaucetFactory = await ethers.getContractFactory('DFArenaFaucet');
  var faucet = await FaucetFactory.deploy();
  faucet = await faucet.deployed();
  return faucet;
};

describe('DFArenaFaucet ', function () {
  let faucet: DFArenaFaucet;
  let owner: SignerWithAddress;
  let nonOwner: SignerWithAddress;
  let nonOwnerFaucet: DFArenaFaucet;

  describe('Getters', function () {
    beforeEach('deploy contract', async function () {
      faucet = await loadFixture(fixture);
      [owner, nonOwner] = await ethers.getSigners();
    });

    it('default params are correct', async function () {
      expect(await faucet.getOwner()).to.be.equal(owner.address);
      expect(await faucet.getDripAmount()).to.be.equal(ethers.utils.parseEther('0.05'));
      expect(await faucet.getWaitTime()).to.be.equal(60 * 60 * 24);
    });
  });

  describe('Receive Funds', function () {
    beforeEach('deploy contract', async function () {
      faucet = await loadFixture(fixture);
      [owner, nonOwner] = await ethers.getSigners();
    });

    it('slow: can receive funds from anyone', async function () {
      const amount = parseEther('0.02');
      await expect(() =>
        owner.sendTransaction({ to: faucet.address, value: amount })
      ).to.changeEtherBalance(faucet, amount);
    });
  });

  describe('admin permissions', async function () {
    beforeEach('deploy contract', async function () {
      faucet = await loadFixture(fixture);
      [owner, nonOwner] = await ethers.getSigners();
      nonOwnerFaucet = await faucet.connect(nonOwner);
    });

    it('only owner can change ownership', async function () {
      await expect(nonOwnerFaucet.transferOwnership(owner.address)).to.be.revertedWith(
        'Ownable: caller is not the owner'
      );
    });
    it('only owner can change drip', async function () {
      await expect(nonOwnerFaucet.changeDrip(1)).to.be.revertedWith(
        'Ownable: caller is not the owner'
      );
    });
    it('only owner can change wait time', async function () {
      await expect(nonOwnerFaucet.changeWaitTime(1)).to.be.revertedWith(
        'Ownable: caller is not the owner'
      );
    });

    it('owner can change owner', async function () {
      await expect(faucet.transferOwnership(nonOwner.address))
        .to.emit(faucet, 'OwnershipTransferred')
        .withArgs(owner.address, nonOwner.address);
      expect(await faucet.getOwner()).to.equal(nonOwner.address);
    });
  });

  describe('Drip funds', function () {
    beforeEach('deploy contract', async function () {
      /* 
        This code breaks these tests because the contract data isn't reset when the new fixture is loaded 
        It functions like a before instead of a beforeEach. Any state change persists.
      */

      // faucet = await loadFixture(fixture);
      // [owner, nonOwner] = await ethers.getSigners();
      // nonOwnerFaucet = await faucet.connect(nonOwner);

      // console.log('owner access time', (await faucet.getNextAccessTime(owner.address)).toNumber());
      // console.log('non owner access time', (await faucet.getNextAccessTime(owner.address)).toNumber());
      // console.log('owner', await faucet.getOwner());

      /* This code is slower but it works */

      await hre.network.provider.send('evm_setAutomine', [true]);
      const FaucetFactory = await ethers.getContractFactory('DFArenaFaucet');
      faucet = (await FaucetFactory.deploy()) as DFArenaFaucet;
      await faucet.deployed();
      [owner, nonOwner] = await ethers.getSigners();
    });

    it('fails if funds are too low', async function () {
      await expect(faucet.drip(nonOwner.address)).to.be.revertedWith('faucet out of funds');

      await faucet.transferOwnership(nonOwner.address);
    });
    it('person receives correct amount of funds', async function () {
      const sendTx = await owner.sendTransaction({ to: faucet.address, value: parseEther('20') });
      await sendTx.wait();
      const drip = await faucet.getDripAmount();
      expect(await faucet.canWithdraw(nonOwner.address)).to.be.true;

      await expect(await faucet.drip(nonOwner.address)).to.changeEtherBalance(nonOwner, drip);
    });
    it('person cannot receive funds too early', async function () {
      const tx = await owner.sendTransaction({ to: faucet.address, value: parseEther('20') });
      await tx.wait();
      const drip = await faucet.getDripAmount();

      expect(await faucet.getNextAccessTime(nonOwner.address)).to.equal(0);

      await expect(await faucet.drip(nonOwner.address)).to.changeEtherBalance(nonOwner, drip);

      expect((await faucet.getNextAccessTime(nonOwner.address)).toNumber()).to.be.greaterThan(0);

      await expect(faucet.drip(nonOwner.address)).to.be.revertedWith("you can't withdraw yet");
    });
    it('person can get refill after waiting', async function () {
      await owner.sendTransaction({ to: faucet.address, value: parseEther('20') });
      const drip = await faucet.getDripAmount();

      await expect(await faucet.drip(nonOwner.address)).to.changeEtherBalance(nonOwner, drip);

      const tx = await faucet.changeWaitTime(5);
      await tx.wait();

      await increaseBlockchainTime(23 * 60 * 60);

      await expect(faucet.drip(nonOwner.address)).to.be.revertedWith("you can't withdraw yet");

      await increaseBlockchainTime(2 * 60 * 60);

      await expect(await faucet.drip(nonOwner.address)).to.changeEtherBalance(nonOwner, drip);

      expect((await faucet.getNextAccessTime(nonOwner.address)).toNumber()).to.be.greaterThan(0);
    });
    it('owner can withdraw all funds ', async function () {
      await owner.sendTransaction({ to: faucet.address, value: parseEther('20') });
      const balance = await faucet.getBalance();

      await expect(await faucet.withdraw(owner.address)).to.changeEtherBalance(owner, balance);
    });
  });
});
