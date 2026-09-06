import Link from "next/link";
import Shell from "@/components/Shell";
import LiveStrip from "@/components/LiveStrip";

const MARQUEE = [
  "Shielded balances",
  "Private transfers",
  "No client list",
  "Aggregate-only book",
  "Relayer-submitted",
  "Honest about the edge",
];

const STEPS = [
  {
    num: "01",
    tag: "PUBLIC / POOL EDGE",
    title: "Shield",
    copy: "Deposit STRK into the pool. Your wallet asks twice — the ERC-20 approve, then the private deposit — and the amount is visible at the edge. Use dust you don't mind showing.",
  },
  {
    num: "02",
    tag: "PRIVATE / INSIDE NOTES",
    title: "Tip",
    copy: "Send a private transfer from a mature balance. The fan → creator link, the sender, the recipient and the amount never leave the encrypted notes.",
  },
  {
    num: "03",
    tag: "PUBLIC / POOL EDGE",
    title: "Unshield",
    copy: "The creator exits a slice to a public address when they want to spend. The withdrawal amount and destination are visible; which tips funded it are not.",
  },
];

export default function HomePage() {
  return (
    <Shell>
      <section className="hero">
        <div>
          <p className="eyebrow">A private tip jar / STRK20 · SN_MAIN</p>
          <h1>Tip without leaving a <span className="mark">client list.</span></h1>
          <p className="lead">
            Two fans back one creator. The chain sees pool-edge activity; the fan → creator
            graph stays inside encrypted notes. The public book shows a count and a pot — never the names.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-solid btn-lg" href="/tip">Tip a creator</Link>
            <Link className="btn btn-lg" href="#privacy">How privacy works</Link>
          </div>
          <p className="hero-note">REQUIRES A WALLET-API ≥ 0.10 WALLET (READY) · MAINNET · REAL FEES</p>
        </div>
        <div className="poster" aria-hidden>
          <p className="poster-note">PATRON / 001<br />A small act of support, without a public receipt.</p>
          <span className="poster-chip">amount: hidden</span>
          <div className="poster-number">02</div>
          <div className="poster-foot"><span>FANS IN</span><span>CREATOR OUT</span></div>
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

      <section className="section" id="privacy">
        <div className="section-head">
          <div>
            <p className="eyebrow">01 / PRIVACY MODEL</p>
            <h2>What the pool hides.<br />What the edge shows.</h2>
          </div>
          <span className="section-num">01</span>
        </div>
        <div className="split">
          <div className="vault">
            <p className="eyebrow">INSIDE THE POOL — PRIVATE</p>
            <ul className="vault-list">
              <li>The fan → creator link of a private transfer</li>
              <li>The transfer amount</li>
              <li>Shielded balances</li>
              <li>Who exactly tipped, and how often</li>
            </ul>
            <p className="vault-foot">
              Private transactions are submitted by a relayer, so even the transaction sender
              says nothing about the user. PATRON never attributes activity to <code>tx.from</code>.
            </p>
          </div>
          <div className="edge">
            <p className="eyebrow" style={{ color: "var(--muted)" }}>AT THE POOL EDGE — PUBLIC</p>
            <ul className="edge-list">
              <li>Shield amount, token, and depositor</li>
              <li>The fact and timing of a pool interaction</li>
              <li>Unshield amount and destination</li>
              <li>The flat pool fee, per private operation</li>
            </ul>
            <p className="edge-title">Shielding is not hidden, and PATRON will not pretend otherwise.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <p className="eyebrow">02 / THE LOOP</p>
            <h2>Three moves.</h2>
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

      <section className="section">
        <div className="section-head">
          <div>
            <p className="eyebrow">03 / THE BOOK</p>
            <h2>A book that can't be doxxed.</h2>
          </div>
          <span className="section-num">03</span>
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
          Private transfers are invisible to any indexer by design, so the book refuses to fabricate chain-derived
          numbers. The one honest live figure is the creator's own shielded balance, read by their wallet — never by PATRON.
        </p>
        <Link className="btn" href="/creator">Open the creator book</Link>
      </section>

      <section className="band">
        <p className="eyebrow">READY WHEN YOU ARE</p>
        <h2>Put support in the pool.</h2>
        <p className="lead">
          Connect a privacy-capable wallet, spend an already-mature shielded balance, and the tip
          lands without a receipt that names either of you.
        </p>
        <div className="band-actions">
          <Link className="btn btn-acid btn-lg" href="/tip">Send a private tip</Link>
          <Link className="btn btn-lg" href="/pool">Open the pool bench</Link>
        </div>
      </section>
    </Shell>
  );
}
