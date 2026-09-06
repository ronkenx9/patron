// Starknet.id resolution — display-only sugar. If it fails, pages fall back
// to the short address form; nothing depends on it.
const cache = new Map<string, string | null>();

export function formatStarkName(name: string): string {
  return name.includes(".") ? name : `${name}.stark`;
}

export async function starkName(address: string): Promise<string | null> {
  let key = address;
  try {
    key = "0x" + BigInt(address).toString(16);
  } catch {
    return null;
  }
  if (cache.has(key)) return cache.get(key) ?? null;
  try {
    const response = await fetch(`https://api.starknet.id/addr_to_basic_name?addr=${key}`, { signal: AbortSignal.timeout(4000) });
    if (!response.ok) throw new Error(String(response.status));
    const data = (await response.json()) as { name?: string };
    const name = data.name ? formatStarkName(data.name) : null;
    cache.set(key, name);
    return name;
  } catch {
    cache.set(key, null);
    return null;
  }
}
