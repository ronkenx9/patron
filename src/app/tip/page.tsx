"use client";

import { useEffect, useState } from "react";
import { validateAndParseAddress } from "starknet";
import Shell from "@/components/Shell";
import ConnectButton from "@/components/ConnectButton";
import FeeChip from "@/components/FeeChip";
import ShieldedBalance from "@/components/ShieldedBalance";
import { explorerTx, makeProvider } from "@/lib/constants";
import { shortHex, toWei } from "@/lib/format";
import { readPoolFeeWei, tipCheck } from "@/lib/pool";
import { invokeActions, tipAction } from "@/lib/strk20";
import { useWallet } from "@/store/wallet";

export default function TipPage() {
  const { account, address, connected, strk20 } = useWallet();
  const [creator, setCreator] = useState("");
  const [amount, setAmount] = useState("10");
  const [busy, setBusy] = useState(false);
  const [tx, setTx] = useState("");
  const [error, setError] = useState("");
  const [feeWei, setFeeWei] = useState<bigint | null>(null);

  useEffect(() => {
    let live = true;
    readPoolFeeWei(makeProvider()).then((fee) => { if (live) setFeeWei(fee); }).catch(() => {});
    return () => { live = false; };
  }, []);

  let check: ReturnType<typeof tipCheck> = { level: "ok" };
  try {
    check = tipCheck(toWei(amount), feeWei ?? 0n);
  } catch {
    check = { level: "block", reason: "Enter a valid STRK amount." };
  }

  async function sendTip() {
    if (!account) return;
    setBusy(true); setTx(""); setError("");
    try {
      const recipient = validateAndParseAddress(creator.trim());
      const result = await invokeActions(account, makeProvider(), [tipAction(toWei(amount), recipient)]);
      setTx(result.txHash);
      if (result.timedOut) setError("Submitted, but the RPC has not confirmed yet. Keep the hash and check Voyager.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Tip failed.";
      setError(`${message} If the wallet rejects the transfer, the creator may not be registered with the pool yet — receiving requires one shield with a privacy wallet first.`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell>
      <section className="panel">
        <p className="eyebrow">FAN / PRIVATE TRANSFER</p>
        <h2>Put support in the pool.</h2>
        <p className="section-copy">
          This action spends an existing shielded balance. Do not combine a fresh deposit and tip if you want to avoid
          an obvious pool-edge correlation, and let notes mature ~10 blocks before spending them.
        </p>
        <div className="stack">
          <FeeChip />
          <label>Creator wallet address<input value={creator} onChange={(event) => setCreator(event.target.value)} placeholder="0x…" spellCheck={false} /></label>
          <label>Tip amount (STRK)<input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" /></label>
          {check.level !== "ok" && feeWei !== null ? <p className={check.level === "block" ? "error" : "warning"}>{check.reason}</p> : null}
          {!connected ? <ConnectButton /> : <button className="btn btn-solid" disabled={!strk20 || busy || !address || check.level === "block" || !creator.trim()} onClick={sendTip}>{busy ? "Proving…" : "Send private tip"}</button>}
          {connected ? <ShieldedBalance /> : null}
          {connected && !strk20 ? <p className="warning">This wallet did not advertise Wallet API ≥ 0.10. PATRON is built for Ready on Starknet mainnet.</p> : null}
          {tx ? <div className="receipt"><b>Tip submitted</b><br /><a href={explorerTx(tx)} target="_blank" rel="noreferrer">{shortHex(tx)}</a></div> : null}
          {error ? <p className="error">{error}</p> : null}
        </div>
      </section>
    </Shell>
  );
}
