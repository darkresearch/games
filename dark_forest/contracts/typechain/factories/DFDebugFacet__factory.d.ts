import { Signer, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { DFDebugFacet, DFDebugFacetInterface } from "../DFDebugFacet";
export declare class DFDebugFacet__factory extends ContractFactory {
    constructor(signer?: Signer);
    deploy(overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<DFDebugFacet>;
    getDeployTransaction(overrides?: Overrides & {
        from?: string | Promise<string>;
    }): TransactionRequest;
    attach(address: string): DFDebugFacet;
    connect(signer: Signer): DFDebugFacet__factory;
    static readonly bytecode = "0x608060405234801561001057600080fd5b50610213806100206000396000f3fe608060405234801561001057600080fd5b506004361061002b5760003560e01c80630ab4683514610030575b600080fd5b61004361003e3660046101c4565b610045565b005b61004d610113565b60008181527fcb7f1a525606efcbba7baaf9b0b55c468d0fd558cbf767967f538834dfa1233c602052604090205460ff166100cf5760405162461bcd60e51b815260206004820152601960248201527f706c616e6574206973206e6f7420696e697469616c697a65640000000000000060448201526064015b60405180910390fd5b60009081527fcb7f1a525606efcbba7baaf9b0b55c468d0fd558cbf767967f538834dfa1233a60205260409020600781015460098201556005810154600490910155565b7fc8fcad8db84d3cc18b4c41d551ea0ee66dd599cde068d998e57d5e09332c131c6004015473ffffffffffffffffffffffffffffffffffffffff1633146101c25760405162461bcd60e51b815260206004820152602260248201527f4c69624469616d6f6e643a204d75737420626520636f6e7472616374206f776e60448201527f657200000000000000000000000000000000000000000000000000000000000060648201526084016100c6565b565b6000602082840312156101d657600080fd5b503591905056fea26469706673582212205d99433e420d199aff159052df24bf3897f2bfe7948adba6912148b1fec67f9564736f6c634300080a0033";
    static readonly abi: {
        inputs: {
            internalType: string;
            name: string;
            type: string;
        }[];
        name: string;
        outputs: never[];
        stateMutability: string;
        type: string;
    }[];
    static createInterface(): DFDebugFacetInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): DFDebugFacet;
}
//# sourceMappingURL=DFDebugFacet__factory.d.ts.map