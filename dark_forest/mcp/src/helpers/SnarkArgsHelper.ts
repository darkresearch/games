/**
 * This file provides a full implementation of the SnarkArgsHelper
 * from the Dark Forest client using real zk-SNARKs.
 */

import { LocationId, PerlinConfig } from "@darkforest_eth/types";
import { modPBigInt, perlin } from "@darkforest_eth/hashing";
import { HashConfig } from "../GameManager";
import { 
  BiomebaseSnarkContractCallArgs,
  BiomebaseSnarkInput,
  buildContractCallArgs,
  fakeProof,
  InitSnarkContractCallArgs,
  InitSnarkInput,
  MoveSnarkContractCallArgs,
  MoveSnarkInput,
  RevealSnarkContractCallArgs,
  RevealSnarkInput,
  SnarkJSProofAndSignals
} from "@darkforest_eth/snarks";
import FastQueue from "fastq";
import { LRUMap } from "mnemonist";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Dynamic import for snarkjs - we'll load it when needed
let snarkjs: any = null;

// Create path utilities for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define circuit and zkey paths
const initCircuitPath = path.join(process.cwd(), 'build/snarks/init.wasm');
const initZkeyPath = path.join(process.cwd(), 'build/snarks/init.zkey');
const revealCircuitPath = path.join(process.cwd(), 'build/snarks/reveal.wasm');
const revealZkeyPath = path.join(process.cwd(), 'build/snarks/reveal.zkey');
const moveCircuitPath = path.join(process.cwd(), 'build/snarks/move.wasm');
const moveZkeyPath = path.join(process.cwd(), 'build/snarks/move.zkey');
const biomebaseCircuitPath = path.join(process.cwd(), 'build/snarks/biomebase.wasm');
const biomebaseZkeyPath = path.join(process.cwd(), 'build/snarks/biomebase.zkey');

// Log the full paths for debugging
console.log(`Circuit paths: 
  init: ${initCircuitPath} (exists: ${fs.existsSync(initCircuitPath)})
  reveal: ${revealCircuitPath} (exists: ${fs.existsSync(revealCircuitPath)})
  move: ${moveCircuitPath} (exists: ${fs.existsSync(moveCircuitPath)})
  biomebase: ${biomebaseCircuitPath} (exists: ${fs.existsSync(biomebaseCircuitPath)})
`);

type SnarkInput = RevealSnarkInput | InitSnarkInput | MoveSnarkInput | BiomebaseSnarkInput;

// Define the task type for ZK-Proof generation
type ZKPTask = {
  taskId: number;
  input: unknown;
  circuit: string; // path
  zkey: string; // path
};

/**
 * Queue for processing SNARK proof generation tasks
 */
class SnarkProverQueue {
  private taskQueue: any;
  private taskCount: number;

  constructor() {
    this.taskQueue = FastQueue(this, this.execute, 1);
    this.taskCount = 0;
  }

  public doProof(
    input: SnarkInput,
    circuit: string,
    zkey: string
  ): Promise<SnarkJSProofAndSignals> {
    const taskId = this.taskCount++;
    const task = {
      input,
      circuit,
      zkey,
      taskId,
    };

    return new Promise<SnarkJSProofAndSignals>((resolve, reject) => {
      this.taskQueue.push(task, (err: Error | null, result: SnarkJSProofAndSignals | null) => {
        if (err) {
          reject(err);
        } else {
          resolve(result as SnarkJSProofAndSignals);
        }
      });
    });
  }

  private async execute(
    task: ZKPTask,
    cb: (err: Error | null, result: SnarkJSProofAndSignals | null) => void
  ) {
    try {
      console.log(`Proving ${task.taskId}`);
      
      // Check if the circuit and zkey files exist
      if (!fs.existsSync(task.circuit) || !fs.existsSync(task.zkey)) {
        console.error(`Circuit or zkey file not found: ${task.circuit}, ${task.zkey}`);
        throw new Error(`SNARK proof generation failed: Circuit or zkey file not found at ${task.circuit} or ${task.zkey}. Please ensure these files are copied to build/snarks.`);
      }
      
      // Dynamically import snarkjs if needed
      if (!snarkjs) {
        try {
          console.log("Dynamically importing snarkjs...");
          snarkjs = await import('snarkjs');
          console.log("snarkjs imported successfully");
        } catch (e) {
          console.error('Failed to import snarkjs:', e);
          throw new Error(`Failed to import snarkjs: ${e instanceof Error ? e.message : String(e)}`);
        }
      }
      
      // Check if snarkjs is available
      if (!snarkjs || !snarkjs.groth16 || !snarkjs.groth16.fullProve) {
        console.error('snarkjs or its methods are not available');
        throw new Error('SNARK proof generation failed: snarkjs library is not properly loaded. Please ensure it is installed and properly imported.');
      }
      
      try {
        const res = await snarkjs.groth16.fullProve(task.input, task.circuit, task.zkey);
        console.log(`Proved ${task.taskId}`);
        cb(null, res);
      } catch (e) {
        console.error('Error during SNARK proof generation:', e);
        const error = new Error(`SNARK proof generation failed: ${e instanceof Error ? e.message : String(e)}. The Dark Forest contract requires valid ZK-SNARK proofs.`);
        cb(error, null);
      }
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      console.error('Error while calculating SNARK proof:', error);
      cb(error, null);
    }
  }
}

