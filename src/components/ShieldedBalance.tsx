"use client";

import { useState } from "react";
import { STRK_ADDRESS } from "@/lib/constants";
import { fromWei } from "@/lib/format";
import { useWallet } from "@/store/wallet";

// Balance reads are consent-gated in the wallet, so the read fires only on an
// explicit click — never on page load or connect.
export default function ShieldedBalance() {
  const { account, connected, strk20 } = useWallet();
  const [balance, setBalance] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function read() {
    if (!account) return;
    setBusy(true); setError(""); setBalance(null);
    try {
      const entries = await account.strk20Balances([STRK_ADDRESS]);
      const entry = entries.find((item) => BigInt(item.token) === BigInt(STRK_ADDRESS)) ?? entries[0];
      setBalance(entry ? fromWei(BigInt(entry.balance)) : "0");
    } catch (err) {
      setError(err instanceof Error ? err.message : "The wallet declined the balance read.");
    } finally {
      setBusy(false);
    }
  }

  if (!connected) return null;

  return (
    <div className="balance-chip">
      {balance === null ? (
        <button className="pill" onClick={read} disabled={!strk20 || busy}>
          {busy ? "Asking wallet…" : "Show my shielded balance"}
        </button>
      ) : (
        <span>Shielded balance: <b>{balance} STRK</b> <em>(read by your wallet; includes every inflow, not only tips)</em></span>
      )}
      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}
