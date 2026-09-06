import test from "node:test";
import assert from "node:assert/strict";
import { POOL_FEE_FALLBACK_WEI, readPoolFeeWei, sameAddress, tipCheck } from "./pool";
import { STRK_ADDRESS } from "./constants";
import { fromWei } from "./format";

function fakeProvider(result: string[] | Error) {
  return {
    callContract: async () => {
      if (result instanceof Error) throw result;
      return result;
    },
  };
}

test("reads the live pool fee from get_fee_amount", async () => {
  const fee = await readPoolFeeWei(fakeProvider(["0x53444835ec580000"]) as never);
  assert.equal(fee, 6n * 10n ** 18n);
  assert.equal(fromWei(fee), "6");
});

test("falls back to the flat fee when the pool returns zero", async () => {
  const fee = await readPoolFeeWei(fakeProvider(["0x0"]) as never);
  assert.equal(fee, POOL_FEE_FALLBACK_WEI);
});

test("tip check blocks amounts at or below the pool fee", () => {
  const fee = 6n * 10n ** 18n;
  assert.equal(tipCheck(fee, fee).level, "block");
  assert.equal(tipCheck(fee - 1n, fee).level, "block");
});

test("tip check warns between one and two fees and passes above that", () => {
  const fee = 6n * 10n ** 18n;
  assert.equal(tipCheck(7n * 10n ** 18n, fee).level, "warn");
  assert.equal(tipCheck(12n * 10n ** 18n, fee).level, "ok");
});

test("address comparison is spelling-independent", () => {
  assert.ok(sameAddress(STRK_ADDRESS, "0x4718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d"));
  assert.ok(!sameAddress(STRK_ADDRESS, "0x123"));
  assert.ok(!sameAddress("not-an-address", "0x123"));
});
