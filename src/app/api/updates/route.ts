import { NextResponse } from "next/server";
import { verifyMessageInStarknet, type ProviderInterface, type Signature } from "starknet";
import { CAMPAIGNS } from "@/lib/campaigns";
import { makeProvider } from "@/lib/constants";
import { hasDatabase, insertUpdate, listUpdates } from "@/lib/store";
import { buildUpdateTypedData, validateUpdateInput } from "@/lib/updates";

export const dynamic = "force-dynamic";

const knownIds = CAMPAIGNS.map((campaign) => campaign.id);

export async function GET(request: Request) {
  if (!hasDatabase()) {
    return NextResponse.json({ error: "Backend storage is not configured (DATABASE_URL missing)." }, { status: 503 });
  }
  const campaign = new URL(request.url).searchParams.get("campaign") ?? "";
  if (!knownIds.includes(campaign)) {
    return NextResponse.json({ error: "Unknown campaign." }, { status: 404 });
  }
  try {
    const rows = await listUpdates(campaign);
    return NextResponse.json({ updates: rows });
  } catch {
    return NextResponse.json({ error: "Could not read updates." }, { status: 500 });
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

  const check = validateUpdateInput({
    campaign: body.campaign,
    body: body.body,
    postedAt: body.postedAt,
    address: body.address,
    signature: body.signature,
    knownCampaigns: knownIds,
  });
  if (!check.ok) {
    return NextResponse.json({ error: check.reason }, { status: 400 });
  }

  const campaign = CAMPAIGNS.find((c) => c.id === check.payload.campaign)!;
  if (!campaign.beneficiary) {
    return NextResponse.json({ error: "Campaign has no treasury to verify against." }, { status: 409 });
  }

  // The server rebuilds the typed data from the posted fields and checks the
  // signature recovers to the treasury — the author is the treasury, period.
  try {
    const provider: ProviderInterface = makeProvider();
    const valid = await verifyMessageInStarknet(
      provider,
      buildUpdateTypedData(check.payload),
      body.signature as Signature,
      campaign.beneficiary,
    );
    if (!valid) {
      return NextResponse.json({ error: "Signature does not match the campaign treasury." }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ error: "Signature verification failed against the chain." }, { status: 401 });
  }

  try {
    const row = await insertUpdate(check.payload.campaign, campaign.beneficiary, check.payload.body, check.payload.postedAt, body.signature);
    return NextResponse.json({ posted: true, update: row }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not store the update." }, { status: 500 });
  }
}
