import type { Contract, providers, Wallet } from 'ethers';
export declare type ContractLoader<T extends Contract> = (address: string, provider: providers.JsonRpcProvider, signer?: Wallet) => Promise<T>;
