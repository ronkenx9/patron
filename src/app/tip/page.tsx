"use client";

import { useState } from "react";
import Shell from "@/components/Shell";
import ConnectButton from "@/components/ConnectButton";
import { explorerTx, makeProvider } from "@/lib/constants";
import { shortHex, toWei } from "@/lib/format";
import { invokeActions, tipAction } from "@/lib/strk20";
import { useWallet } from "@/store/wallet";

export default function TipPage() {
  const { account, address, connected, strk20 } = useWallet();
  const [creator, setCreator] = useState("");
  const [amount, setAmount] = useState("1");
  const [busy, setBusy] = useState(false);
  const [tx, setTx] = useState("");
  const [error, setError] = useState("");

  async function sendTip() {
    if (!account || !creator.trim()) return;
    setBusy(true); setTx(""); setError("");
    try {
      const result = await invokeActions(account, makeProvider(), [tipAction(toWei(amount), creator.trim())]);
      setTx(result.txHash);
      if (result.timedOut) setError("Submitted, but the RPC has not confirmed yet. Keep the hash and check Voyager.");
    } catch (err) { setError(err instanceof Error ? err.message : "Tip failed."); }
    finally { setBusy(false); }
  }

  return <Shell><section className="panel"><p className="eyebrow">FAN / PRIVATE TRANSFER</p><h2>Put support in the pool.</h2><p className="section-copy">This action spends an existing shielded balance. Do not combine a fresh deposit and tip if you want to avoid an obvious pool-edge correlation.</p><div className="stack"><label>Creator wallet address<input value={creator} onChange={(event) => setCreator(event.target.value)} placeholder="0x…" spellCheck={false} /></label><label>Tip amount (STRK)<input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" /></label>{!connected ? <ConnectButton /> : <button className="btn btn-solid" disabled={!strk20 || busy || !address} onClick={sendTip}>{busy ? "Proving…" : "Send private tip"}</button>}{connected && !strk20 ? <p className="warning">This wallet did not advertise Wallet API ≥ 0.10. PATRON is built for Ready on Starknet mainnet.</p> : null}{tx ? <div className="receipt"><b>Tip submitted</b><br /><a href={explorerTx(tx)} target="_blank" rel="noreferrer">{shortHex(tx)}</a></div> : null}{error ? <p className="error">{error}</p> : null}</div></section></Shell>;
}
