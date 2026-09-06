import test from "node:test";
import assert from "node:assert/strict";
import { decodeU256, pledgeFromEvent, sumPledges } from "./fundIndexer";
import { daysLeft, getCampaign, isLive, pledgedFraction, strk, CAMPAIGNS } from "./campaigns";
import { pledgeCheck } from "./pool";

const FEE = 6n * 10n ** 18n;

test("decodes a u256 transfer amount from the live event shape", () => {
  // Real mainnet event sampled from the pool's fee sweep: value 6 STRK.
  assert.equal(decodeU256("0x53444835ec580000", "0x0"), FEE);
  assert.equal(decodeU256("0xffffffffffffffffffffffffffffffff", "0x1"), (1n << 128n) + 0xffffffffffffffffffffffffffffffffn);
});

test("parses a pledge from a pool-to-treasury Transfer event", () => {
  const event = {
    keys: [
      "0x99cd8bde557814842a3121e8ddfd433a539b8c9f14bf31ebf108d12e6196e9",
      "0x40337b1af3c663e86e333bab5a4b28da8d4652a15a69beee2b677776ffe812a",
      "0x7261a4cab49fea45849a52f96ac0b7cddff9fbd0b0b06e9d3f0e8a4c05aa1d4",
    ],
    data: ["0xde0b6b3a7640000", "0x0"],
    block_number: 14_500_000,
    transaction_hash: "0xabc",
  };
  const pledge = pledgeFromEvent(event);
  assert.ok(pledge);
  assert.equal(pledge.amountWei, strk(1));
  assert.equal(pledge.block, 14_500_000);
});

test("rejects events that are not pool-to-treasury transfers", () => {
  const base = {
    keys: ["0x99", "0x40337b1af3c663e86e333bab5a4b28da8d4652a15a69beee2b677776ffe812a", "0xabc"],
    data: ["0x1", "0x0"],
    block_number: 1,
    transaction_hash: "0xabc",
  };
  assert.equal(pledgeFromEvent({ ...base, keys: base.keys.slice(0, 2) }), null);
  assert.equal(pledgeFromEvent({ ...base, keys: ["0x99", "0x999", "0xabc"] }), null);
  assert.equal(pledgeFromEvent({ ...base, data: ["0x1"] }), null);
});

test("sums pledges into a total, a count, and the last block", () => {
  const { totalWei, count, lastBlock } = sumPledges([
    { amountWei: strk(12), block: 100, txHash: "0xa" },
    { amountWei: strk(24), block: 90, txHash: "0xb" },
    { amountWei: strk(6), block: 120, txHash: "0xc" },
  ]);
  assert.equal(totalWei, strk(42));
  assert.equal(count, 3);
  assert.equal(lastBlock, 120);
});

test("progress math caps at the goal", () => {
  assert.equal(pledgedFraction(strk(50), strk(500)), 0.1);
  assert.equal(pledgedFraction(strk(999), strk(500)), 1);
  assert.equal(pledgedFraction(strk(50), 0n), 0);
});

test("the demo campaign is a preview until the owner names a treasury", () => {
  assert.equal(CAMPAIGNS.length, 1);
  const campaign = getCampaign("season-two");
  assert.ok(campaign);
  assert.equal(isLive(campaign), false);
  assert.equal(getCampaign("nope"), undefined);
  assert.ok(daysLeft(campaign.deadline) !== null);
});

test("pledge check mirrors tip check wording for treasuries", () => {
  assert.equal(pledgeCheck(FEE, FEE).level, "block");
  assert.equal(pledgeCheck(7n * 10n ** 18n, FEE).level, "warn");
  assert.equal(pledgeCheck(50n * 10n ** 18n, FEE).level, "ok");
});
