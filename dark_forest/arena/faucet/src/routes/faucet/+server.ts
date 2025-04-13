import { json } from '@sveltejs/kit';
import { FAUCET_PRIVATE_KEY } from '$env/static/private';
import { createWalletClient, http, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const faucet = privateKeyToAccount(FAUCET_PRIVATE_KEY as `0x${string}`);
const client = createWalletClient({
    transport: http(),
    account: faucet,
    chain: {
        id: 42069,
        rpcUrls: {
            default: { http: [process.env.DEFAULT_RPC as string] }
        },
        name: "dfarena",
        nativeCurrency: {
            name: "ETH",
            symbol: "ETH",
            decimals: 18
        }
    }
});

export async function POST({ request }) {
    const { pubkey } = await request.json();

    try {
        const hash = await client.sendTransaction({
            to: pubkey,
            value: parseEther('5'),
        });
        return json({ success: true, hash });
    } catch (error: any) {
        console.log(error);
        return json({ success: false, error: error.message });
    }
}