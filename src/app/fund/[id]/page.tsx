"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Shell from "@/components/Shell";
import ConnectButton from "@/components/ConnectButton";
import FeeChip from "@/components/FeeChip";
import Progress from "@/components/Progress";
import ShieldedBalance from "@/components/ShieldedBalance";
import { daysLeft, formatDeadline, getCampaign, isLive, pledgedFraction } from "@/lib/campaigns";
import { explorerTx, makeProvider } from "@/lib/constants";
import { sameAddress } from "@/lib/pool";
import { shortHex, toWei } from "@/lib/format";
import { fetchPledges, sumPledges, type Pledge } from "@/lib/fundIndexer";
import { pledgeCheck, readPoolFeeWei } from "@/lib/pool";
import { starkName } from "@/lib/starkname";
import { invokeActions, withdrawAction } from "@/lib/strk20";
import { buildUpdateTypedData } from "@/lib/updates";
import { useWallet } from "@/store/wallet";

type Tally = { raisedWei: bigint; count: number } | null;

type UpdateRow = {
  seq: number;
  campaign_id: string;
  author: string;
  body: string;
  posted_at: string;
  created_at: string;
};

function UpdateItem({ update }: { update: UpdateRow }) {
  const [name, setName] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    starkName(update.author).then((value) => { if (live) setName(value); }).catch(() => {});
    return () => { live = false; };
  }, [update.author]);

  return (
    <li className="feed" style={{ display: "block" }}>
      <div className="mono" style={{ fontSize: ".68rem", color: "var(--muted)", letterSpacing: ".05em" }}>
        {name ?? shortHex(update.author)} · {new Date(update.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
      </div>
      <div style={{ marginTop: 6, lineHeight: 1.55 }}>{update.body}</div>
    </li>
  );
}

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
  const [pledges, setPledges] = useState<Pledge[] | null>(null);
  const [tallyDown, setTallyDown] = useState(false);

  const [updates, setUpdates] = useState<UpdateRow[]>([]);
  const [updatesDown, setUpdatesDown] = useState(false);
  const [updateBody, setUpdateBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [postNote, setPostNote] = useState("");
  const [receiptHash, setReceiptHash] = useState("");
  const [receipt, setReceipt] = useState<Pledge | null | "none">(null);

  const live = campaign ? isLive(campaign) : false;
  const isOwner = Boolean(live && campaign?.beneficiary && address && sameAddress(address, campaign.beneficiary));

  useEffect(() => {
    let cancelled = true;
    readPoolFeeWei(makeProvider()).then((fee) => { if (cancelled) setFeeWei(fee); }).catch(() => {});
    return () => { cancelled = false; };
  }, []);

  useEffect(() => {
    if (!campaign || !live || !campaign.beneficiary || !campaign.fromBlock) return;
    let cancelled = true;
    setTallyDown(false);
    fetchPledges(makeProvider(), campaign.beneficiary, campaign.fromBlock)
      .then((rows) => {
        if (!cancelled) return;
        const { totalWei, count } = sumPledges(rows);
        setPledges(rows);
        setTally({ raisedWei: totalWei, count });
      })
      .catch(() => { if (!cancelled) setTallyDown(true); });
    return () => { cancelled = false; };
  }, [campaign, live]);

  const loadUpdates = useCallback(async () => {
    if (!campaign) return;
    setUpdatesDown(false);
    try {
      const response = await fetch(`/api/updates?campaign=${encodeURIComponent(campaign.id)}`);
      if (!response.ok) throw new Error(String(response.status));
      const data = await response.json() as { updates: UpdateRow[] };
      setUpdates(data.updates ?? []);
    } catch {
      setUpdatesDown(true);
    }
  }, [campaign]);

  useEffect(() => {
    loadUpdates();
  }, [loadUpdates]);

  async function postUpdate() {
    if (!account || !campaign || !address) return;
    setPosting(true); setPostNote("");
    try {
      const payload = { campaign: campaign.id, body: updateBody.trim(), postedAt: Math.floor(Date.now() / 1000) };
      const signature = await account.signMessage(buildUpdateTypedData(payload));
      const response = await fetch("/api/updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, address, signature }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 201) {
        setUpdateBody("");
        await loadUpdates();
      } else {
        setPostNote(data.error ?? "Could not post the update.");
      }
    } catch (err) {
      setPostNote(err instanceof Error ? err.message : "Signing failed — the update was not posted.");
    } finally {
      setPosting(false);
    }
  }

  function checkReceipt() {
    if (!pledges) { setReceipt("none"); return; }
    const hit = pledges.find((pledge) => pledge.txHash.toLowerCase() === receiptHash.trim().toLowerCase());
    setReceipt(hit ?? "none");
  }

  if (!campaign) {
    return (
      <Shell>
        <section className="panel">
          <p className="eyebrow">PATRON CAMPAIGN</p>
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
          <p className="eyebrow">PATRON CAMPAIGN / {live ? "LIVE" : "PREVIEW"}</p>
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

          <div className="stack" style={{ marginTop: 26 }}>
            <p className="eyebrow" style={{ color: "var(--muted)" }}>VERIFY A PLEDGE RECEIPT</p>
            <p className="fineprint">Backers can prove they supported this campaign by pasting their pledge hash — revealing it is always their choice; otherwise pledges stay anonymous.</p>
            <div className="form-grid">
              <input value={receiptHash} onChange={(event) => setReceiptHash(event.target.value)} placeholder="0x… pledge transaction hash" spellCheck={false} />
              <button className="btn" onClick={checkReceipt} disabled={!receiptHash.trim() || !live || !pledges}>Verify</button>
            </div>
            {receipt === "none" ? <p className="error">Not a pledge to this campaign — check the hash, or the RPC read failed.</p> : null}
            {receipt && receipt !== "none" ? (
              <div className="receipt">
                <b>Verified pledge</b><br />
                {String(receipt.amountWei / 10n ** 18n)} STRK at block #{receipt.block} — <a href={explorerTx(receipt.txHash)} target="_blank" rel="noreferrer">{shortHex(receipt.txHash)} ↗</a>
              </div>
            ) : null}
          </div>

          <div className="stack" style={{ marginTop: 26 }}>
            <p className="eyebrow" style={{ color: "var(--muted)" }}>CAMPAIGN UPDATES</p>
            {updatesDown ? <p className="warning">The updates feed is offline on this deployment — it needs the backend database configured.</p> : null}
            {!updatesDown && updates.length === 0 ? <p className="muted fee-chip">No updates yet.</p> : null}
            {updates.map((update) => <UpdateItem key={update.seq} update={update} />)}
            {isOwner ? (
              <div className="stack" style={{ gap: 12 }}>
                <label>Post an update — signed by the treasury, verified by the backend
                  <textarea rows={3} value={updateBody} onChange={(event) => setUpdateBody(event.target.value)} placeholder="Milestone one shipped: the indexer is live." />
                </label>
                <button className="btn" onClick={postUpdate} disabled={posting || !updateBody.trim()}>{posting ? "Signing…" : "Sign & post update"}</button>
                {postNote ? <p className="error">{postNote}</p> : null}
              </div>
            ) : live ? (
              <p className="fineprint">UPDATES ARE POSTED BY THE TREASURY WALLET ONLY — EVERY ENTRY IS SIGNATURE-VERIFIED AGAINST IT.</p>
            ) : null}
          </div>
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
