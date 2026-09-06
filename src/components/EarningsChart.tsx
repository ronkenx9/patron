"use client";

import { fromWei } from "@/lib/format";
import type { SeriesPoint } from "@/lib/timeseries";

// Cumulative earnings as an SVG step-line. No chart library — the ink/acid
// identity does the work, and the data is honest (steps, not smoothing).
export default function EarningsChart({ points, goalWei }: { points: SeriesPoint[]; goalWei?: bigint }) {
  const W = 640;
  const H = 200;
  const PAD = 8;
  if (points.length < 2) return null;

  const t0 = points[0].at;
  const t1 = points[points.length - 1].at || 1;
  const max = points.reduce((m, p) => (p.cumWei > m ? p.cumWei : m), 0n);
  const yMax = goalWei && goalWei > max ? goalWei : max || 1n;

  const x = (at: number) => PAD + ((at - t0) / (t1 - t0 || 1)) * (W - PAD * 2);
  const y = (wei: bigint) => H - PAD - Number((wei * BigInt(H - PAD * 2)) / yMax);

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.at).toFixed(1)},${y(p.cumWei).toFixed(1)}`).join(" ");
  const area = `${line} L${x(t1).toFixed(1)},${H - PAD} L${x(t0).toFixed(1)},${H - PAD} Z`;

  const fmt = (at: number) => new Date(at).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  return (
    <figure className="chart" style={{ margin: 0 }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Cumulative amount raised over time">
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} className="chart-axis" />
        {goalWei && goalWei <= yMax ? (
          <line x1={PAD} y1={y(goalWei)} x2={W - PAD} y2={y(goalWei)} className="chart-goal" />
        ) : null}
        <path d={area} className="chart-area" />
        <path d={line} className="chart-line" />
      </svg>
      <figcaption className="chart-meta mono">
        <span>{fmt(t0)}</span>
        <span><b>{fromWei(max)} STRK</b> cumulative{goalWei ? ` · goal ${fromWei(goalWei)} (dashed)` : ""}</span>
        <span>{fmt(t1)}</span>
      </figcaption>
    </figure>
  );
}
