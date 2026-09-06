"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Shell from "@/components/Shell";
import ConnectButton from "@/components/ConnectButton";
import EarningsChart from "@/components/EarningsChart";
import ShieldedBalance from "@/components/ShieldedBalance";
import { CAMPAIGNS, isLive } from "@/lib/campaigns";
import { explorerTx, makeProvider } from "@/lib/constants";
import { shortHex } from "@/lib/format";
import { fetchPledges, type Pledge } from "@/lib/fundIndexer";
import { approxBlocksForDays, cumulativeSeries } from "@/lib/timeseries";
import { useWallet } from "@/store/wallet";

const WINDOWS = [7, 30, 90] as const;

type Earnings = {
  pledges: Pledge[];
  points: ReturnType<typeof cumulativeSeries>;
  fromBlock: number;
  head: number;
};

export default function ProfilePage() {
  const { address, connected, strk20 } = useWallet();
  const [treasury, setTreasury] = useState("");
  const [days, setDays] = useState<(typeof WINDOWS)[number]>(30);
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (connected && address && !treasury) setTreasury(address);
  }, [connected, address, treasury]);

  const load = useCallback(async () => {
    if (!treasury.trim()) return;
    setBusy(true); setError("");
    try {
      const provider = makeProvider();
      const head = await provider.getBlockNumber();
      const fromBlock = Math.max(0, head - approxBlocksForDays(days));
      const [from, to] = await Promise.all([provider.getBlock(fromBlock), provider.getBlock(head)]);
      const pledges = await fetchPledges(provider, treasury.trim(), fromBlock, { maxPages: 10 });
      const points = cumulativeSeries(pledges, {
        fromBlock,
        toBlock: head,
        fromTime: (from as { timestamp: number }).timestamp * 1000,
        toTime: (to as { timestamp: number }).timestamp * 1000,
      });
      setEarnings({ pledges, points, fromBlock, head });
    } catch (err) {
      setEarnings(null);
      setError(err instanceof Error ? err.message : "The chain read failed — reload to retry.");
    } finally {
      setBusy(false);
    }
  }, [treasury, days]);

  useEffect(() => {
    if (connected && treasury.trim()) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, days]);

  const owned = CAMPAIGNS.filter((c) => isLive(c) && address && c.beneficiary && BigInt(c.beneficiary) === BigInt(address));

  return (
    <Shell>
      <div className="appgrid">
        <section className="panel">
          <p className="eyebrow">ACCOUNT / WALLET-NATIVE</p>
          <h2 style={{ marginTop: 14 }}>Your wallet is the login.</h2>
          <p className="section-copy">
            No emails, no passwords, no accounts database. Connecting a wallet signs nothing and stores nothing —
            it only lets this page read public pledge events for treasuries you name, and ask your wallet for your
            own shielded balance on an explicit click.
          </p>

          {!connected ? (
            <div className="stack" style={{ marginTop: 24 }}>
              <p className="warning">Nothing to show yet. Connect a privacy-capable wallet (Ready) — that is the whole login.</p>
              <ConnectButton />
            </div>
          ) : (
            <div className="stack" style={{ marginTop: 24 }}>
              <div className="railcard">
                <h4>Signed in as</h4>
                <p className="balance-chip"><span className="dot" aria-hidden /> {address ? shortHex(address) : "…"} <em>{strk20 ? "Wallet API ≥ 0.10 · SN_MAIN" : "Wallet API ≥ 0.10 not advertised"}</em></p>
              </div>
              <div className="railcard">
                <h4>Shielded balance</h4>
                <ShieldedBalance />
              </div>
              <div className="railcard">
                <h4>Your campaigns</h4>
                {owned.length ? (
                  <ul className="checklist">
                    {owned.map((campaign) => (
                      <li key={campaign.id}><Link href={`/fund/${campaign.id}`} style={{ textDecoration: "underline" }}>{campaign.title}</Link> — live, counting from block {campaign.fromBlock}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="fineprint">None live yet. <Link href="/submit" style={{ textDecoration: "underline" }}>Propose a campaign</Link> — your connected address prefills the treasury.</p>
                )}
              </div>
            </div>
          )}

          {connected ? (
            <div className="stack" style={{ marginTop: 28 }}>
              <p className="eyebrow" style={{ color: "var(--muted)" }}>EARNINGS OVER TIME</p>
              <label>Treasury to inspect — public pledge data, any address
                <input value={treasury} onChange={(event) => setTreasury(event.target.value)} spellCheck={false} />
              </label>
              <div className="quickrow">
                {WINDOWS.map((value) => (
                  <button className="chip" key={value} onClick={() => setDays(value)} style={days === value ? { background: "var(--acid)", borderColor: "var(--ink)" } : undefined}>{value}d</button>
                ))}
                <button className="btn" onClick={load} disabled={busy || !treasury.trim()}>{busy ? "Reading…" : "Refresh"}</button>
              </div>
              {error ? <p className="error">{error}</p> : null}
              {earnings ? (
                <>
                  <EarningsChart points={earnings.points} />
                  <p className="fineprint">
                    POOL → TREASURY SINCE BLOCK #{earnings.fromBlock} (≈{days}D) · HEAD #{earnings.head} · {earnings.pledges.length} PLEDGE{earnings.pledges.length === 1 ? "" : "S"} · TIMESTAMPS INTERPOLATED FROM BLOCKS
                  </p>
                  {earnings.pledges.length ? (
                    <ul className="feed">
                      {[...earnings.pledges].sort((a, b) => b.block - a.block).slice(0, 8).map((pledge) => (
                        <li key={pledge.txHash}>
                          <b>+{String((pledge.amountWei / 10n ** 16n) / 100n)} STRK</b>
                          <span className="mono"> block #{pledge.block}</span>
                          <a href={explorerTx(pledge.txHash)} target="_blank" rel="noreferrer">{shortHex(pledge.txHash)} ↗</a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="muted fee-chip">No pledges in this window. Share the campaign page — the bar only moves when someone pledges.</p>
                  )}
                </>
              ) : busy ? (
                <p className="muted fee-chip">Reading pledges from Starknet mainnet…</p>
              ) : null}
            </div>
          ) : null}
        </section>

        <aside className="rail">
          <div className="railcard">
            <h4>What this page can and cannot see</h4>
            <ul className="checklist">
              <li>Public pledges to any treasury — amounts, timing, tx hashes.</li>
              <li>Your own shielded balance — read by your wallet, only when you click.</li>
              <li>Silent gifts — never. They are invisible even here.</li>
              <li>Nothing is stored: no server, no session, no profile row.</li>
            </ul>
          </div>
          <div className="railcard">
            <h4>Grow your raise</h4>
            <p className="fineprint">
              Ship something worth funding, keep the story honest, and point people at the campaign page — the bar is
              the only marketing that verifies itself. Need a campaign first? <Link href="/submit" style={{ textDecoration: "underline" }}>Propose one</Link>.
            </p>
          </div>
        </aside>
      </div>
    </Shell>
  );
}
