// Campaign updates are signed with the treasury's own wallet, so the backend
// can verify authorship without holding any keys: the server rebuilds this
// exact typed data from the posted fields and checks the signature recovers
// to the campaign's beneficiary address.
import type { TypedData } from "starknet";

export const UPDATE_DOMAIN = {
  name: "PATRON",
  version: "1",
  chainId: "0x534e5f4d41494e",
  revision: "1",
};

export const UPDATE_TYPES: Record<string, { name: string; type: string }[]> = {
  StarknetDomain: [
    { name: "name", type: "shortstring" },
    { name: "version", type: "shortstring" },
    { name: "chainId", type: "felt" },
    { name: "revision", type: "shortstring" },
  ],
  PatronUpdate: [
    { name: "action", type: "shortstring" },
    { name: "campaign", type: "ByteArray" },
    { name: "body", type: "ByteArray" },
    { name: "postedAt", type: "felt" },
  ],
};

export const UPDATE_ACTION = "campaign-update";
export const MAX_UPDATE_BODY = 2000;

export type UpdatePayload = {
  campaign: string;
  body: string;
  postedAt: number;
};

export function buildUpdateTypedData(payload: UpdatePayload): TypedData {
  return {
    types: UPDATE_TYPES,
    primaryType: "PatronUpdate",
    domain: UPDATE_DOMAIN,
    message: {
      action: UPDATE_ACTION,
      campaign: payload.campaign,
      body: payload.body,
      postedAt: payload.postedAt,
    },
  };
}

export type UpdateCheck = { ok: true; payload: UpdatePayload } | { ok: false; reason: string };

export function validateUpdateInput(input: {
  campaign?: unknown;
  body?: unknown;
  postedAt?: unknown;
  address?: unknown;
  signature?: unknown;
  knownCampaigns: string[];
}): UpdateCheck {
  const campaign = typeof input.campaign === "string" ? input.campaign.trim() : "";
  const body = typeof input.body === "string" ? input.body.trim() : "";
  const postedAt = Number(input.postedAt);
  const address = typeof input.address === "string" ? input.address.trim() : "";

  if (!campaign) return { ok: false, reason: "Missing campaign id." };
  if (!input.knownCampaigns.includes(campaign)) return { ok: false, reason: "Unknown campaign." };
  if (!body) return { ok: false, reason: "Empty update." };
  if (body.length > MAX_UPDATE_BODY) return { ok: false, reason: `Update too long (max ${MAX_UPDATE_BODY} chars).` };
  if (!Number.isFinite(postedAt)) return { ok: false, reason: "Bad timestamp." };
  const now = Math.floor(Date.now() / 1000);
  if (postedAt < now - 3600 || postedAt > now + 600) return { ok: false, reason: "Timestamp is too far from server time." };
  if (!address) return { ok: false, reason: "Missing author address." };
  if (!input.signature) return { ok: false, reason: "Missing signature." };
  return { ok: true, payload: { campaign, body, postedAt } };
}
