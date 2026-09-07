import { NextResponse } from "next/server";
import { validateAndParseAddress } from "starknet";
import { checkProposal } from "@/lib/proposal";
import { CAMPAIGNS } from "@/lib/campaigns";
import { clientKey, takeToken } from "@/lib/ratelimit";
import { hasDatabase, insertProposal, listProposals } from "@/lib/store";

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 32 * 1024;

function limited(request: Request, lane: string, max: number): NextResponse | null {
  if (!takeToken(`proposals:${lane}:${clientKey(request)}`, { windowMs: 10 * 60_000, max })) {
    return NextResponse.json({ error: "Too many proposals from this address — try again later." }, { status: 429 });
  }
  return null;
}

export async function GET(request: Request) {
  const blocked = limited(request, "get", 30);
  if (blocked) return blocked;
  if (!hasDatabase()) {
    return NextResponse.json({ error: "Backend storage is not configured (DATABASE_URL missing)." }, { status: 503 });
  }
  try {
    const rows = await listProposals();
    return NextResponse.json({ proposals: rows });
  } catch {
    return NextResponse.json({ error: "Could not read proposals." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const blocked = limited(request, "post", 5);
  if (blocked) return blocked;
  if (!hasDatabase()) {
    return NextResponse.json({ error: "Backend storage is not configured (DATABASE_URL missing)." }, { status: 503 });
  }
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Proposal is too large." }, { status: 413 });
  }
  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Proposal is too large." }, { status: 413 });
  }
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const fromBlock = body.fromBlock != null ? String(body.fromBlock) : "";
  const result = checkProposal({
    title: String(body.title ?? ""),
    blurb: String(body.blurb ?? ""),
    story: String(body.story ?? ""),
    goal: String(body.goal ?? ""),
    deadline: String(body.deadline ?? ""),
    beneficiary: String(body.beneficiary ?? ""),
    fromBlock,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }

  const proposal = result.proposal;
  if (CAMPAIGNS.some((campaign) => campaign.id === proposal.id)) {
    return NextResponse.json({ error: "A live campaign already uses this id — tweak the title." }, { status: 409 });
  }
  try {
    validateAndParseAddress(proposal.beneficiary);
  } catch {
    return NextResponse.json({ error: "Treasury address is not valid." }, { status: 400 });
  }

  try {
    const row = await insertProposal(proposal.id, proposal.title, {
      ...proposal,
      goalWei: proposal.goalWei.toString(),
    });
    return NextResponse.json({
      queued: true,
      unauthenticated: true,
      proposal: row,
      note: "Queued proposals are unauthenticated tips for review, not signed creator claims. A campaign goes live only after a reviewed merge.",
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not store the proposal." }, { status: 500 });
  }
}
