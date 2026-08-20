import Shell from "@/components/Shell";

export default function CreatorPage() {
  return <Shell><section className="panel"><p className="eyebrow">CREATOR / AGGREGATE-ONLY BOOK</p><h2>@kenn</h2><p className="section-copy">A public thank-you page that does not publish a supporter list. This is a demo snapshot until PATRON indexes live STRK20 pool events.</p><div className="book"><div className="metric"><div className="metric-label">Supporters</div><div className="metric-value">02</div></div><div className="metric"><div className="metric-label">Aggregate received</div><div className="metric-value">3 STRK</div></div></div><div className="warning" style={{ marginTop: 20 }}>Demo data only. Live indexing is not wired yet; no claim is made that these numbers reflect the chain.</div></section></Shell>;
}
