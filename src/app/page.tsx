import Link from "next/link";
import Shell from "@/components/Shell";
import LiveStrip from "@/components/LiveStrip";

const MARQUEE = [
  "Verifiable bars",
  "Invisible backers",
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
    copy: "Backers hold their funds as encrypted notes. Shielding is public and the wallet asks twice — approve, then deposit — so use dust you don't mind showing, and let notes mature ~10 blocks.",
  },
  {
    num: "02",
    tag: "YOUR CHOICE OF RAIL",
    title: "Pledge — or gift",
    copy: "A public pledge withdraws from your shielded balance straight to the treasury: counted on the bar, backer invisible. A silent gift is a private transfer the bar never sees. Same pool, two levels of quiet.",
  },
  {
    num: "03",
    tag: "PUBLIC / POOL EDGE",
    title: "Spend",
    copy: "The creator unshields what the campaign raised whenever they want. The withdrawal is visible; which backers funded it never was — so it can't leak later either.",
  },
];

export default function HomePage() {
  return (
    <Shell>
      <section className="hero">
        <div>
          <p className="eyebrow">Private crowdfunding / STRK20 · SN_MAIN</p>
          <h1>Back ideas, <span className="dim">not identities.</span></h1>
          <p className="lead">
            Crowdfunds for creators, open-source teams, and communities on Starknet.
            Every STRK in the bar is verifiable on-chain. Every backer stays invisible.
            Tipping included — receipts optional.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-solid btn-lg" href="/fund">Back a campaign</Link>
            <Link className="btn btn-lg" href="#model">How privacy works</Link>
          </div>
          <p className="hero-note">WALLET-API ≥ 0.10 (READY) · MAINNET · REAL FEES · KEEP-WHAT-YOU-RAISE</p>
        </div>
        <div className="poster" aria-hidden>
          <p className="poster-note">PATRON / C-01<br />A public pot. A private crowd.</p>
          <span className="poster-chip">backers: hidden</span>
          <div className="poster-mock">
            <h5>SEASON 02 — open-source tooling</h5>
            <div className="poster-bar"><span style={{ width: "62%" }} /></div>
            <div className="row"><span>Raised</span><b>310 / 500 STRK</b></div>
            <div className="row"><span>Backers</span><b>nobody knows</b></div>
            <div className="row"><span>Deadline</span><b>31 Oct</b></div>
          </div>
          <div className="poster-foot"><span>BAR: VERIFIABLE</span><span>CROWD: INVISIBLE</span></div>
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
            <h2>A bar anyone can verify. <span className="dim">A crowd no one can name.</span></h2>
          </div>
          <span className="section-num">01</span>
        </div>
        <div className="split">
          <div className="vault">
            <p className="eyebrow">WHAT THE CHAIN PROVES</p>
            <ul className="vault-list">
              <li>Every STRK that reached the treasury</li>
              <li>How many pledges built the bar</li>
              <li>Nothing about who pledged — ever</li>
            </ul>
            <p className="vault-foot">
              The bar reads STRK transfer events from the pool to the treasury — not anyone's word, not a self-reported
              number. Pledges are withdrawals from shielded balances, submitted by a relayer, so the backer list
              simply does not exist.
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
              <li>The backer → creator link of a silent gift</li>
              <li>Silent-gift amounts and shielded balances</li>
              <li>Who pledged, how often, and how much in total</li>
              <li>Every subsequent spend of a pledged note</li>
            </ul>
            <p className="vault-foot">
              Private transactions are submitted by a relayer, so even the transaction sender says nothing about the
              user. PATRON never attributes activity to <code>tx.from</code>.
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
            <h2>A thank-you page that can't be doxxed.</h2>
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
          Silent gifts are invisible to any indexer by design, so the book refuses to fabricate chain-derived numbers.
          Campaigns are the other half of the story: the one place PATRON publishes numbers, and only because the
          chain itself vouches for them.
        </p>
        <Link className="btn" href="/creator">Open the creator book</Link>
      </section>

      <section className="band">
        <p className="eyebrow">BUILT FOR COMMUNITIES</p>
        <h2>Put your community in the pool.</h2>
        <p className="lead">
          Ecosystems run on small, public acts of support — and on the people who'd rather not be listed for making
          them. PATRON gives Starknet's communities verifiable funding without a supporter list.
        </p>
        <div className="band-actions">
          <Link className="btn btn-acid btn-lg" href="/fund">Back a campaign</Link>
          <Link className="btn btn-lg" href="/tip">Send a silent gift</Link>
        </div>
      </section>
    </Shell>
  );
}
