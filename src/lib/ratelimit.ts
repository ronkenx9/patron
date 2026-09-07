const buckets = new Map<string, number[]>();

export function takeToken(key: string, opts: { windowMs: number; max: number; now?: number }): boolean {
  const now = opts.now ?? Date.now();
  const cutoff = now - opts.windowMs;
  const times = (buckets.get(key) ?? []).filter((stamp) => stamp > cutoff);
  if (times.length >= opts.max) {
    buckets.set(key, times);
    return false;
  }
  times.push(now);
  buckets.set(key, times);
  return true;
}

export function resetRateLimit(): void {
  buckets.clear();
}

export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim() || "unknown";
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}
