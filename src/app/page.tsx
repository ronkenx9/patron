import Link from "next/link";
import Shell from "@/components/Shell";
import LiveStrip from "@/components/LiveStrip";

const MARQUEE = [
  "Verifiable bars",
  "No supporter list",
  "Public pledges",
  "Silent gifts",
  "Open source",
  "Communities",
];

const STEPS = [
  {
    num: "01",
    tag: "PUBLIC / POOL EDGE",
    title: "Shield",
    copy: "Funds enter the pool as encrypted notes. Shielding is public — amount, token, and depositor — and the wallet asks twice (approve, then deposit). Use dust you don't mind showing, and let notes mature ~10 blocks.",
  },
  {
    num: "02",
    tag: "YOUR CHOICE OF RAIL",
    title: "Pledge — or gift",
    copy: "A public pledge withdraws to the treasury and is counted as a qualifying pool receipt. A silent gift is a private transfer the bar never counts. Amounts and timing of pledges stay public.",
  },
  {
    num: "03",
    tag: "PUBLIC / POOL EDGE",
    title: "Spend",
    copy: "The creator spends from the treasury whenever they want. That withdrawal is public. PATRON still does not publish a backer list — which is not the same as untraceability.",
  },
];

export default function HomePage() {
  return (
    <Shell>
      <section className="hero">
        <div>
          <p className="eyebrow">Private crowdfunding / STRK20 · SN_MAIN</p>
          <h1>Back ideas, <span className="dim">not a public list.</span></h1>
          <p className="lead">
            Crowdfunds for creators, open-source teams, and communities on Starknet.
            Every STRK in the bar is a public pool-to-treasury transfer. PATRON does not
            publish a supporter list. Tipping included — receipts optional.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-solid btn-lg" href="/fund">Back a campaign</Link>
            <Link className="btn btn-lg" href="#model">How privacy works</Link>
          </div>
          <p className="hero-note">WALLET-API ≥ 0.10 (READY) · MAINNET · REAL FEES · KEEP-WHAT-YOU-RAISE</p>
        </div>
        <div className="poster" aria-hidden>
          <p className="poster-note">PATRON / C-01<br />A public pot. No supporter list.</p>
          <span className="poster-chip">list: unpublished</span>
          <div className="poster-mock">
            <h5>NIGHT SCHOOL — office hours</h5>
            <div className="poster-bar"><span style={{ width: "10%" }} /></div>
            <div className="row"><span>Pool receipts</span><b>8 / 80 STRK</b></div>
            <div className="row"><span>Supporter list</span><b>not published</b></div>
            <div className="row"><span>Deadline</span><b>31 Oct</b></div>
          </div>
          <div className="poster-foot"><span>BAR: VERIFIABLE</span><span>LIST: UNPUBLISHED</span></div>
        </div>
      </section>

      <LiveStrip />

      <div className="marquee" aria-hidden>
        <div className="marquee-track">
          {[...MARQUEE, ...MARQUEE, ...MARQUEE, ...MARQUEE].map((item, index) => (
            <span key={index}>{item} ✦</span>
          ))}
        </div>
      </div>

      <section className="section" id="campaigns">
        <div className="section-head">
          <div>
            <p className="eyebrow">01 / CAMPAIGNS</p>
            <h2>A bar anyone can verify. <span className="dim">No supporter list.</span></h2>
          </div>
          <span className="section-num">01</span>
        </div>
        <div className="split">
          <div className="vault">
            <p className="eyebrow">WHAT THE CHAIN PROVES</p>
            <ul className="vault-list">
              <li>Every qualifying STRK transfer from the pool to the treasury</li>
              <li>How many receipts built the bar — transactions, not unique people</li>
              <li>PATRON does not publish a supporter list</li>
            </ul>
            <p className="vault-foot">
              The bar reads STRK transfer events from the pool to the treasury in one campaign window — not anyone's
              word. Relayed transactions are not attributed to tx.from. That is not proof of untraceability: amounts,
              timing, and the earlier deposit remain public and can correlate.
            </p>
          </div>
          <div className="edge">
            <p className="eyebrow" style={{ color: "var(--muted)" }}>WHAT IT COSTS — HONESTLY</p>
            <ul className="edge-list">
              <li>Pledge amounts are public; that is the price of a verifiable bar</li>
              <li>Pledge timing is public, like every pool interaction</li>
              <li>Keep-what-you-raise: no escrow, no refunds in v1</li>
            </ul>
            <div className="band-actions" style={{ marginTop: 26 }}>
              <Link className="btn btn-acid" href="/fund">Open the campaigns</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <p className="eyebrow">02 / THE LOOP</p>
            <h2>Three moves, two rails.</h2>
          </div>
          <span className="section-num">02</span>
        </div>
        <div className="grid">
          {STEPS.map((step) => (
            <article className="card" key={step.num}>
              <span className="step-num" aria-hidden>{step.num}</span>
              <h3>{step.title}</h3>
              <p className="step-tag">{step.tag}</p>
              <p style={{ marginTop: 12 }}>{step.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="model">
        <div className="section-head">
          <div>
            <p className="eyebrow">03 / PRIVACY MODEL</p>
            <h2>What the pool hides. <span className="dim">What the edge shows.</span></h2>
          </div>
          <span className="section-num">03</span>
        </div>
        <div className="split">
          <div className="vault">
            <p className="eyebrow">INSIDE THE POOL — PRIVATE</p>
            <ul className="vault-list">
              <li>Silent-gift amounts, and the backer → creator link of a silent gift</li>
              <li>Shielded balances (wallet-mediated read only, on click)</li>
              <li>A published supporter list — PATRON does not keep one</li>
              <li>Subsequent spends of notes that stay inside the pool</li>
            </ul>
            <p className="vault-foot">
              Private transactions are submitted by a relayer, so PATRON never attributes activity to <code>tx.from</code>.
              Lack of a direct sender field is not a claim that the flow cannot be correlated.
            </p>
          </div>
          <div className="edge">
            <p className="eyebrow" style={{ color: "var(--muted)" }}>AT THE POOL EDGE — PUBLIC</p>
            <ul className="edge-list">
              <li>Shield amount, token, and depositor</li>
              <li>The fact and timing of a pool interaction</li>
              <li>Pledge amounts paid to a campaign treasury</li>
              <li>Unshield amounts and destinations</li>
            </ul>
            <p className="edge-title">Shielding is not hidden, and PATRON will not pretend otherwise.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <p className="eyebrow">04 / THE BOOK</p>
            <h2>A thank-you page without a public list.</h2>
          </div>
          <span className="section-num">04</span>
        </div>
        <div className="book">
          <div className="metric">
            <div className="metric-label">Supporters</div>
            <div className="metric-value">02</div>
            <div className="metric-sub">self-reported</div>
          </div>
          <div className="metric">
            <div className="metric-label">Aggregate received</div>
            <div className="metric-value">3 STRK</div>
            <div className="metric-sub">demo fixture</div>
          </div>
        </div>
        <p className="fineprint" style={{ maxWidth: 620, margin: "18px 0 22px" }}>
          Silent gifts are not indexed here, so the book refuses to fabricate chain-derived numbers.
          Campaigns are the other half: PATRON publishes qualifying pool receipts because those transfers are already public.
        </p>
        <Link className="btn" href="/creator">Open the creator book</Link>
      </section>

      <section className="band">
        <p className="eyebrow">BUILT FOR COMMUNITIES</p>
        <h2>Put your community in the pool.</h2>
        <p className="lead">
          Ecosystems run on small, public acts of support — and on people who would rather not be listed for making
          them. PATRON gives Starknet's communities verifiable funding without publishing a supporter list.
        </p>
        <div className="band-actions">
          <Link className="btn btn-acid btn-lg" href="/fund">Back a campaign</Link>
          <Link className="btn btn-lg" href="/tip">Send a silent gift</Link>
        </div>
      </section>
    </Shell>
  );
}
