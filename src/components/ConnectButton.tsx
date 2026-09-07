"use client";

import { useEffect, useState } from "react";
import { WalletAccountV6, validateAndParseAddress, walletV6 } from "starknet";
import { createStore, type Store } from "@starknet-io/get-starknet-discovery";
import type { WalletWithStarknetFeatures } from "@starknet-io/get-starknet-wallet-standard/features";
import { makeProvider } from "@/lib/constants";
import { isStrk20Spec } from "@/lib/strk20";
import { useWallet } from "@/store/wallet";
import { shortHex } from "@/lib/format";

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export default function ConnectButton() {
  const { connected, address, setWallet, reset } = useWallet();
  const [wallets, setWallets] = useState<WalletWithStarknetFeatures[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const store: Store = createStore({ eip1193Adapters: [] });
    setWallets(store.getWallets().slice());
    return store.subscribe((next) => setWallets(next.slice()));
  }, []);

  async function connect(selected: WalletWithStarknetFeatures) {
    setBusy(true);
    setError("");
    try {
      const account = await WalletAccountV6.connect(makeProvider(), selected);
      const accounts = await walletV6.requestAccounts(selected);
      if (typeof accounts === "string" || !accounts[0]) throw new Error("Wallet did not return an account.");
      const addr = validateAndParseAddress(accounts[0]);
      let specs: string[] = [];
      try {
        specs = await walletV6.supportedWalletApi(selected);
      } catch {
        try { specs = await walletV6.supportedSpecs(selected); } catch { /* capability stays false */ }
      }
      const strk20 = isStrk20Spec(specs) || /ready/i.test(selected.name);
      setWallet(account, addr, strk20);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wallet connection failed.");
    } finally {
      setBusy(false);
    }
  }

  if (connected && address) {
    return <button className="pill" onClick={reset} title="Disconnect"><span className="dot" /> {shortHex(address)}</button>;
  }

  const compatibleWallets = wallets.filter((wallet) =>
    !normalize(wallet.name).includes("metamask") && !normalize(wallet.name).includes("braavos")
  );

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
  }

  return (
    <>
      <button className="pill" onClick={() => setOpen(true)}>Connect Ready</button>
      {open ? (
        <div className="overlay" onClick={() => !busy && setOpen(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <p className="eyebrow">STRK20 / SN_MAIN</p>
            <h2>Choose a wallet</h2>
            <p className="muted">PATRON uses Ready&apos;s privacy-enabled Wallet API. Connecting does not submit a transaction.</p>
            {compatibleWallets.map((wallet) => (
              <button className="wallet-row" key={wallet.name} disabled={busy} onClick={() => connect(wallet)}>{wallet.name}<span>↗</span></button>
            ))}
            {!compatibleWallets.length ? (
              <div className="wallet-empty">
                <h3>No compatible wallet found</h3>
                <p>Wallet extensions do not run in some embedded browsers. Open this campaign in Brave or Chrome with Ready installed, then connect again.</p>
                <div className="quickrow">
                  <a className="btn btn-solid" href="https://www.ready.co/" target="_blank" rel="noreferrer">Get Ready wallet ↗</a>
                  <button className="btn" onClick={copyLink}>{copied ? "Link copied ✓" : "Copy this page"}</button>
                </div>
              </div>
            ) : null}
            {error ? <p className="error" role="alert">{error}</p> : null}
            <button className="modal-close" onClick={() => setOpen(false)} aria-label="Close wallet dialog">Close</button>
          </div>
        </div>
      ) : null}
    </>
  );
}
