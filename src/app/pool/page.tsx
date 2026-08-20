"use client";

import { useState } from "react";
import Shell from "@/components/Shell";
import ConnectButton from "@/components/ConnectButton";
import { explorerTx, makeProvider } from "@/lib/constants";
import { shortHex, toWei } from "@/lib/format";
import { depositAction, invokeActions, tipAction, withdrawAction } from "@/lib/strk20";
import { useWallet } from "@/store/wallet";

type Action = "shield" | "tip" | "unshield";

export default function PoolPage() {
  const { account, address, connected, strk20 } = useWallet();
  const [action, setAction] = useState<Action>("shield");
  const [amount, setAmount] = useState("0.1");
  const [recipient, setRecipient] = useState("");
  const [tx, setTx] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function run() {
    if (!account || !address) return;
    setBusy(true); setTx(""); setError("");
    try {
      const wei = toWei(amount);
      const target = recipient.trim() || address;
      const built = action === "shield" ? depositAction(wei) : action === "tip" ? tipAction(wei, target) : withdrawAction(wei, target);
      const result = await invokeActions(account, makeProvider(), [built]);
      setTx(result.txHash);
      if (result.timedOut) setError("Submitted but not confirmed by the RPC yet.");
    } catch (err) { setError(err instanceof Error ? err.message : "Pool action failed."); }
    finally { setBusy(false); }
  }

  return <Shell><section className="panel"><p className="eyebrow">PROOF BENCH / MAINNET</p><h2>Three pool actions.</h2><p className="section-copy">This is the owner’s proof surface for the sprint: shield, private transfer, unshield. Only successful mainnet hashes touching the live pool belong in <code>strk20.json</code>.</p><div className="actions">{(["shield", "tip", "unshield"] as Action[]).map((item) => <button className="pill" aria-current={action === item} key={item} onClick={() => setAction(item)}>{item}</button>)}</div><div className="stack" style={{ marginTop: 20 }}><label>Amount (STRK)<input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" /></label>{action !== "shield" ? <label>{action === "tip" ? "Creator address" : "Withdrawal destination"}<input value={recipient} onChange={(event) => setRecipient(event.target.value)} placeholder="0x…" spellCheck={false} /></label> : <p className="warning">Shielding is public at the pool edge. Use dust only, and allow notes to mature before a private tip.</p>}{!connected ? <ConnectButton /> : <button className="btn btn-solid" disabled={!strk20 || busy} onClick={run}>{busy ? "Proving…" : action}</button>}{tx ? <div className="receipt"><b>Submitted</b><br /><a href={explorerTx(tx)} target="_blank" rel="noreferrer">{shortHex(tx)}</a></div> : null}{error ? <p className="error">{error}</p> : null}</div></section></Shell>;
}
