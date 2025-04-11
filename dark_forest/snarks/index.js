"use strict";
/**
 * This package contains `.wasm` compiled SNARK circuits and `.zkey`
 * proving/verifier keys for the Dark Forest SNARKs. It also contains typescript
 * types for inputs and outputs to the SnarkJS functions we use to calculate
 * Dark Forest SNARK proofs, as well as conversion methods that convert between
 * SnarkJS outputs and Dark Forest contract call args.
 *
 * ## Installation
 *
 * You can install this package using [`npm`](https://www.npmjs.com) or
 * [`yarn`](https://classic.yarnpkg.com/lang/en/) by running:
 *
 * ```bash
 * npm install --save @darkforest_eth/snarks
 * ```
 * ```bash
 * yarn add @darkforest_eth/snarks
 * ```
 *
 * When using this in a plugin, you might want to load it with [skypack](https://www.skypack.dev)
 *
 * ```js
 * import * as snarks from 'http://cdn.skypack.dev/@darkforest_eth/snarks'
 * ```
 *
 * @packageDocumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.whitelistSnarkZkeyPath = exports.whitelistSnarkWasmPath = exports.biomebaseSnarkZkeyPath = exports.biomebaseSnarkWasmPath = exports.moveSnarkZkeyPath = exports.moveSnarkWasmPath = exports.initSnarkZkeyPath = exports.initSnarkWasmPath = exports.revealSnarkZkeyPath = exports.revealSnarkWasmPath = exports.fakeProof = exports.buildContractCallArgs = void 0;
/**
 * Method for converting the output of snarkJS `fullProve` into args that can be
 * passed into DarkForest smart contract functions which perform zk proof
 * verification.
 *
 * @param snarkProof the SNARK proof
 * @param publicSignals the circuit's public signals (i.e. output signals and
 * public input signals)
 */
function buildContractCallArgs(snarkProof, publicSignals) {
    // the object returned by genZKSnarkProof needs to be massaged into a set of parameters the verifying contract
    // will accept
    return [
        snarkProof.pi_a.slice(0, 2),
        // genZKSnarkProof reverses values in the inner arrays of pi_b
        [snarkProof.pi_b[0].slice(0).reverse(), snarkProof.pi_b[1].slice(0).reverse()],
        snarkProof.pi_c.slice(0, 2),
        publicSignals, // input
    ];
}
exports.buildContractCallArgs = buildContractCallArgs;
// if we're using a mock hash and ZK proofs are disabled, just give an empty proof
/**
 * @hidden
 */
function fakeProof(publicSignals = []) {
    return {
        proof: {
            pi_a: ['0', '0', '0'],
            pi_b: [
                ['0', '0'],
                ['0', '0'],
                ['0', '0'],
            ],
            pi_c: ['0', '0', '0'],
        },
        publicSignals: publicSignals,
    };
}
exports.fakeProof = fakeProof;
// These paths are only useful for Node.js since they are absolute on the system
/**
 * @hidden
 */
exports.revealSnarkWasmPath = require.resolve('./reveal.wasm');
/**
 * @hidden
 */
exports.revealSnarkZkeyPath = require.resolve('./reveal.zkey');
/**
 * @hidden
 */
exports.initSnarkWasmPath = require.resolve('./init.wasm');
/**
 * @hidden
 */
exports.initSnarkZkeyPath = require.resolve('./init.zkey');
/**
 * @hidden
 */
exports.moveSnarkWasmPath = require.resolve('./move.wasm');
/**
 * @hidden
 */
exports.moveSnarkZkeyPath = require.resolve('./move.zkey');
/**
 * @hidden
 */
exports.biomebaseSnarkWasmPath = require.resolve('./biomebase.wasm');
/**
 * @hidden
 */
exports.biomebaseSnarkZkeyPath = require.resolve('./biomebase.zkey');
/**
 * @hidden
 */
exports.whitelistSnarkWasmPath = require.resolve('./whitelist.wasm');
/**
 * @hidden
 */
exports.whitelistSnarkZkeyPath = require.resolve('./whitelist.zkey');
//# sourceMappingURL=index.js.map