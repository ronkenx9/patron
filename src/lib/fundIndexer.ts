import { hash, validateAndParseAddress, type ProviderInterface } from "starknet";
import { POOL_ADDRESS, STRK_ADDRESS } from "./constants";
import { inCampaignWindow, type Campaign } from "./campaigns";

// A counted receipt is a pool withdrawal paid to the campaign treasury.
// Amount and timing are public. That is what makes the bar verifiable.
// The indexer cannot prove donor intent, unique donors, or exclude self-funding.
export type Pledge = {
  amountWei: bigint;
  block: number;
  txHash: string;
};

export type PledgeScan = {
  pledges: Pledge[];
  complete: boolean;
  truncated: boolean;
  continuationToken?: string;
  fromBlock: number;
  toBlock: number;
  head: number;
};

const TRANSFER_SELECTOR = hash.getSelectorFromName("Transfer");
const MAX_PAGES_DEFAULT = 10;

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

export function coverageFromPages(pageCount: number, maxPages: number, continuation?: string): { complete: boolean; truncated: boolean } {
  const truncated = Boolean(continuation) && pageCount >= maxPages;
  return { complete: !truncated, truncated };
}

export function pledgesInWindow(pledges: Pledge[], campaign: Campaign): Pledge[] {
  return pledges.filter((pledge) => inCampaignWindow(pledge.block, campaign));
}

export async function fetchPledges(
  provider: ProviderInterface,
  beneficiary: string,
  fromBlock: number,
  opts: { maxPages?: number; toBlock?: number } = {},
): Promise<PledgeScan> {
  const treasury = validateAndParseAddress(beneficiary);
  const head = await provider.getBlockNumber();
  const exclusiveEnd = opts.toBlock;
  const lastInclusive = exclusiveEnd == null ? head : Math.min(head, exclusiveEnd - 1);
  const empty = (complete: boolean): PledgeScan => ({
    pledges: [],
    complete,
    truncated: false,
    fromBlock,
    toBlock: lastInclusive,
    head,
  });

  if (fromBlock > head || fromBlock > lastInclusive) return empty(true);

  const pledges: Pledge[] = [];
  let token: string | undefined;
  let pages = 0;
  const maxPages = opts.maxPages ?? MAX_PAGES_DEFAULT;

  do {
    const page = await provider.getEvents({
      address: STRK_ADDRESS,
      keys: [[TRANSFER_SELECTOR], [validateAndParseAddress(POOL_ADDRESS)], [treasury]],
      from_block: { block_number: fromBlock },
      to_block: { block_number: lastInclusive },
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

  const coverage = coverageFromPages(pages, maxPages, token);
  return {
    pledges,
    complete: coverage.complete,
    truncated: coverage.truncated,
    continuationToken: token,
    fromBlock,
    toBlock: lastInclusive,
    head,
  };
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
