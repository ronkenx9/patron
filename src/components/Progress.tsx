export default function Progress({ raisedWei, goalWei, fraction }: { raisedWei: bigint; goalWei: bigint; fraction: number }) {
  const percent = Math.round(fraction * 100);
  return (
    <div className="progress-block">
      <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-label="Campaign progress">
        <div className="progress-fill" style={{ width: `${Math.max(fraction > 0 ? 2 : 0, fraction * 100)}%` }} />
      </div>
      <div className="progress-meta mono">
        <span><b>{raisedWei >= 10n ** 15n || raisedWei === 0n ? raisedLabel(raisedWei) : "<0.001"} STRK</b> raised</span>
        <span>{percent}% of {goalLabel(goalWei)} STRK</span>
      </div>
    </div>
  );
}

function raisedLabel(wei: bigint): string {
  const whole = wei / 10n ** 18n;
  const frac = (wei % 10n ** 18n) / 10n ** 15n;
  return frac > 0n ? `${whole}.${frac}` : whole.toString();
}

function goalLabel(wei: bigint): string {
  return (wei / 10n ** 18n).toString();
}