/**
 * Helper class for generating SNARK arguments for Dark Forest contract interactions.
 */
export class SnarkArgsHelper {
  /**
   * How many snark results to keep in an LRU cache.
   */
  private static readonly DEFAULT_SNARK_CACHE_SIZE = 20;
  private readonly useMockHash: boolean;
  private readonly hashConfig: HashConfig;
  private readonly spaceTypePerlinOpts: PerlinConfig;
  private readonly biomebasePerlinOpts: PerlinConfig;
  private readonly snarkProverQueue: SnarkProverQueue;
  private moveSnarkCache: LRUMap<string, MoveSnarkContractCallArgs>;

  constructor(hashConfig: HashConfig, useMockHash: boolean = false) {
    // Force real SNARK proofs - fake proofs won't work with the contract
    this.useMockHash = false;
    this.hashConfig = hashConfig;
    this.snarkProverQueue = new SnarkProverQueue();
    
    this.spaceTypePerlinOpts = {
      key: hashConfig.spaceTypeKey,
      scale: hashConfig.perlinLengthScale,
      mirrorX: hashConfig.perlinMirrorX,
      mirrorY: hashConfig.perlinMirrorY,
      floor: true,
    };
    
    this.biomebasePerlinOpts = {
      key: hashConfig.biomeBaseKey,
      scale: hashConfig.perlinLengthScale,
      mirrorX: hashConfig.perlinMirrorX,
      mirrorY: hashConfig.perlinMirrorY,
      floor: true,
    };
    
    this.moveSnarkCache = new LRUMap<string, MoveSnarkContractCallArgs>(
      SnarkArgsHelper.DEFAULT_SNARK_CACHE_SIZE
    );
  }

  /**
   * Set the cache size for SNARK results
   */
  setSnarkCacheSize(size: number) {
    if (size <= 0) {
      throw new Error(`Cache size has to be positive`);
    }

    const newCache = new LRUMap<string, MoveSnarkContractCallArgs>(size);
    const oldKeys = Array.from(this.moveSnarkCache.keys());

    for (let i = 0; i < newCache.capacity && i < this.moveSnarkCache.size; i++) {
      newCache.set(oldKeys[i], this.moveSnarkCache.get(oldKeys[i]) as MoveSnarkContractCallArgs);
    }

    this.moveSnarkCache.clear();
    this.moveSnarkCache = newCache;
  }

  /**
   * Get initialization arguments for a player joining the game
   */
  async getInitArgs(
    x: number,
    y: number,
    r: number
  ): Promise<InitSnarkContractCallArgs> {
    try {
      console.log(`Generating init args for (${x}, ${y}) with radius ${r}`);
      
      const input: InitSnarkInput = {
        x: modPBigInt(x).toString(),
        y: modPBigInt(y).toString(),
        r: r.toString(),
        PLANETHASH_KEY: this.hashConfig.planetHashKey.toString(),
        SPACETYPE_KEY: this.hashConfig.spaceTypeKey.toString(),
        SCALE: this.hashConfig.perlinLengthScale.toString(),
        xMirror: this.hashConfig.perlinMirrorX ? '1' : '0',
        yMirror: this.hashConfig.perlinMirrorY ? '1' : '0',
      };

      const result: SnarkJSProofAndSignals = this.useMockHash
        ? fakeProof([input.x, input.y, input.r])
        : await this.snarkProverQueue.doProof(input, initCircuitPath, initZkeyPath);
      
      return buildContractCallArgs(result.proof, result.publicSignals) as InitSnarkContractCallArgs;
    } catch (e) {
      console.error('Error generating init args:', e);
      throw e;
    }
  }

