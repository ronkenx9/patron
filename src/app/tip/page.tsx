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

const QUICK = ["12", "24", "48"];

export default function TipPage() {
  const { account, address, connected, strk20 } = useWallet();
  const [creator, setCreator] = useState("");
  const [amount, setAmount] = useState("12");
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
      <div className="appgrid">
        <section className="panel">
          <p className="eyebrow">FAN / PRIVATE TRANSFER</p>
          <h2 style={{ marginTop: 14 }}>Put support in the pool.</h2>
          <p className="section-copy">
            This action spends an existing shielded balance. Keep the tip well above the pool fee, and let notes
            mature ~10 blocks before spending them.
          </p>
          <div className="stack" style={{ marginTop: 24 }}>
            <FeeChip />
            <label>Creator wallet address
              <input value={creator} onChange={(event) => setCreator(event.target.value)} placeholder="0x…" spellCheck={false} />
            </label>
            <label>Tip amount (STRK)
              <input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" />
            </label>
            <div className="quickrow">
              {QUICK.map((value) => (
                <button className="chip" key={value} onClick={() => setAmount(value)}>{value} STRK</button>
              ))}
            </div>
            {check.level !== "ok" && feeWei !== null ? <p className={check.level === "block" ? "error" : "warning"}>{check.reason}</p> : null}
            {!connected ? <ConnectButton /> : (
              <button className="btn btn-solid btn-lg" disabled={!strk20 || busy || !address || check.level === "block" || !creator.trim()} onClick={sendTip}>
                {busy ? "Proving…" : "Send private tip"}
              </button>
            )}
            {connected && !strk20 ? <p className="warning">This wallet did not advertise Wallet API ≥ 0.10. PATRON is built for Ready on Starknet mainnet.</p> : null}
            {tx ? <div className="receipt"><b>Tip submitted</b><br /><a href={explorerTx(tx)} target="_blank" rel="noreferrer">{shortHex(tx)} ↗</a></div> : null}
            {error ? <p className="error">{error}</p> : null}
          </div>
        </section>

        <aside className="rail">
          <div className="railcard">
            <h4>Wallet</h4>
            {!connected ? (
              <>
                <p className="fineprint">No wallet connected. PATRON asks your wallet to prove and submit — it never holds keys.</p>
                <div style={{ marginTop: 12 }}><ConnectButton /></div>
              </>
            ) : (
              <p className="balance-chip"><span className="dot" aria-hidden /> {address ? shortHex(address) : "…"} <em>connected{strk20 ? " · Wallet API ≥ 0.10" : ""}</em></p>
            )}
          </div>
          <div className="railcard">
            <h4>Shielded balance</h4>
            <ShieldedBalance />
            {!connected ? <p className="fineprint" style={{ marginTop: 10 }}>Connect to read your balance — the wallet answers, PATRON never sees a viewing key.</p> : null}
          </div>
          <div className="railcard">
            <h4>Before you tip</h4>
            <ul className="checklist">
              <li>Shielding is public. Don't shield and tip in the same breath.</li>
              <li>Fresh notes mature ~10 blocks before they can be spent.</li>
              <li>The recipient must be pool-registered, or the wallet declines.</li>
              <li>The flat pool fee is charged on top of the pool's rules — size the tip accordingly.</li>
            </ul>
          </div>
        </aside>
      </div>
    </Shell>
  );
}
