"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Shell from "@/components/Shell";
import ConnectButton from "@/components/ConnectButton";
import FeeChip from "@/components/FeeChip";
import Progress from "@/components/Progress";
import ShieldedBalance from "@/components/ShieldedBalance";
import { daysLeft, formatDeadline, getCampaign, isLive, pledgedFraction } from "@/lib/campaigns";
import { explorerTx, makeProvider } from "@/lib/constants";
import { shortHex, toWei } from "@/lib/format";
import { fetchPledges, sumPledges } from "@/lib/fundIndexer";
import { pledgeCheck, readPoolFeeWei } from "@/lib/pool";
import { invokeActions, withdrawAction } from "@/lib/strk20";
import { useWallet } from "@/store/wallet";

type Tally = { raisedWei: bigint; count: number } | null;

export default function CampaignPage() {
  const params = useParams<{ id: string }>();
  const campaign = getCampaign(typeof params.id === "string" ? params.id : "");
  const { account, address, connected, strk20 } = useWallet();
  const [amount, setAmount] = useState("25");
  const [busy, setBusy] = useState(false);
  const [tx, setTx] = useState("");
  const [error, setError] = useState("");
  const [feeWei, setFeeWei] = useState<bigint | null>(null);
  const [tally, setTally] = useState<Tally>(null);
  const [tallyDown, setTallyDown] = useState(false);

  const live = campaign ? isLive(campaign) : false;

  useEffect(() => {
    let cancelled = false;
    readPoolFeeWei(makeProvider()).then((fee) => { if (!cancelled) setFeeWei(fee); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!campaign || !live || !campaign.beneficiary || !campaign.fromBlock) return;
    let cancelled = false;
    setTallyDown(false);
    fetchPledges(makeProvider(), campaign.beneficiary, campaign.fromBlock)
      .then((pledges) => {
        if (cancelled) return;
        const { totalWei, count } = sumPledges(pledges);
        setTally({ raisedWei: totalWei, count });
      })
      .catch(() => { if (!cancelled) setTallyDown(true); });
    return () => { cancelled = true; };
  }, [campaign, live]);

  if (!campaign) {
    return (
      <Shell>
        <section className="panel">
          <p className="eyebrow">CROWDFUND</p>
          <h2 style={{ marginTop: 14 }}>No such campaign.</h2>
          <p className="section-copy">The campaign list lives at <Link href="/fund" style={{ textDecoration: "underline" }}>/fund</Link>.</p>
        </section>
      </Shell>
    );
  }

  let check: ReturnType<typeof pledgeCheck> = { level: "ok" };
  try {
    check = pledgeCheck(toWei(amount), feeWei ?? 0n);
  } catch {
    check = { level: "block", reason: "Enter a valid STRK amount." };
  }

  async function pledge() {
    if (!account || !campaign?.beneficiary) return;
    setBusy(true); setTx(""); setError("");
    try {
      const result = await invokeActions(account, makeProvider(), [withdrawAction(toWei(amount), campaign.beneficiary!)]);
      setTx(result.txHash);
      if (result.timedOut) setError("Submitted, but the RPC has not confirmed yet. Keep the hash and check Voyager.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pledge failed.");
    } finally {
      setBusy(false);
    }
  }

  const raised = tally?.raisedWei ?? 0n;
  const left = daysLeft(campaign.deadline);

  return (
    <Shell>
      <div className="appgrid">
        <section className="panel">
          <p className="eyebrow">CROWDFUND / {live ? "LIVE" : "PREVIEW"}</p>
          <h2 style={{ marginTop: 14 }}>{campaign.title}</h2>
          {campaign.story.map((paragraph) => (
            <p className="section-copy" style={{ marginTop: 14 }} key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
          <div className="progress-block" style={{ marginTop: 24 }}>
            {live && tally ? (
              <Progress raisedWei={raised} goalWei={campaign.goalWei} fraction={pledgedFraction(raised, campaign.goalWei)} />
            ) : live && tallyDown ? (
              <p className="warning">The chain read failed, so the bar shows nothing rather than a guess. Reload to retry.</p>
            ) : live ? (
              <p className="muted fee-chip">Counting pledges from Starknet mainnet…</p>
            ) : (
              <Progress raisedWei={0n} goalWei={campaign.goalWei} fraction={0} />
            )}
          </div>
          <p className="fineprint" style={{ marginTop: 14 }}>
            RAISED FROM {tally?.count ?? 0} PUBLIC PLEDGE{tally?.count === 1 ? "" : "S"} · GOAL {campaign.goalWei / 10n ** 18n} STRK · BY {formatDeadline(campaign.deadline)}{left !== null && live ? ` · ${left} DAY${left === 1 ? "" : "S"} LEFT` : ""}
          </p>
          <p className="fineprint" style={{ marginTop: 8 }}>
            THE BAR READS STRK TRANSFER EVENTS FROM THE POOL TO THE TREASURY. PLEDGE COUNTS COUNT TRANSACTIONS, NOT PEOPLE — ONE WALLET CAN PLEDGE TWICE, AND NOBODY CAN PROVE OTHERWISE.
          </p>
        </section>

        <aside className="rail">
          <div className="railcard">
            <h4>{live ? "Pledge from your shielded balance" : "Preview — treasury not configured"}</h4>
            {!live ? (
              <p className="fineprint">
                This campaign is a preview. The owner must name the treasury address and the block to start counting
                from before any pledge can land — until then the form stays off, on purpose.
              </p>
            ) : (
              <div className="stack" style={{ gap: 14, marginTop: 6 }}>
                <FeeChip />
                <label>Pledge amount (STRK)
                  <input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" />
                </label>
                {check.level !== "ok" && feeWei !== null ? <p className={check.level === "block" ? "error" : "warning"}>{check.reason}</p> : null}
                {!connected ? <ConnectButton /> : (
                  <button className="btn btn-solid btn-lg" disabled={!strk20 || busy || check.level === "block"} onClick={pledge}>
                    {busy ? "Proving…" : "Pledge publicly"}
                  </button>
                )}
                {connected ? <ShieldedBalance /> : null}
                {tx ? <div className="receipt"><b>Pledge submitted</b><br /><a href={explorerTx(tx)} target="_blank" rel="noreferrer">{shortHex(tx)} ↗</a></div> : null}
                {error ? <p className="error">{error}</p> : null}
              </div>
            )}
          </div>

          <div className="railcard">
            <h4>Prefer to stay off the bar?</h4>
            <p className="fineprint">
              Send a <Link href="/tip" style={{ textDecoration: "underline" }}>silent gift</Link> — a plain private
              transfer to the creator. It never shows in the bar, and that is the point.
            </p>
          </div>

          <div className="railcard">
            <h4>What a pledge reveals</h4>
            <ul className="checklist">
              <li>Amount: public — that is what makes the bar verifiable.</li>
              <li>Backer: nothing. The chain never learns your address.</li>
              <li>Timing: public, like every pool-edge interaction.</li>
              <li>Keep-what-you-raise: no escrow, no refund path in this version.</li>
            </ul>
          </div>
        </aside>
      </div>
    </Shell>
  );
}