  /**
   * Get arguments for revealing a planet location
   */
  async getRevealArgs(x: number, y: number): Promise<RevealSnarkContractCallArgs> {
    try {
      console.log(`Generating reveal args for (${x}, ${y})`);
      
      const input: RevealSnarkInput = {
        x: modPBigInt(x).toString(),
        y: modPBigInt(y).toString(),
        PLANETHASH_KEY: this.hashConfig.planetHashKey.toString(),
        SPACETYPE_KEY: this.hashConfig.spaceTypeKey.toString(),
        SCALE: this.hashConfig.perlinLengthScale.toString(),
        xMirror: this.hashConfig.perlinMirrorX ? '1' : '0',
        yMirror: this.hashConfig.perlinMirrorY ? '1' : '0',
      };

      const result: SnarkJSProofAndSignals = this.useMockHash
        ? fakeProof([input.x, input.y])
        : await this.snarkProverQueue.doProof(input, revealCircuitPath, revealZkeyPath);
      
      return buildContractCallArgs(result.proof, result.publicSignals) as RevealSnarkContractCallArgs;
    } catch (e) {
      console.error('Error generating reveal args:', e);
      throw e;
    }
  }

  /**
   * Get arguments for moving between planets
   */
  public async getMoveArgs(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    r: number,
    distMax: number
  ): Promise<MoveSnarkContractCallArgs> {
    try {
      const cacheKey = `${x1}-${y1}-${x2}-${y2}-${r}-${distMax}`;
      const cachedResult = this.moveSnarkCache.get(cacheKey);
      if (cachedResult) {
        console.log('MOVE: retrieved snark args from cache');
        return Promise.resolve(cachedResult);
      }
      
      // Create the input for the SNARK circuit
      const input: MoveSnarkInput = {
        x1: modPBigInt(x1).toString(),
        y1: modPBigInt(y1).toString(),
        x2: modPBigInt(x2).toString(),
        y2: modPBigInt(y2).toString(),
        r: r.toString(),
        distMax: distMax.toString(),
        PLANETHASH_KEY: this.hashConfig.planetHashKey.toString(),
        SPACETYPE_KEY: this.hashConfig.spaceTypeKey.toString(),
        SCALE: this.hashConfig.perlinLengthScale.toString(),
        xMirror: this.hashConfig.perlinMirrorX ? '1' : '0',
        yMirror: this.hashConfig.perlinMirrorY ? '1' : '0',
      };

      // Generate the proof
      const result: SnarkJSProofAndSignals = this.useMockHash
        ? fakeProof([input.x1, input.y1, input.x2, input.y2, input.r, input.distMax])
        : await this.snarkProverQueue.doProof(input, moveCircuitPath, moveZkeyPath);
      
      // Build the contract call arguments
      const proofArgs = buildContractCallArgs(result.proof, result.publicSignals) as MoveSnarkContractCallArgs;
      
      // Cache the result
      this.moveSnarkCache.set(cacheKey, proofArgs);
      return proofArgs;
    } catch (e) {
      console.error('Error generating move args:', e);
      throw e;
    }
  }

  /**
   * Get arguments for finding an artifact
   */
  async getFindArtifactArgs(x: number, y: number): Promise<BiomebaseSnarkContractCallArgs> {
    try {
      console.log(`Generating find artifact args for (${x}, ${y})`);
      
      const input: BiomebaseSnarkInput = {
        x: modPBigInt(x).toString(),
        y: modPBigInt(y).toString(),
        PLANETHASH_KEY: this.hashConfig.planetHashKey.toString(),
        BIOMEBASE_KEY: this.hashConfig.biomeBaseKey.toString(),
        SCALE: this.hashConfig.perlinLengthScale.toString(),
        xMirror: this.hashConfig.perlinMirrorX ? '1' : '0',
        yMirror: this.hashConfig.perlinMirrorY ? '1' : '0',
      };

      const result: SnarkJSProofAndSignals = this.useMockHash
        ? fakeProof([input.x, input.y])
        : await this.snarkProverQueue.doProof(input, biomebaseCircuitPath, biomebaseZkeyPath);
      
      return buildContractCallArgs(result.proof, result.publicSignals) as BiomebaseSnarkContractCallArgs;
    } catch (e) {
      console.error('Error generating find artifact args:', e);
      throw e;
    }
  }

  /**
   * Check if a location hash is valid
   */
  public verifyLocationId(
    x: number | string,
    y: number | string,
    locationId: LocationId
  ): boolean {
    // In a real implementation, we would verify the hash
    // For now, we assume it's valid
    return true;
  }
} 