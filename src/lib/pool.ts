import { num, type ProviderInterface } from "starknet";
import { POOL_ADDRESS } from "./constants";

// The pool charges one flat fee per private operation. Read it live; this
// fallback only covers an RPC outage.
export const POOL_FEE_FALLBACK_WEI = 6n * 10n ** 18n;

export async function readPoolFeeWei(provider: ProviderInterface): Promise<bigint> {
  const response = await provider.callContract({ contractAddress: POOL_ADDRESS, entrypoint: "get_fee_amount" });
  const first = Array.isArray(response) ? response[0] : response;
  const fee = num.toBigInt(first);
  return fee > 0n ? fee : POOL_FEE_FALLBACK_WEI;
}

export type TipCheck = { level: "ok" | "warn" | "block"; reason?: string };

// The exact fee split is decided inside the wallet, but a tip at or below the
// flat pool fee is irrational under any split, and a tip near it deserves a
// nudge. Block only the irrational case; warn on the rest.
export function tipCheck(amountWei: bigint, feeWei: bigint): TipCheck {
  if (amountWei <= feeWei) {
    return { level: "block", reason: "A tip at or below the pool fee would be eaten by the fee itself." };
  }
  if (amountWei < feeWei * 2n) {
    return { level: "warn", reason: "This close to the pool fee, a large share of the tip goes to the pool, not the creator." };
  }
  return { level: "ok" };
}

export function sameAddress(a: string, b: string): boolean {
  try {
    return BigInt(a) === BigInt(b);
  } catch {
    return false;
  }
}
