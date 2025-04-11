import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { ERC721MetadataInternal, ERC721MetadataInternalInterface } from "../ERC721MetadataInternal";
export declare class ERC721MetadataInternal__factory {
    static readonly abi: {
        anonymous: boolean;
        inputs: {
            indexed: boolean;
            internalType: string;
            name: string;
            type: string;
        }[];
        name: string;
        type: string;
    }[];
    static createInterface(): ERC721MetadataInternalInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): ERC721MetadataInternal;
}
//# sourceMappingURL=ERC721MetadataInternal__factory.d.ts.map