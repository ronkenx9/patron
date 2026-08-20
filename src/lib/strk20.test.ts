import test from "node:test";
import assert from "node:assert/strict";
import { aggregateBook, depositAction, tipAction } from "./strk20";

test("builds a STRK20 deposit action", () => {
  assert.deepEqual(depositAction(1_000_000_000_000_000_000n), {
    type: "deposit",
    token: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
    amount: "0xde0b6b3a7640000",
  });
});

test("builds a private creator tip action", () => {
  const action = tipAction(250_000_000_000_000_000n, "0x123");
  assert.equal(action.type, "transfer");
  if (action.type === "transfer") assert.equal(action.recipient, "0x123");
});

test("aggregate book exposes count and total, not individual lines", () => {
  assert.deepEqual(aggregateBook([{ amountWei: 2n }, { amountWei: 3n }]), {
    creator: "@kenn",
    supporters: 2,
    aggregateWei: 5n,
  });
});
