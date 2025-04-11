import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { ERC721BaseInternal, ERC721BaseInternalInterface } from "../ERC721BaseInternal";
export declare class ERC721BaseInternal__factory {
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
    static createInterface(): ERC721BaseInternalInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): ERC721BaseInternal;
}
//# sourceMappingURL=ERC721BaseInternal__factory.d.ts.map