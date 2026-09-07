"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import BrandMark from "@/components/BrandMark";
import ConnectButton from "@/components/ConnectButton";

const LINKS = [
  { href: "/fund", label: "Discover" },
  { href: "/submit", label: "Start a campaign" },
  { href: "/profile", label: "Account" },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="shell">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="PATRON home"><BrandMark /><span>PATRON</span></Link>
        <nav aria-label="Primary navigation">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={`navlink${pathname === link.href || pathname.startsWith(`${link.href}/`) ? " active" : ""}`}>{link.label}</Link>
          ))}
        </nav>
        <ConnectButton />
      </header>
      <main>{children}</main>
      <footer className="footer">
        <div className="footer-grid">
          <div className="footer-intro">
            <Link className="brand footer-brand" href="/"><BrandMark /><span>PATRON</span></Link>
            <p>Fund the work. Skip the supporter list.</p>
          </div>
          <div className="footer-col">
            <b>Explore</b>
            <Link href="/fund">Live campaign</Link>
            <Link href="/submit">Start a campaign</Link>
            <Link href="/tip">Send a silent gift</Link>
          </div>
          <div className="footer-col">
            <b>Proof & tools</b>
            <Link href="/pool">Pool bench</Link>
            <Link href="/creator">Creator book</Link>
            <a href="https://voyager.online/contract/0x040337b1af3c663e86e333bab5a4b28da8d4652a15a69beee2b677776ffe812a" target="_blank" rel="noreferrer">Contract on Voyager ↗</a>
          </div>
        </div>
        <div className="footer-fine"><span>Live on Starknet mainnet</span><span>Open source · Keep what you raise</span></div>
      </footer>
    </div>
  );
}
