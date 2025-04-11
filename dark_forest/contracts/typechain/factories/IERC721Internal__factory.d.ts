import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { IERC721Internal, IERC721InternalInterface } from "../IERC721Internal";
export declare class IERC721Internal__factory {
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
    static createInterface(): IERC721InternalInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): IERC721Internal;
}
//# sourceMappingURL=IERC721Internal__factory.d.ts.map