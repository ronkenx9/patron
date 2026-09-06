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
};

export function strk(amount: number): bigint {
  return BigInt(amount) * 10n ** 18n;
}

export const CAMPAIGNS: Campaign[] = [
  {
    id: "season-two",
    title: "SEASON 02 — open-source privacy tooling",
    blurb: "A month of open-source STRK20 tooling, funded by patrons who stay invisible.",
    story: [
      "Season one produced the PATRON tip jar. Season two is a month of open-source privacy tooling for Starknet: examples, audits of by-example pages, and small libraries any builder can take.",
      "Every backer stays anonymous — the chain records that the pool paid the treasury, never who paid. Amounts are public because a verifiable progress bar is worth more to this campaign than pledge privacy; the backer list simply does not exist.",
      "Keep-what-you-raise: the treasury keeps whatever the bar shows when the season starts, whether or not the goal is met. There is no escrow contract and therefore no refund path in this version.",
    ],
    goalWei: strk(500),
    deadline: "2026-10-31T23:59:00Z",
  },
];

export function getCampaign(id: string): Campaign | undefined {
  return CAMPAIGNS.find((campaign) => campaign.id === id);
}

export function isLive(campaign: Campaign): boolean {
  return Boolean(campaign.beneficiary && campaign.fromBlock);
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
