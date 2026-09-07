import Image from "next/image";
import Link from "next/link";
import Shell from "@/components/Shell";
import BrandMark from "@/components/BrandMark";
import LiveStrip from "@/components/LiveStrip";

const CHOICES = [
  { label: "Public pledge", meta: "Counts toward the goal", copy: "Your STRK moves from the privacy pool to the campaign treasury. The amount and timing are public; PATRON does not publish your name.", href: "/fund/night-school", cta: "Pledge to Night School" },
  { label: "Silent gift", meta: "Private, not counted", copy: "Send directly inside the privacy pool. The creator receives it, but it never moves the public campaign bar.", href: "/tip", cta: "Send a silent gift" },
];

export default function HomePage() {
  return (
    <Shell>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">PRIVATE CROWDFUNDING, LIVE ON STARKNET</p>
          <h1>Fund the work.<br /><span>Skip the supporter list.</span></h1>
          <p className="lead">PATRON helps people fund creators and community projects without publishing who backed them. Campaign totals stay verifiable onchain.</p>
          <div className="hero-actions">
            <Link className="btn btn-solid btn-lg" href="/fund/night-school">Back Night School <span aria-hidden>↗</span></Link>
            <Link className="btn btn-lg" href="#how-it-works">See how it works</Link>
          </div>
          <p className="hero-note">ONE LIVE CAMPAIGN · 8 OF 80 STRK RAISED · ENDS 31 OCT</p>
        </div>
        <div className="hero-art">
          <Image src="/brand/patron-night-school.webp" alt="An editorial illustration of a nighttime learning circle with notebooks, a projector, and a shared contribution bowl" fill priority sizes="(max-width: 900px) 100vw, 52vw" />
          <div className="art-stamp"><BrandMark /><span>Made possible<br />by patrons</span></div>
        </div>
      </section>

      <LiveStrip />

      <section className="campaign-feature" aria-labelledby="live-campaign">
        <div className="campaign-kicker"><span className="live-dot" /> Funding now</div>
        <div className="campaign-feature-grid">
          <div><p className="eyebrow">NIGHT SCHOOL · OFFICE HOURS</p><h2 id="live-campaign">A room to learn<br />after hours.</h2></div>
          <div className="campaign-pitch">
            <p>Fund practical community sessions for people building after work—space, equipment, and open office hours included.</p>
            <div className="feature-progress" role="progressbar" aria-label="Campaign funding" aria-valuemin={0} aria-valuemax={100} aria-valuenow={10}><span /></div>
            <div className="feature-stats"><div><strong>8 STRK</strong><small>raised</small></div><div><strong>80 STRK</strong><small>goal</small></div><div><strong>31 Oct</strong><small>deadline</small></div></div>
            <Link className="text-link" href="/fund/night-school">View campaign <span aria-hidden>↗</span></Link>
          </div>
        </div>
      </section>

      <section className="section" id="how-it-works">
        <div className="section-heading"><p className="eyebrow">TWO WAYS TO SHOW UP</p><h2>You choose what becomes public.</h2><p className="section-copy">Both routes support the creator. Only a public pledge moves the campaign bar.</p></div>
        <div className="choice-grid">
          {CHOICES.map((choice, index) => (
            <article className={`choice-card choice-${index + 1}`} key={choice.label}>
              <div className="choice-top"><span>0{index + 1}</span><b>{choice.meta}</b></div>
              <h3>{choice.label}</h3><p>{choice.copy}</p>
              <Link href={choice.href}>{choice.cta} <span aria-hidden>↗</span></Link>
            </article>
          ))}
        </div>
      </section>

      <section className="proof-section">
        <div><p className="eyebrow">THE SIMPLE VERSION</p><h2>We show the money.<br />Not a social graph.</h2></div>
        <div className="proof-list">
          <div><span>01</span><p><b>Verifiable funding</b>Campaign bars come from real pool-to-treasury transfers on Starknet.</p></div>
          <div><span>02</span><p><b>No supporter roster</b>PATRON never builds or publishes a list of campaign backers.</p></div>
          <div><span>03</span><p><b>Honest privacy</b>Pledge amounts and timing remain public. Silent gifts stay private and uncounted.</p></div>
        </div>
      </section>

      <section className="closing-band">
        <BrandMark />
        <div><p className="eyebrow">START HERE</p><h2>Back the first room.</h2></div>
        <Link className="btn btn-paper btn-lg" href="/fund/night-school">Open Night School <span aria-hidden>↗</span></Link>
      </section>
    </Shell>
  );
}
