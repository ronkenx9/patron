import { toWei } from "./format";

export type Campaign = {
  id: string;
  title: string;
  blurb: string;
  story: string[];
  goalWei: bigint;
  deadline: string;
  // A campaign goes live only when the owner names a real, pool-reachable
  // treasury and the block the campaign starts counting from. Until then the
  // page renders as a preview and contributing stays disabled — strk20.json
  // rules apply to treasuries too.
  beneficiary?: string;
  fromBlock?: number;
  // Exclusive end of the counting window. Set this when the campaign closes
  // so a later live campaign can reuse the treasury without double-counting.
  toBlock?: number;
};

export function strk(amount: number): bigint {
  return BigInt(amount) * 10n ** 18n;
}

const TREASURY = "0x02da976cd4fc7689541d66612491ec49de859f97556c60933407bbd85be0c86f";

export const CAMPAIGNS: Campaign[] = [
  {
    id: "season-two",
    title: "SEASON 02 — open-source privacy tooling",
    blurb: "A closed month of open-source STRK20 tooling. Counting stopped before Night School reused this treasury.",
    story: [
      "Season one produced the PATRON tip jar. Season two was a month of open-source privacy tooling for Starknet.",
      "This campaign is closed. Its bar only counts pool-to-treasury receipts inside its block window. Night School uses the same treasury afterwards, so the windows must not overlap.",
      "Keep-what-you-raise: the treasury kept whatever the bar showed. There is no escrow contract and therefore no refund path in this version.",
    ],
    goalWei: strk(500),
    deadline: "2026-10-31T23:59:00Z",
    beneficiary: TREASURY,
    fromBlock: 14516675,
    toBlock: 14518740,
  },
  {
    id: "night-school",
    title: "NIGHT SCHOOL — STRK20 office hours",
    blurb: "Four open sessions on running a campaign with no supporter list. Pool-to-treasury receipts are public; PATRON does not publish who sent them.",
    story: [
      "Four Tuesday sessions, recorded and published: Wallet API pledges, silent gifts, and what the chain actually shows.",
      "The money pays the room, the recordings, and a public notes dump anyone can fork. Keep-what-you-raise — no escrow, no refunds.",
      "The bar counts qualifying STRK transfers from the pool to this treasury. That is a receipt, not proof of donor intent, unique donors, or that the creator did not fund it themselves. Amounts and timing are public; a missing sender field is not proof of untraceability.",
    ],
    goalWei: strk(80),
    deadline: "2026-10-31T23:59:00Z",
    beneficiary: TREASURY,
    fromBlock: 14518740,
  },
];

export function getCampaign(id: string): Campaign | undefined {
  return CAMPAIGNS.find((campaign) => campaign.id === id);
}

export function isLive(campaign: Campaign): boolean {
  return Boolean(campaign.beneficiary && campaign.fromBlock != null && campaign.toBlock == null);
}

export function isClosed(campaign: Campaign): boolean {
  return Boolean(campaign.beneficiary && campaign.fromBlock != null && campaign.toBlock != null);
}

export function liveCampaigns(campaigns: Campaign[] = CAMPAIGNS): Campaign[] {
  return campaigns.filter(isLive);
}

export function treasuryKey(address: string): string {
  return BigInt(address).toString(16);
}

export function inCampaignWindow(block: number, campaign: Campaign): boolean {
  if (campaign.fromBlock == null) return false;
  if (block < campaign.fromBlock) return false;
  if (campaign.toBlock != null && block >= campaign.toBlock) return false;
  return true;
}

export function windowsOverlap(a: Campaign, b: Campaign): boolean {
  if (a.fromBlock == null || b.fromBlock == null) return false;
  const aEnd = a.toBlock ?? Number.POSITIVE_INFINITY;
  const bEnd = b.toBlock ?? Number.POSITIVE_INFINITY;
  return a.fromBlock < bEnd && b.fromBlock < aEnd;
}

export function liveTreasuryConflicts(campaigns: Campaign[] = CAMPAIGNS): Array<[Campaign, Campaign]> {
  const live = liveCampaigns(campaigns);
  const conflicts: Array<[Campaign, Campaign]> = [];
  for (let i = 0; i < live.length; i++) {
    for (let j = i + 1; j < live.length; j++) {
      const left = live[i]!;
      const right = live[j]!;
      if (!left.beneficiary || !right.beneficiary) continue;
      if (treasuryKey(left.beneficiary) === treasuryKey(right.beneficiary)) conflicts.push([left, right]);
    }
  }
  return conflicts;
}

export function overlappingAttributions(campaigns: Campaign[] = CAMPAIGNS): Array<[Campaign, Campaign]> {
  const funded = campaigns.filter((campaign) => campaign.beneficiary && campaign.fromBlock != null);
  const conflicts: Array<[Campaign, Campaign]> = [];
  for (let i = 0; i < funded.length; i++) {
    for (let j = i + 1; j < funded.length; j++) {
      const left = funded[i]!;
      const right = funded[j]!;
      if (treasuryKey(left.beneficiary!) !== treasuryKey(right.beneficiary!)) continue;
      if (windowsOverlap(left, right)) conflicts.push([left, right]);
    }
  }
  return conflicts;
}

export function formatDeadline(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export function daysLeft(iso: string, now = Date.now()): number | null {
  const diff = new Date(iso).getTime() - now;
  if (Number.isNaN(diff)) return null;
  return Math.max(0, Math.ceil(diff / 86_400_000));
}

export function pledgedFraction(raisedWei: bigint, goalWei: bigint): number {
  if (goalWei <= 0n) return 0;
  return Math.min(1, Number(raisedWei) / Number(goalWei));
}

export { toWei };
