"use client";

import Link from "next/link";
import Shell from "@/components/Shell";
import Progress from "@/components/Progress";
import { CAMPAIGNS, formatDeadline, isLive } from "@/lib/campaigns";

const RAILS = [
  {
    name: "PUBLIC PLEDGE",
    copy: "Withdraw a slice of your shielded balance straight to the campaign treasury. The amount lands on-chain, so anyone can verify the bar — the chain never learns who you are, because a relayer submits the transaction.",
    tag: "COUNTED",
  },
  {
    name: "SILENT GIFT",
    copy: "A plain private transfer to the creator, exactly like a tip. Nobody sees it — not the progress bar, not the chain, only the creator's own wallet. Same mechanics as the tip jar.",
    tag: "UNCOUNTED",
  },
];

export default function FundPage() {
  return (
    <Shell>
      <section className="panel" style={{ maxWidth: 900 }}>
        <p className="eyebrow">PATRON CAMPAIGNS / AGGREGATE-BY-PROOF</p>
        <h2 style={{ marginTop: 14 }}>Fund what you love.<br />Stay off the list.</h2>
        <p className="section-copy" style={{ marginTop: 12 }}>
          A campaign is a goal and a treasury. Pledges come out of shielded balances, so the chain can verify every
          STRK that lands — and can never say who pledged. The progress bar is derived from STRK transfer events on
          Starknet mainnet, not from anyone's word. Built for creators, open-source teams, and ecosystems whose
          communities run on small public acts of support.
        </p>
      </section>

      <div className="section-head" style={{ marginBottom: 20, marginTop: 40 }}>
        <p className="eyebrow">OPEN CAMPAIGNS</p>
      </div>
      <div className="stack" style={{ gap: 20 }}>
        {CAMPAIGNS.map((campaign) => (
          <Link className="campaign-card" href={`/fund/${campaign.id}`} key={campaign.id}>
            <div className="campaign-head">
              <h3>{campaign.title}</h3>
              <span className={isLive(campaign) ? "badge badge-live" : "badge"}>{isLive(campaign) ? "LIVE" : "PREVIEW"}</span>
            </div>
            <p className="section-copy">{campaign.blurb}</p>
            {isLive(campaign) ? (
              <Progress raisedWei={0n} goalWei={campaign.goalWei} fraction={0} />
            ) : (
              <p className="fineprint">
                GOAL {campaign.goalWei / 10n ** 18n} STRK · BY {formatDeadline(campaign.deadline)} · TREASURY NOT CONFIGURED — THE OWNER SETS IT BEFORE ANY PLEDGE CAN LAND
              </p>
            )}
            <p className="fineprint" style={{ marginTop: 10 }}>OPEN CAMPAIGN PAGE →</p>
          </Link>
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
