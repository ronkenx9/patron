import { hash, validateAndParseAddress, type ProviderInterface } from "starknet";
import { POOL_ADDRESS, STRK_ADDRESS } from "./constants";

// A pledge is a pool withdrawal paid straight to the campaign treasury: the
// amount is public (that is what makes the bar verifiable), the backer is not
// on the chain at all — the transaction is submitted by a relayer.
export type Pledge = {
  amountWei: bigint;
  block: number;
  txHash: string;
};

const TRANSFER_SELECTOR = hash.getSelectorFromName("Transfer");
const MAX_PAGES_DEFAULT = 10;

// SRC-20 Transfer stores value as u256: data[0] = low limb, data[1] = high limb.
export function decodeU256(low: string | undefined, high: string | undefined): bigint {
  if (!low) throw new Error("Transfer event without an amount.");
  const lo = BigInt(low);
  const hi = BigInt(high ?? "0x0");
  return lo + (hi << 128n);
}

// Event shape (verified against STRK mainnet): keys = [selector, from, to],
// data = [value_low, value_high]. Anything else is not a pledge.
export function pledgeFromEvent(event: { keys?: string[]; data?: string[]; block_number?: number; transaction_hash?: string }): Pledge | null {
  const { keys, data } = event;
  if (!keys || keys.length !== 3 || !data || data.length !== 2) return null;
  try {
    if (BigInt(keys[1]) !== BigInt(POOL_ADDRESS)) return null;
    return {
      amountWei: decodeU256(data[0], data[1]),
      block: event.block_number ?? 0,
      txHash: event.transaction_hash ?? "",
    };
  } catch {
    return null;
  }
}

export async function fetchPledges(
  provider: ProviderInterface,
  beneficiary: string,
  fromBlock: number,
  opts: { maxPages?: number } = {},
): Promise<Pledge[]> {
  const treasury = validateAndParseAddress(beneficiary);
  const head = await provider.getBlockNumber();
  if (fromBlock > head) return [];

  const pledges: Pledge[] = [];
  let token: string | undefined;
  let pages = 0;
  const maxPages = opts.maxPages ?? MAX_PAGES_DEFAULT;

  do {
    const page = await provider.getEvents({
      address: STRK_ADDRESS,
      keys: [[TRANSFER_SELECTOR], [validateAndParseAddress(POOL_ADDRESS)], [treasury]],
      from_block: { block_number: fromBlock },
      to_block: { block_number: head },
      chunk_size: 1000,
      continuation_token: token,
    });
    for (const event of page.events) {
      const pledge = pledgeFromEvent(event);
      if (pledge && pledge.amountWei > 0n) pledges.push(pledge);
    }
    token = page.continuation_token;
    pages += 1;
  } while (token && pages < maxPages);

  return pledges;
}

export function sumPledges(pledges: Pledge[]): { totalWei: bigint; count: number; lastBlock: number | null } {
  let totalWei = 0n;
  let lastBlock: number | null = null;
  for (const pledge of pledges) {
    totalWei += pledge.amountWei;
    if (lastBlock === null || pledge.block > lastBlock) lastBlock = pledge.block;
  }
  return { totalWei, count: pledges.length, lastBlock };
}
