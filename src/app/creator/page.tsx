"use client";

import Shell from "@/components/Shell";
import ConnectButton from "@/components/ConnectButton";
import ShieldedBalance from "@/components/ShieldedBalance";
import { useWallet } from "@/store/wallet";

export default function CreatorPage() {
  const { connected } = useWallet();

  return (
    <Shell>
      <section className="panel">
        <p className="eyebrow">CREATOR / AGGREGATE-ONLY BOOK</p>
        <h2>@kenn</h2>
        <p className="section-copy">
          A public thank-you page that does not publish a supporter list. Tips inside the pool are not visible to any
          indexer, so the honest live number is the one your own wallet can read: your shielded balance.
        </p>
        <div className="book">
          <div className="metric">
            <div className="metric-label">Supporters</div>
            <div className="metric-value">02</div>
            <div className="metric-sub">self-reported</div>
          </div>
          <div className="metric">
            <div className="metric-label">Aggregate received</div>
            <div className="metric-value">{connected ? "wallet read" : "3 STRK"}</div>
            <div className="metric-sub">{connected ? "click below" : "demo fixture"}</div>
          </div>
        </div>
        <div className="stack" style={{ marginTop: 20 }}>
          {!connected ? <ConnectButton /> : <ShieldedBalance />}
          <p className="warning">
            Supporter count is self-reported and the unconnected figure is a demo fixture — neither is derived from
            chain data, because private transfers are invisible by design. The shielded balance is read by your wallet
            and covers every inflow, not only tips.
          </p>
        </div>
      </section>
    </Shell>
  );
}
