import type { Pledge } from "./fundIndexer";

// Earnings over time: pledges are anchored to block numbers, so timestamps
// are interpolated linearly between the window's two ends. Honest enough for
// a chart, and labeled as approximate in the UI.
export type SeriesPoint = { at: number; cumWei: bigint };

export function cumulativeSeries(
  pledges: Pledge[],
  window: { fromBlock: number; toBlock: number; fromTime: number; toTime: number },
): SeriesPoint[] {
  const span = window.toBlock - window.fromBlock || 1;
  const sorted = [...pledges].sort((a, b) => a.block - b.block);
  const points: SeriesPoint[] = [{ at: window.fromTime, cumWei: 0n }];
  let cum = 0n;
  for (const pledge of sorted) {
    if (pledge.block < window.fromBlock || pledge.block > window.toBlock) continue;
    cum += pledge.amountWei;
    const ratio = (pledge.block - window.fromBlock) / span;
    points.push({ at: Math.round(window.fromTime + ratio * (window.toTime - window.fromTime)), cumWei: cum });
  }
  points.push({ at: window.toTime, cumWei: cum });
  return points;
}

export function seriesTotal(points: SeriesPoint[]): bigint {
  return points.length ? points[points.length - 1].cumWei : 0n;
}

// Blocks-per-second style estimate in the other direction: how many blocks
// back a given duration reaches. Mainnet has run ~2s blocks since v0.13.
export function blocksBack(blocks: number): number {
  return blocks;
}

export function approxBlocksForDays(days: number, secondsPerBlock = 2): number {
  return Math.round((days * 86_400) / secondsPerBlock);
}
