import test from "node:test";
import assert from "node:assert/strict";
import { checkProposal, proposalSnippet, slugify } from "./proposal";
import { approxBlocksForDays, cumulativeSeries, seriesTotal } from "./timeseries";
import { strk } from "./campaigns";

const VALID = {
  title: "Season 03: docs & audits",
  blurb: "Three months of privacy docs, on the house.",
  story: "We write. You read. Nobody knows who paid.\nMilestones every month.",
  goal: "250",
  deadline: new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10),
  beneficiary: "0x049d36570d4e47f9e91d75b3b5ad7d7fe1dea68c8b8a6b0f4b3c9b95e2f0d5c7",
  fromBlock: "14400000",
};

test("accepts a well-formed proposal and normalizes it", () => {
  const result = checkProposal(VALID);
  assert.ok(result.ok);
  if (result.ok) {
    assert.equal(result.proposal.id, "season-03-docs-audits");
    assert.equal(result.proposal.goalWei, strk(250));
    assert.equal(result.proposal.story.length, 2);
    assert.ok(result.proposal.beneficiary.startsWith("0x0"));
  }
});

test("rejects malformed proposals with a usable reason", () => {
  assert.equal(checkProposal({ ...VALID, title: "hi" }).ok, false);
  assert.equal(checkProposal({ ...VALID, goal: "5" }).ok, false);
  assert.equal(checkProposal({ ...VALID, deadline: "2020-01-01" }).ok, false);
  assert.equal(checkProposal({ ...VALID, beneficiary: "not-an-address" }).ok, false);
  assert.equal(checkProposal({ ...VALID, fromBlock: "-3" }).ok, false);
  const empty = checkProposal({ ...VALID, story: "   " });
  assert.equal(empty.ok, false);
});

test("slugs tolerate punctuation and collapse separators", () => {
  assert.equal(slugify("  Hello, WORLD!! "), "hello-world");
  assert.equal(slugify("///"), "campaign");
});

test("renders a paste-ready config snippet", () => {
  const result = checkProposal(VALID);
  assert.ok(result.ok);
  if (result.ok) {
    const snippet = proposalSnippet(result.proposal);
    assert.ok(snippet.includes('id: "season-03-docs-audits"'));
    assert.ok(snippet.includes(`${strk(250)}n`));
    assert.ok(snippet.includes("Nobody knows who paid."));
  }
});

test("cumulative series sorts pledges and anchors both window ends", () => {
  const pledges = [
    { amountWei: strk(30), block: 105, txHash: "0xb" },
    { amountWei: strk(10), block: 95, txHash: "0xa" },
  ];
  const points = cumulativeSeries(pledges, { fromBlock: 90, toBlock: 110, fromTime: 1000, toTime: 3000 });
  assert.equal(points.length, 4);
  assert.equal(points[0].cumWei, 0n);
  assert.equal(seriesTotal(points), strk(40));
  assert.ok(points[1].at < points[2].at);
  assert.ok(points[points.length - 1].cumWei === strk(40));
});

test("series ignores pledges outside the window", () => {
  const pledges = [
    { amountWei: strk(10), block: 80, txHash: "0xearly" },
    { amountWei: strk(20), block: 120, txHash: "0xlate" },
    { amountWei: strk(5), block: 100, txHash: "0xin" },
  ];
  const points = cumulativeSeries(pledges, { fromBlock: 90, toBlock: 110, fromTime: 0, toTime: 100 });
  assert.equal(seriesTotal(points), strk(5));
});

test("block-time approximation", () => {
  assert.equal(approxBlocksForDays(1), 43200);
  assert.equal(approxBlocksForDays(2, 4), 43200);
});
