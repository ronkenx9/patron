"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ConnectButton from "@/components/ConnectButton";

const LINKS = [
  { href: "/tip", label: "Tip" },
  { href: "/fund", label: "Fund" },
  { href: "/creator", label: "Creator book" },
  { href: "/pool", label: "Pool bench" },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="shell">
      <header className="topbar">
        <Link className="brand" href="/">PATRON<span>///</span></Link>
        <nav>
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={`navlink${pathname === link.href ? " active" : ""}`}>{link.label}</Link>
          ))}
        </nav>
        <ConnectButton />
      </header>
      <main>{children}</main>
      <footer className="footer">
        <div className="footer-grid">
          <div>
            <div className="footer-word">PATRON<span>///</span></div>
            <p className="fineprint" style={{ maxWidth: 300, marginTop: 14 }}>
              Private tips without a public client list. Built on the live STRK20 pool, Starknet mainnet.
            </p>
          </div>
          <div className="footer-col">
            <b>APP</b>
            <Link href="/tip">Send a private tip</Link>
            <Link href="/fund">Back a campaign</Link>
            <Link href="/creator">Creator book</Link>
            <Link href="/pool">Pool bench</Link>
          </div>
          <div className="footer-col">
            <b>OFF-RAMP</b>
            <a href="https://strk20.starknet.io/" target="_blank" rel="noreferrer">strk20.starknet.io ↗</a>
            <a href="https://strk20-by-example.org/" target="_blank" rel="noreferrer">strk20-by-example.org ↗</a>
            <a href="https://voyager.online/contract/0x040337b1af3c663e86e333bab5a4b28da8d4652a15a69beee2b677776ffe812a" target="_blank" rel="noreferrer">Pool on Voyager ↗</a>
          </div>
        </div>
        <div className="footer-fine">
          <span>STRK20 / STARKNET MAINNET</span>
          <span>PRIVATE BY DEFAULT · HONEST ABOUT THE EDGE</span>
        </div>
      </footer>
    </div>
  );
}
