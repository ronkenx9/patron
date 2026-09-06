import { NextResponse } from "next/server";
import { validateAndParseAddress } from "starknet";
import { checkProposal } from "@/lib/proposal";
import { CAMPAIGNS } from "@/lib/campaigns";
import { hasDatabase, insertProposal, listProposals } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
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
  if (!hasDatabase()) {
    return NextResponse.json({ error: "Backend storage is not configured (DATABASE_URL missing)." }, { status: 503 });
  }
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
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
    return NextResponse.json({ queued: true, proposal: row }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not store the proposal." }, { status: 500 });
  }
}
