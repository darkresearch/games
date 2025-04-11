import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { ERC721Metadata, ERC721MetadataInterface } from "../ERC721Metadata";
export declare class ERC721Metadata__factory {
    static readonly abi: ({
        anonymous: boolean;
        inputs: {
            indexed: boolean;
            internalType: string;
            name: string;
            type: string;
        }[];
        name: string;
        type: string;
        outputs?: undefined;
        stateMutability?: undefined;
    } | {
        inputs: {
            internalType: string;
            name: string;
            type: string;
        }[];
        name: string;
        outputs: {
            internalType: string;
            name: string;
            type: string;
        }[];
        stateMutability: string;
        type: string;
        anonymous?: undefined;
    })[];
    static createInterface(): ERC721MetadataInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): ERC721Metadata;
}
//# sourceMappingURL=ERC721Metadata__factory.d.ts.map