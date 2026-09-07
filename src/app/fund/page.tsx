"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import Shell from "@/components/Shell";
import Progress from "@/components/Progress";
import { formatDeadline, isLive, liveCampaigns, pledgedFraction, type Campaign } from "@/lib/campaigns";
import { makeProvider } from "@/lib/constants";
import { fetchPledges, sumPledges, type PledgeScan } from "@/lib/fundIndexer";

export default function FundPage() {
  return (
    <Shell>
      <header className="page-intro">
        <p className="eyebrow">DISCOVER</p>
        <h1>Fund work worth<br /><span>showing up for.</span></h1>
        <p className="lead">Choose a campaign, choose an amount, and choose how visible your support should be.</p>
      </header>
      <section className="campaign-list" aria-label="Open campaigns">
        {liveCampaigns().map((campaign) => <CampaignCard campaign={campaign} key={campaign.id} />)}
      </section>
      <section className="rail-explainer">
        <div><b>Public pledge</b><span>Moves the goal bar</span><p>Amount and timing are public. PATRON does not publish your name.</p></div>
        <div><b>Silent gift</b><span>Stays off the bar</span><p>Private inside the pool and visible only to the creator&apos;s wallet.</p></div>
      </section>
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
    fetchPledges(makeProvider(), campaign.beneficiary, campaign.fromBlock, { toBlock: campaign.toBlock })
      .then((next) => { if (!cancelled) setScan(next); })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [live, campaign.beneficiary, campaign.fromBlock, campaign.toBlock]);

  const raisedWei = scan ? sumPledges(scan.pledges).totalWei : 0n;
  return (
    <Link className="campaign-editorial-card" href={`/fund/${campaign.id}`}>
      <div className="campaign-card-art">
        <Image src="/brand/patron-night-school.webp" alt="Night School classroom" fill sizes="(max-width: 900px) 100vw, 48vw" />
        <span className="badge badge-live">Funding now</span>
      </div>
      <div className="campaign-card-copy">
        <p className="eyebrow">COMMUNITY EDUCATION · {formatDeadline(campaign.deadline)}</p>
        <h2>{campaign.title}</h2>
        <p>{campaign.blurb}</p>
        {failed ? <p className="warning">Live chain data is unavailable. We show no estimate.</p> : <Progress raisedWei={raisedWei} goalWei={campaign.goalWei} fraction={pledgedFraction(raisedWei, campaign.goalWei)} />}
        <span className="btn btn-solid">View campaign <i aria-hidden>↗</i></span>
      </div>
    </Link>
  );
}
