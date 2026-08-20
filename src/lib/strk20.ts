import { num, type ProviderInterface, type WalletAccountV6 } from "starknet";
import type { WALLET_API } from "@starknet-io/types-js";
import { STRK_ADDRESS, TX_WAIT_MS } from "./constants";

export type TipBook = {
  creator: string;
  supporters: number;
  aggregateWei: bigint;
};

export function isStrk20Spec(specs: string[]): boolean {
  return specs.some((spec) => {
    const match = spec.match(/(\d+)\.(\d+)/);
    return !!match && Number(match[1]) === 0 && Number(match[2]) >= 10;
  });
}

export function depositAction(amountWei: bigint): WALLET_API.STRK20_ACTION {
  return { type: "deposit", token: STRK_ADDRESS, amount: num.toHex(amountWei) };
}

export function tipAction(amountWei: bigint, creator: string): WALLET_API.STRK20_ACTION {
  return { type: "transfer", token: STRK_ADDRESS, amount: num.toHex(amountWei), recipient: creator };
}

export function withdrawAction(amountWei: bigint, recipient: string): WALLET_API.STRK20_ACTION {
  return { type: "withdraw", token: STRK_ADDRESS, amount: num.toHex(amountWei), recipient };
}

export async function invokeActions(
  wallet: WalletAccountV6,
  provider: ProviderInterface,
  actions: WALLET_API.STRK20_ACTION[],
): Promise<{ txHash: string; timedOut: boolean }> {
  const result = await wallet.strk20InvokeTransaction(actions);
  const txHash = result.transaction_hash;
  let timedOut = false;
  try {
    await Promise.race([
      provider.waitForTransaction(txHash, { retries: 80, retryInterval: 2500 }),
      new Promise((resolve) => setTimeout(resolve, TX_WAIT_MS)),
    ]);
  } catch {
    timedOut = true;
  }
  return { txHash, timedOut };
}

export function aggregateBook(rows: { amountWei: bigint }[]): TipBook {
  return {
    creator: "@kenn",
    supporters: rows.length,
    aggregateWei: rows.reduce((total, row) => total + row.amountWei, 0n),
  };
}
