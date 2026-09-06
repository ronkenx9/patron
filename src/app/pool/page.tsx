"use client";

import { useState } from "react";
import { validateAndParseAddress } from "starknet";
import Shell from "@/components/Shell";
import ConnectButton from "@/components/ConnectButton";
import FeeChip from "@/components/FeeChip";
import ShieldedBalance from "@/components/ShieldedBalance";
import { explorerTx, makeProvider } from "@/lib/constants";
import { shortHex, toWei } from "@/lib/format";
import { depositAction, invokeActions, tipAction, withdrawAction } from "@/lib/strk20";
import { useWallet } from "@/store/wallet";

type Action = "shield" | "tip" | "unshield";

export default function PoolPage() {
  const { account, address, connected, strk20 } = useWallet();
  const [action, setAction] = useState<Action>("shield");
  const [amount, setAmount] = useState("12");
  const [recipient, setRecipient] = useState("");
  const [tx, setTx] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function run() {
    if (!account || !address) return;
    setBusy(true); setTx(""); setError("");
    try {
      const wei = toWei(amount);
      const target = validateAndParseAddress(recipient.trim() || address);
      const built = action === "shield" ? depositAction(wei) : action === "tip" ? tipAction(wei, target) : withdrawAction(wei, target);
      const result = await invokeActions(account, makeProvider(), [built]);
      setTx(result.txHash);
      if (result.timedOut) setError("Submitted but not confirmed by the RPC yet.");
    } catch (err) { setError(err instanceof Error ? err.message : "Pool action failed."); }
    finally { setBusy(false); }
  }

  return (
    <Shell>
      <div className="appgrid">
        <section className="panel">
          <p className="eyebrow">PROOF BENCH / MAINNET</p>
          <h2 style={{ marginTop: 14 }}>Three pool actions.</h2>
          <p className="section-copy">
            The owner's proof surface for the sprint: shield, private transfer, unshield. Only successful mainnet
            hashes touching the live pool belong in <code>strk20.json</code>.
          </p>
          <div className="stack" style={{ marginTop: 24 }}>
            <FeeChip />
            <div className="seg" role="group" aria-label="Pool action">
              {(["shield", "tip", "unshield"] as Action[]).map((item) => (
                <button className="pill" aria-current={action === item} key={item} onClick={() => setAction(item)}>{item}</button>
              ))}
            </div>
            <label>Amount (STRK)
              <input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" />
            </label>
            {action !== "shield" ? (
              <label>{action === "tip" ? "Creator address" : "Withdrawal destination"}
                <input value={recipient} onChange={(event) => setRecipient(event.target.value)} placeholder="0x…" spellCheck={false} />
              </label>
            ) : (
              <p className="warning">
                Shielding is public at the pool edge, and your wallet will ask <b>twice</b> — the ERC-20 approve, then
                the private deposit. That is expected, not a duplicate. Use dust only, and let notes mature ~10 blocks
                before a private tip.
              </p>
            )}
            {!connected ? <ConnectButton /> : (
              <button className="btn btn-solid btn-lg" disabled={!strk20 || busy} onClick={run}>{busy ? "Proving…" : action}</button>
            )}
            {connected && !strk20 ? <p className="warning">This wallet did not advertise Wallet API ≥ 0.10. PATRON is built for Ready on Starknet mainnet.</p> : null}
            {tx ? <div className="receipt"><b>Submitted</b><br /><a href={explorerTx(tx)} target="_blank" rel="noreferrer">{shortHex(tx)} ↗</a></div> : null}
            {error ? <p className="error">{error}</p> : null}
          </div>
        </section>

        <aside className="rail">
          <div className="railcard">
            <h4>Wallet</h4>
            {!connected ? (
              <>
                <p className="fineprint">No wallet connected. The bench submits through your wallet only.</p>
                <div style={{ marginTop: 12 }}><ConnectButton /></div>
              </>
            ) : (
              <p className="balance-chip"><span className="dot" aria-hidden /> {address ? shortHex(address) : "…"} <em>connected{strk20 ? " · Wallet API ≥ 0.10" : ""}</em></p>
            )}
          </div>
          <div className="railcard">
            <h4>Shielded balance</h4>
            <ShieldedBalance />
            {!connected ? <p className="fineprint" style={{ marginTop: 10 }}>Connect to read it — the wallet answers, PATRON never sees a viewing key.</p> : null}
          </div>
          <div className="railcard">
            <h4>Bench rules</h4>
            <ul className="checklist">
              <li>One action per transaction — same as the sprint's three hashes.</li>
              <li>Deposits and withdrawals are public at the edge; transfers are not.</li>
              <li>A deposit can be declined by onchain screening — that's the protocol, not a bug.</li>
            </ul>
          </div>
        </aside>
      </div>
    </Shell>
  );
}
