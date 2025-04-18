"use strict";
/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DFDebugFacet__factory = void 0;
const ethers_1 = require("ethers");
const _abi = [
    {
        inputs: [
            {
                internalType: "uint256",
                name: "locationId",
                type: "uint256",
            },
        ],
        name: "adminFillPlanet",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
];
const _bytecode = "0x608060405234801561001057600080fd5b50610213806100206000396000f3fe608060405234801561001057600080fd5b506004361061002b5760003560e01c80630ab4683514610030575b600080fd5b61004361003e3660046101c4565b610045565b005b61004d610113565b60008181527fcb7f1a525606efcbba7baaf9b0b55c468d0fd558cbf767967f538834dfa1233c602052604090205460ff166100cf5760405162461bcd60e51b815260206004820152601960248201527f706c616e6574206973206e6f7420696e697469616c697a65640000000000000060448201526064015b60405180910390fd5b60009081527fcb7f1a525606efcbba7baaf9b0b55c468d0fd558cbf767967f538834dfa1233a60205260409020600781015460098201556005810154600490910155565b7fc8fcad8db84d3cc18b4c41d551ea0ee66dd599cde068d998e57d5e09332c131c6004015473ffffffffffffffffffffffffffffffffffffffff1633146101c25760405162461bcd60e51b815260206004820152602260248201527f4c69624469616d6f6e643a204d75737420626520636f6e7472616374206f776e60448201527f657200000000000000000000000000000000000000000000000000000000000060648201526084016100c6565b565b6000602082840312156101d657600080fd5b503591905056fea26469706673582212205d99433e420d199aff159052df24bf3897f2bfe7948adba6912148b1fec67f9564736f6c634300080a0033";
class DFDebugFacet__factory extends ethers_1.ContractFactory {
    constructor(signer) {
        super(_abi, _bytecode, signer);
    }
    deploy(overrides) {
        return super.deploy(overrides || {});
    }
    getDeployTransaction(overrides) {
        return super.getDeployTransaction(overrides || {});
    }
    attach(address) {
        return super.attach(address);
    }
    connect(signer) {
        return super.connect(signer);
    }
    static createInterface() {
        return new ethers_1.utils.Interface(_abi);
    }
    static connect(address, signerOrProvider) {
        return new ethers_1.Contract(address, _abi, signerOrProvider);
    }
}
exports.DFDebugFacet__factory = DFDebugFacet__factory;
DFDebugFacet__factory.bytecode = _bytecode;
DFDebugFacet__factory.abi = _abi;
//# sourceMappingURL=DFDebugFacet__factory.js.map