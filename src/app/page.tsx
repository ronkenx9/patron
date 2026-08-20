import Link from "next/link";
import Shell from "@/components/Shell";

export default function HomePage() {
  return <Shell>
    <section className="hero">
      <div>
        <p className="eyebrow">A private tip jar / STRK20</p>
        <h1>Tip without leaving a client list.</h1>
        <p className="lead">Two fans can back one creator. The public book shows the count and the pot. The in-pool graph stays private.</p>
        <div className="actions"><Link className="btn btn-solid" href="/tip">Tip a creator</Link><Link className="btn" href="/creator">Open the book</Link></div>
      </div>
      <div className="poster"><p className="poster-note">PATRON / 001<br />A small act of support, without a public receipt.</p><div className="poster-number">02</div><div className="poster-foot"><span>FANS IN</span><span>CREATOR OUT</span></div></div>
    </section>
    <section className="section"><div className="grid"><article className="card"><p className="eyebrow">01 / PRIVATE</p><h3>Fans disappear into the pool.</h3><p>A private transfer does not publish the fan → creator link like a normal wallet transfer.</p></article><article className="card"><p className="eyebrow">02 / VISIBLE</p><h3>The creator book stays legible.</h3><p>A count and aggregate make support visible without turning gratitude into a doxxing surface.</p></article><article className="card"><p className="eyebrow">03 / HONEST</p><h3>Shielding is not hidden.</h3><p>PATRON says what the pool edge reveals. Use an already-mature shielded balance when possible.</p></article></div></section>
  </Shell>;
}
