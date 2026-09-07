import test from "node:test";
import assert from "node:assert/strict";
import { coverageFromPages, decodeU256, pledgeFromEvent, pledgesInWindow, sumPledges } from "./fundIndexer";
import {
  CAMPAIGNS,
  daysLeft,
  getCampaign,
  inCampaignWindow,
  isClosed,
  isLive,
  liveCampaigns,
  liveTreasuryConflicts,
  overlappingAttributions,
  pledgedFraction,
  strk,
  type Campaign,
} from "./campaigns";
import { pledgeCheck } from "./pool";
import { resetRateLimit, takeToken } from "./ratelimit";

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

test("only one live campaign, and it does not share an open treasury window", () => {
  assert.equal(CAMPAIGNS.length, 2);
  const season = getCampaign("season-two");
  const night = getCampaign("night-school");
  assert.ok(season);
  assert.ok(night);
  assert.equal(isClosed(season), true);
  assert.equal(isLive(season), false);
  assert.equal(isLive(night), true);
  assert.equal(liveCampaigns().length, 1);
  assert.equal(liveCampaigns()[0]?.id, "night-school");
  assert.deepEqual(liveTreasuryConflicts(), []);
  assert.deepEqual(overlappingAttributions(), []);
  assert.equal(getCampaign("nope"), undefined);
  assert.ok(daysLeft(night.deadline) !== null);
});

test("one withdrawal cannot increase two independent campaign totals", () => {
  const treasury = "0x02da976cd4fc7689541d66612491ec49de859f97556c60933407bbd85be0c86f";
  const overlapping: Campaign[] = [
    { id: "a", title: "A", blurb: "long enough", story: ["s"], goalWei: strk(80), deadline: "2026-10-31T00:00:00Z", beneficiary: treasury, fromBlock: 100 },
    { id: "b", title: "B", blurb: "long enough", story: ["s"], goalWei: strk(80), deadline: "2026-10-31T00:00:00Z", beneficiary: treasury, fromBlock: 150 },
  ];
  assert.equal(liveTreasuryConflicts(overlapping).length, 1);
  assert.equal(overlappingAttributions(overlapping).length, 1);

  const split: Campaign[] = [
    { ...overlapping[0]!, toBlock: 150 },
    overlapping[1]!,
  ];
  assert.equal(liveTreasuryConflicts(split).length, 0);
  assert.equal(overlappingAttributions(split).length, 0);

  const withdrawal = { amountWei: strk(8), block: 14519102, txHash: "0x4a45" };
  const earlier = { amountWei: strk(8), block: 14517393, txHash: "0xbda1" };
  const season = getCampaign("season-two")!;
  const night = getCampaign("night-school")!;
  assert.equal(inCampaignWindow(withdrawal.block, night), true);
  assert.equal(inCampaignWindow(withdrawal.block, season), false);
  assert.equal(inCampaignWindow(earlier.block, night), false);
  assert.equal(inCampaignWindow(earlier.block, season), true);

  const both = [earlier, withdrawal];
  assert.equal(sumPledges(pledgesInWindow(both, night)).totalWei, strk(8));
  assert.equal(sumPledges(pledgesInWindow(both, season)).totalWei, strk(8));
  assert.equal(sumPledges(pledgesInWindow(both, night)).totalWei + sumPledges(pledgesInWindow(both, season)).totalWei, strk(16));
});

test("a page cap with a continuation token is a partial scan, not a complete total", () => {
  assert.deepEqual(coverageFromPages(10, 10, "next"), { complete: false, truncated: true });
  assert.deepEqual(coverageFromPages(3, 10, undefined), { complete: true, truncated: false });
});

test("ingress rate limit trips after the window max", () => {
  resetRateLimit();
  const opts = { windowMs: 60_000, max: 3, now: 1_000 };
  assert.equal(takeToken("ip", opts), true);
  assert.equal(takeToken("ip", { ...opts, now: 1_001 }), true);
  assert.equal(takeToken("ip", { ...opts, now: 1_002 }), true);
  assert.equal(takeToken("ip", { ...opts, now: 1_003 }), false);
  assert.equal(takeToken("other", { ...opts, now: 1_003 }), true);
  assert.equal(takeToken("ip", { ...opts, now: 61_003 }), true);
});

test("pledge check mirrors tip check wording for treasuries", () => {
  assert.equal(pledgeCheck(FEE, FEE).level, "block");
  assert.equal(pledgeCheck(7n * 10n ** 18n, FEE).level, "warn");
  assert.equal(pledgeCheck(50n * 10n ** 18n, FEE).level, "ok");
});
