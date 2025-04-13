import * as fs from 'fs/promises';
import { TASK_COMPILE } from 'hardhat/builtin-tasks/task-names';
import { task } from 'hardhat/config';
import type {
  HardhatArguments,
  HardhatRuntimeEnvironment,
  RunSuperFunction,
  TaskArguments,
} from 'hardhat/types';
import * as path from 'path';
import * as prettier from 'prettier';

task(TASK_COMPILE, 'hook the compile step to copy our abis after').setAction(copyAbi);

async function copyAbi(
  args: HardhatArguments,
  hre: HardhatRuntimeEnvironment,
  runSuper: RunSuperFunction<TaskArguments>
) {
  const out = await runSuper(args);

  const { abi } = await hre.artifacts.readArtifact(hre.config.diamondAbi.name);
  const abisDir = path.join(hre.packageDirs['@darkforest_eth/contracts'], 'abis');

  // workaround for: https://github.com/graphprotocol/graph-cli/issues/588
  // just remove calls we cant process, note makes them unusable from within
  // graph but largely dont need these

  const filteredDiamondAbi = abi.filter(abiFilter);
  const finalAbi = copyAbiNoPlanetTypeWeights(filteredDiamondAbi);

  await fs.writeFile(
    path.join(abisDir, 'DarkForest_stripped.json'),
    prettier.format(JSON.stringify(finalAbi), {
      semi: false,
      parser: 'json',
    })
  );

  return out;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function abiFilter(item: any) {
  if (item.type === 'function') {
    // filter out all non view fns
    if (item.stateMutability === 'nonpayable' || item.stateMutability === 'payable') {
      return false;
    }

    for (const input of item.inputs) {
      if (input.type.includes('][') || input.internalType.includes('][')) {
        return false;
      }

      for (const component of input.components ?? []) {
        if (component.internalType.includes('][')) {
          return false;
        }
      }
    }

    for (const output of item.outputs) {
      if (output.type.includes('][') || output.internalType.includes('][')) {
        return false;
      }

      for (const component of output.components ?? []) {
        if (component.internalType.includes('][')) {
          return false;
        }

      }
    }
  }
  return true;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function copyAbiNoPlanetTypeWeights(abi: any): any {
  console.log('abi length', abi.length);
  for (var h = 0; h < abi.length; h++) {
    var abiItem = abi[h];
    if(abiItem.name == 'getInitializers') {
      // Position of gameConstants in getAllConstantsABI
      var gameConstantsComponents = abiItem.outputs[0].components[0].components;
      for(var i = 0; i < gameConstantsComponents.length; i++) {
        var res = gameConstantsComponents[i];
        if(res.name == 'PLANET_TYPE_WEIGHTS') {
          gameConstantsComponents = gameConstantsComponents.splice(i,1);
        }
      }
    }
  }
  return abi;
}
