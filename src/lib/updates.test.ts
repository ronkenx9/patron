import test from "node:test";
import assert from "node:assert/strict";
import { buildUpdateTypedData, MAX_UPDATE_BODY, validateUpdateInput } from "./updates";
import { formatStarkName } from "./starkname";

const KNOWN = ["season-two"];

function validInput() {
  return {
    campaign: "season-two",
    body: "Milestone one shipped: the indexer is live.",
    postedAt: Math.floor(Date.now() / 1000),
    address: "0x1234",
    signature: ["0xabc", "0xdef"],
    knownCampaigns: KNOWN,
  };
}

test("accepts a well-formed update payload", () => {
  const result = validateUpdateInput(validInput());
  assert.ok(result.ok);
  if (result.ok) {
    assert.equal(result.payload.campaign, "season-two");
    assert.equal(result.payload.body.length, "Milestone one shipped: the indexer is live.".length);
  }
});

test("rejects unknown campaigns, empty or oversized bodies, and stale timestamps", () => {
  assert.equal(validateUpdateInput({ ...validInput(), campaign: "nope", knownCampaigns: KNOWN }).ok, false);
  assert.equal(validateUpdateInput({ ...validInput(), body: "   " }).ok, false);
  assert.equal(validateUpdateInput({ ...validInput(), body: "x".repeat(MAX_UPDATE_BODY + 1) }).ok, false);
  const stale = validInput();
  stale.postedAt = Math.floor(Date.now() / 1000) - 7200;
  assert.equal(validateUpdateInput(stale).ok, false);
  assert.equal(validateUpdateInput({ ...validInput(), signature: undefined }).ok, false);
});

test("typed data is deterministic and binds every field", () => {
  const payload = { campaign: "season-two", body: "hello", postedAt: 1700000000 };
  const a = JSON.stringify(buildUpdateTypedData(payload));
  const b = JSON.stringify(buildUpdateTypedData(payload));
  assert.equal(a, b);
  const typed = buildUpdateTypedData(payload);
  assert.equal(typed.primaryType, "PatronUpdate");
  const message = typed.message as Record<string, unknown>;
  assert.equal(message.action, "campaign-update");
  assert.equal((typed.domain as { chainId: string }).chainId, "0x534e5f4d41494e");
  assert.ok(JSON.stringify(typed).includes("hello"));
});

test("stark names render with the .stark suffix exactly once", () => {
  assert.equal(formatStarkName("kenn"), "kenn.stark");
  assert.equal(formatStarkName("kenn.stark"), "kenn.stark");
});
