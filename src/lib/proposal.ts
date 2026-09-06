import { validateAndParseAddress } from "starknet";

// A proposal is what a builder/creator produces on /submit: a validated
// campaign config the owner merges into src/lib/campaigns.ts. There is no
// backend and no custody — campaigns ship through a reviewable PR.
export type CampaignProposal = {
  id: string;
  title: string;
  blurb: string;
  story: string[];
  goalWei: bigint;
  deadline: string;
  beneficiary: string;
  fromBlock: number;
};

export type ProposalCheck = { level: "ok" | "block"; reason?: string };

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "campaign";
}

export function checkProposal(input: {
  title: string;
  blurb: string;
  story: string;
  goal: string;
  deadline: string;
  beneficiary: string;
  fromBlock: string;
}): { ok: true; proposal: CampaignProposal } | { ok: false; reason: string } {
  const title = input.title.trim();
  const blurb = input.blurb.trim();
  const story = input.story.split("\n").map((p) => p.trim()).filter(Boolean);
  if (title.length < 4) return { ok: false, reason: "Give the campaign a real title." };
  if (blurb.length < 10) return { ok: false, reason: "The one-liner is too short — say what the money is for." };
  if (story.length < 1) return { ok: false, reason: "Add at least one story paragraph." };

  const goal = Number(input.goal.trim());
  if (!Number.isFinite(goal) || goal < 10) return { ok: false, reason: "Goal must be at least 10 STRK." };

  const deadline = new Date(input.deadline);
  if (Number.isNaN(deadline.getTime())) return { ok: false, reason: "Pick a deadline date." };
  if (deadline.getTime() < Date.now()) return { ok: false, reason: "The deadline is in the past." };

  try {
    const beneficiary = validateAndParseAddress(input.beneficiary.trim());
    const fromBlock = Number(input.fromBlock.trim());
    if (!Number.isInteger(fromBlock) || fromBlock < 0) return { ok: false, reason: "Counting start block must be a non-negative integer." };
    return {
      ok: true,
      proposal: {
        id: slugify(title),
        title,
        blurb,
        story,
        goalWei: BigInt(Math.round(goal * 1e6)) * 10n ** 12n,
        deadline: deadline.toISOString(),
        beneficiary,
        fromBlock,
      },
    };
  } catch {
    return { ok: false, reason: "The treasury address is not a valid Starknet address." };
  }
}

// Renders the exact object a backer-turned-creator pastes into CAMPAIGNS.
export function proposalSnippet(proposal: CampaignProposal): string {
  const story = proposal.story.map((p) => `      ${JSON.stringify(p)},`).join("\n");
  return `  {
    id: ${JSON.stringify(proposal.id)},
    title: ${JSON.stringify(proposal.title)},
    blurb: ${JSON.stringify(proposal.blurb)},
    story: [
${story}
    ],
    goalWei: ${proposal.goalWei}n,
    deadline: ${JSON.stringify(proposal.deadline)},
    beneficiary: ${JSON.stringify(proposal.beneficiary)},
    fromBlock: ${proposal.fromBlock},
  },`;
}

const DRAFT_KEY = "patron.proposal.draft";

export function saveDraft(input: unknown): void {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(input)); } catch { /* private mode */ }
}

export function loadDraft<T>(): T | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
