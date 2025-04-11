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
/**
 * Shape of a javascript object that must be passed into snarkJS `fullProve`
 * proof generation function for `reveal` circuit
 */
export interface RevealSnarkInput {
    x: string;
    y: string;
    PLANETHASH_KEY: string;
    SPACETYPE_KEY: string;
    SCALE: string;
    xMirror: string;
    yMirror: string;
}
/**
 * Shape of the args for `revealLocation` DarkForest contract call
 */
export declare type RevealSnarkContractCallArgs = [
    [
        string,
        string
    ],
    [
        [
            string,
            string
        ],
        [
            string,
            string
        ]
    ],
    [
        string,
        string
    ],
    [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string
    ]
];
/**
 * Shape of a javascript object that must be passed into snarkJS `fullProve`
 * proof generation function for `init` circuit
 */
export interface InitSnarkInput {
    x: string;
    y: string;
    r: string;
    PLANETHASH_KEY: string;
    SPACETYPE_KEY: string;
    SCALE: string;
    xMirror: string;
    yMirror: string;
}
/**
 * Shape of the args for the `initializePlayer` DarkForest contract call
 */
export declare type InitSnarkContractCallArgs = [
    [
        string,
        string
    ],
    [
        [
            string,
            string
        ],
        [
            string,
            string
        ]
    ],
    [
        string,
        string
    ],
    [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string
    ]
];
/**
 * Shape of a javascript object that must be passed into snarkJS `fullProve`
 * proof generation function for `move` circuit
 */
export interface MoveSnarkInput {
    x1: string;
    y1: string;
    x2: string;
    y2: string;
    r: string;
    distMax: string;
    PLANETHASH_KEY: string;
    SPACETYPE_KEY: string;
    SCALE: string;
    xMirror: string;
    yMirror: string;
}
/**
 * (Almost) shape of the args for `move` DarkForest contract call.
 * The fourth array element additionally needs shipsMoved, silverMoved, and
 * artifactIdMoved before it can be passed as args to `move`, but those values
 * are not part of the zkSNARK.
 */
export declare type MoveSnarkContractCallArgs = [
    [
        string,
        string
    ],
    [
        [
            string,
            string
        ],
        [
            string,
            string
        ]
    ],
    [
        string,
        string
    ],
    [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string
    ]
];
/**
 * Shape of a javascript object that must be passed into snarkJS `fullProve`
 * proof generation function for `biomebase` circuit
 */
export interface BiomebaseSnarkInput {
    x: string;
    y: string;
    PLANETHASH_KEY: string;
    BIOMEBASE_KEY: string;
    SCALE: string;
    xMirror: string;
    yMirror: string;
}
/**
 * Shape of the args for `findArtifact` DarkForest contract call.
 */
export declare type BiomebaseSnarkContractCallArgs = [
    [
        string,
        string
    ],
    [
        [
            string,
            string
        ],
        [
            string,
            string
        ]
    ],
    [
        string,
        string
    ],
    [
        string,
        string,
        string,
        string,
        string,
        string,
        string
    ]
];
/**
 * Shape of a javascript object that must be passed into snarkJS `fullProve`
 * proof generation function for `whitelist` circuit
 */
export interface WhitelistSnarkInput {
    key: string;
    recipient: string;
}
/**
 * Shape of the args for `whitelistRegister` DarkForest contract call.
 */
export declare type WhitelistSnarkContractCallArgs = [
    [
        string,
        string
    ],
    [
        [
            string,
            string
        ],
        [
            string,
            string
        ]
    ],
    [
        string,
        string
    ],
    [
        string,
        string
    ]
];
/**
 * Type representing the shape of args that are passed into DarkForest
 * functions that require zkSNARK verification.
 */
export declare type ContractCallArgs = RevealSnarkContractCallArgs | InitSnarkContractCallArgs | MoveSnarkContractCallArgs | BiomebaseSnarkContractCallArgs | WhitelistSnarkContractCallArgs;
/**
 * A zkSNARK proof (without signals) generated by snarkJS `fullProve`
 */
export interface SnarkJSProof {
    pi_a: [string, string, string];
    pi_b: [[string, string], [string, string], [string, string]];
    pi_c: [string, string, string];
}
/**
 * A zkSNARK proof and corresponding public signals generated by snarkJS
 * `fullProve`
 */
export interface SnarkJSProofAndSignals {
    proof: SnarkJSProof;
    publicSignals: string[];
}
/**
 * Method for converting the output of snarkJS `fullProve` into args that can be
 * passed into DarkForest smart contract functions which perform zk proof
 * verification.
 *
 * @param snarkProof the SNARK proof
 * @param publicSignals the circuit's public signals (i.e. output signals and
 * public input signals)
 */
export declare function buildContractCallArgs(snarkProof: SnarkJSProof, publicSignals: string[]): ContractCallArgs;
/**
 * @hidden
 */
export declare function fakeProof(publicSignals?: string[]): SnarkJSProofAndSignals;
/**
 * @hidden
 */
export declare const revealSnarkWasmPath: string;
/**
 * @hidden
 */
export declare const revealSnarkZkeyPath: string;
/**
 * @hidden
 */
export declare const initSnarkWasmPath: string;
/**
 * @hidden
 */
export declare const initSnarkZkeyPath: string;
/**
 * @hidden
 */
export declare const moveSnarkWasmPath: string;
/**
 * @hidden
 */
export declare const moveSnarkZkeyPath: string;
/**
 * @hidden
 */
export declare const biomebaseSnarkWasmPath: string;
/**
 * @hidden
 */
export declare const biomebaseSnarkZkeyPath: string;
/**
 * @hidden
 */
export declare const whitelistSnarkWasmPath: string;
/**
 * @hidden
 */
export declare const whitelistSnarkZkeyPath: string;
