"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Shell from "@/components/Shell";
import Progress from "@/components/Progress";
import { formatDeadline, isLive, liveCampaigns, pledgedFraction, type Campaign } from "@/lib/campaigns";
import { makeProvider } from "@/lib/constants";
import { fetchPledges, sumPledges, type PledgeScan } from "@/lib/fundIndexer";

const RAILS = [
  {
    name: "PUBLIC PLEDGE",
    copy: "Withdraw from a shielded balance to the campaign treasury. The amount lands as a pool-to-treasury STRK transfer, so anyone can verify the bar. PATRON does not publish a supporter list. Amount, timing, and the deposit that funded the note stay public — a relayer on tx.from is not proof of untraceability.",
    tag: "COUNTED RECEIPT",
  },
  {
    name: "SILENT GIFT",
    copy: "A plain private transfer to the creator. It is not a qualifying pool receipt, so it never moves the bar. The creator's wallet can see it; PATRON's indexer cannot.",
    tag: "UNCOUNTED",
  },
];

export default function FundPage() {
  const open = liveCampaigns();
  return (
    <Shell>
      <section className="panel" style={{ maxWidth: 900 }}>
        <p className="eyebrow">PATRON CAMPAIGNS / QUALIFYING POOL RECEIPTS</p>
        <h2 style={{ marginTop: 14 }}>Fund what you love.<br />No supporter list.</h2>
        <p className="section-copy" style={{ marginTop: 12 }}>
          A campaign is a goal and a treasury. The progress bar is the sum of STRK transfers from the STRK20 pool to
          that treasury in the campaign's block window — qualifying pool receipts, not unique donors, and not proof of
          intent. PATRON does not publish a supporter list. One live campaign per treasury, so a later withdrawal cannot
          land on two bars.
        </p>
      </section>

      <div className="section-head" style={{ marginBottom: 20, marginTop: 40 }}>
        <p className="eyebrow">OPEN CAMPAIGNS</p>
      </div>
      <div className="stack" style={{ gap: 20 }}>
        {open.map((campaign) => (
          <CampaignCard campaign={campaign} key={campaign.id} />
        ))}
      </div>

      <div className="grid grid-2" style={{ marginBottom: 60, marginTop: 40 }}>
        {RAILS.map((rail) => (
          <article className="card" key={rail.name}>
            <p className="step-tag">{rail.name} · {rail.tag}</p>
            <p style={{ marginTop: 12 }}>{rail.copy}</p>
          </article>
        ))}
      </div>

      <p className="fineprint" style={{ maxWidth: 640, marginTop: 26 }}>
        Keep-what-you-raise: treasuries keep whatever the bar shows, goal or not. All-or-nothing refunds would need
        an escrow contract and are deliberately not in this version. Pledges below the pool fee reach the treasury
        as dust — the form blocks them.
      </p>
    </Shell>
  );
}

function CampaignCard({ campaign }: { campaign: Campaign }) {
  const live = isLive(campaign);
  const [scan, setScan] = useState<PledgeScan | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!live || !campaign.beneficiary || campaign.fromBlock == null) return;
    let cancelled = false;
    setFailed(false);
    fetchPledges(makeProvider(), campaign.beneficiary, campaign.fromBlock, { toBlock: campaign.toBlock })
      .then((next) => {
        if (!cancelled) setScan(next);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [live, campaign.beneficiary, campaign.fromBlock, campaign.toBlock]);

  const raisedWei = scan ? sumPledges(scan.pledges).totalWei : 0n;
  return (
    <Link className="campaign-card" href={`/fund/${campaign.id}`}>
      <div className="campaign-head">
        <h3>{campaign.title}</h3>
        <span className={live ? "badge badge-live" : "badge"}>{live ? "LIVE" : "PREVIEW"}</span>
      </div>
      <p className="section-copy">{campaign.blurb}</p>
      {live ? (
        <>
          {failed ? (
            <p className="warning">The chain read failed, so the bar shows nothing rather than a guess.</p>
          ) : (
            <Progress raisedWei={raisedWei} goalWei={campaign.goalWei} fraction={pledgedFraction(raisedWei, campaign.goalWei)} />
          )}
          {scan?.truncated ? <p className="warning" style={{ marginTop: 10 }}>Partial count — event page cap reached, so this total is incomplete.</p> : null}
        </>
      ) : (
        <p className="fineprint">
          GOAL {campaign.goalWei / 10n ** 18n} STRK · BY {formatDeadline(campaign.deadline)} · TREASURY NOT CONFIGURED — THE OWNER SETS IT BEFORE ANY PLEDGE CAN LAND
        </p>
      )}
      <p className="fineprint" style={{ marginTop: 10 }}>OPEN CAMPAIGN PAGE →</p>
    </Link>
  );
}
