import {
  Connection,
  VersionedMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { Buffer } from "buffer";

export function prepareSignedTransaction(msg: string) {
  const deserializedMsg = VersionedMessage.deserialize(
    Uint8Array.from(Buffer.from(msg, "base64")),
  );
  return new VersionedTransaction(deserializedMsg);
}

export async function signTransaction(tx: VersionedTransaction) {
  const connection = new Connection(
    "https://nerissa-3i7at8-fast-mainnet.helius-rpc.com/",
    "confirmed",
  );

  if (!tx) return console.error("No transaction provided");

  let wallet: SolanaProvider | undefined = undefined;
  if (window.solana) {
    wallet = window.solana;
  } else if (window.solflare) {
    wallet = window.solflare;
  } else if (window.backpack) {
    wallet = window.backpack;
  }

  if (!wallet) return console.error("Wallet not connected");

  try {
    console.log("Transaction before signing:", tx);

    // Request signature from the wallet
    const signedTx = await (wallet as any).signTransaction(tx);
    console.log("Signed transaction:", signedTx);

    // Send the transaction
    const txId = await connection.sendRawTransaction(signedTx.serialize());
    console.log("Transaction ID:", txId);

    return txId;
  } catch (err) {
    console.error("Transaction signing error:", err);
  }
}
