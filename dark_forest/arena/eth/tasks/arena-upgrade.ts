import { task, types } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { deployContract } from '../utils/deploy';
import { DiamondChanges, FacetCut } from '../utils/diamond';
import {
  deployAdminFacet,
  deployArtifactFacet,
  deployCaptureFacet,
  deployCoreFacet,
  deployDebugFacet,
  deployGetterFacet,
  deployLibraries,
  deployLobbyFacet,
  deployMoveFacet,
  deployWhitelistFacet,
} from './deploy';
import * as fs from "fs";
import * as path from "path";
import { remove } from 'lodash';
import { deployArenaStarterFacet } from './arena-deploy';

const DEPLOY_PATH = './facets.json';

task('arena:upgrade', 'upgrade contracts and replace in the diamond')
.addParam('load', 'load deployed facet addresses from file', false, types.boolean)
.setAction(upgrade);

async function upgrade(args: { load: boolean }, hre: HardhatRuntimeEnvironment) {
  await hre.run('utils:assertChainId');

  const isDev = hre.network.name === 'localhost' || hre.network.name === 'hardhat';

  // need to force a compile for tasks
  await hre.run('compile');

  const diamond = await hre.ethers.getContractAt('DarkForest', hre.contracts.CONTRACT_ADDRESS);

  const previousFacets = await diamond.facets();

  const changes = new DiamondChanges(previousFacets);

  var toCut: FacetCut[] = [];

  if(args.load) {
    console.log(`loading contracts from ${DEPLOY_PATH}`);
    const cutsFromFile: FacetCut[] = JSON.parse(fs.readFileSync(DEPLOY_PATH, 'utf-8'));
    console.log('cuts from file', cutsFromFile);
    toCut = cutsFromFile;
  }
  else {
    const libraries = await deployLibraries({}, hre);

    // Dark Forest facets
    const coreFacet = await deployCoreFacet({}, libraries, hre);
    const moveFacet = await deployMoveFacet({}, libraries, hre);
    const artifactFacet = await deployArtifactFacet(
      { diamondAddress: diamond.address },
      libraries,
      hre
    );
    const getterFacet = await deployGetterFacet({}, libraries, hre);
    const whitelistFacet = await deployWhitelistFacet({}, libraries, hre);
    const adminFacet = await deployAdminFacet({}, libraries, hre);
    // const lobbyFacet = await deployLobbyFacet({}, libraries, hre);
    const captureFacet = await deployCaptureFacet({}, libraries, hre);
  
    const arenaGetterFacet = await deployContract('DFArenaGetterFacet', {}, hre);
    const arenaCoreFacet = await deployContract('DFArenaCoreFacet', { LibGameUtils: libraries.LibGameUtils, LibPlanet: libraries.LibPlanet }, hre);
    const spaceshipConfigFacet = await deployContract('DFSpaceshipConfigFacet', { LibGameUtils: libraries.LibGameUtils }, hre);
    const tournamentFacet = await deployContract('DFArenaTournamentFacet', {}, hre);
    const startFacet = await deployArenaStarterFacet({}, libraries, hre);

    const arenaDiamondCuts: FacetCut[] = [
      ...changes.getFacetCuts('DFArenaGetterFacet', arenaGetterFacet),
      ...changes.getFacetCuts('DFArenaCoreFacet', arenaCoreFacet),
      ...changes.getFacetCuts('DFSpaceshipConfigFacet', spaceshipConfigFacet),
      ...changes.getFacetCuts('DFTournamentFacet', tournamentFacet),
      ...changes.getFacetCuts('DFStartFacet', startFacet),

    ];
  
  
    // The `cuts` to perform for Dark Forest facets
    const darkForestCuts = [
      ...changes.getFacetCuts('DFCoreFacet', coreFacet),
      ...changes.getFacetCuts('DFMoveFacet', moveFacet),
      ...changes.getFacetCuts('DFArtifactFacet', artifactFacet),
      ...changes.getFacetCuts('DFGetterFacet', getterFacet),
      ...changes.getFacetCuts('DFWhitelistFacet', whitelistFacet),
      ...changes.getFacetCuts('DFAdminFacet', adminFacet),
      // ...changes.getFacetCuts('DFLobbyFacet', lobbyFacet),
      ...changes.getFacetCuts('DFCaptureFacet', captureFacet),
    ];
  
    if (isDev) {
      const debugFacet = await deployDebugFacet({}, libraries, hre);
      darkForestCuts.push(...changes.getFacetCuts('DFDebugFacet', debugFacet));
    }
      
    // The `cuts` to remove any old, unused functions
    // const removeCuts = changes.getRemoveCuts(darkForestCuts).concat(changes.getRemoveCuts(arenaDiamondCuts));
    // ...removeCuts
    
    toCut = [...darkForestCuts, ...arenaDiamondCuts];

  }

  fs.writeFileSync(DEPLOY_PATH, JSON.stringify(toCut));
  console.log(`wrote cuts to ${DEPLOY_PATH}`);

  const shouldUpgrade = await changes.verify();
  if (!shouldUpgrade) {
    console.log('Upgrade aborted');
    return;
  }



  // As mentioned in the `deploy` task, EIP-2535 specifies that the `diamondCut`
  // function takes two optional arguments: address _init and bytes calldata _calldata
  // However, in a standard upgrade, no state modifications are done, so the 0x0 address
  // and empty calldata are specified for those `diamondCut` parameters.
  // If the Diamond storage needs to be changed on an upgrade, a contract would need to be
  // deployed and these variables would need to be adjusted similar to the `deploy` task.
  const initAddress = hre.ethers.constants.AddressZero;
  const initFunctionCall = '0x';

  const upgradeTx = await diamond.diamondCut(toCut, initAddress, initFunctionCall, {gasLimit: 15000000});
  const upgradeReceipt = await upgradeTx.wait();
  if (!upgradeReceipt.status) {
    throw Error(`Diamond cut failed: ${upgradeTx.hash}`);
  }
  console.log(`Completed diamond cut with ${upgradeReceipt.gasUsed}`);

  // TODO: Upstream change to update task name from `hardhat-4byte-uploader`
  if (!isDev) {
    try {
      await hre.run('upload-selectors', { noCompile: true });
    } catch {
      console.warn('WARNING: Unable to update 4byte database with our selectors');
      console.warn('Please run the `upload-selectors` task manually so selectors can be reversed');
    }
  }

  console.log('Upgraded successfully. Godspeed cadet.');
}
