import Link from "next/link";
import ConnectButton from "@/components/ConnectButton";

export default function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell">
      <header className="topbar">
        <Link className="brand" href="/">PATRON<span>///</span></Link>
        <nav>
          <Link href="/tip">Tip</Link>
          <Link href="/creator">Creator book</Link>
          <Link href="/pool">Pool bench</Link>
        </nav>
        <ConnectButton />
      </header>
      <main>{children}</main>
      <footer><span>STRK20 / STARKNET MAINNET</span><span>PRIVATE BY DEFAULT · HONEST ABOUT THE EDGE</span></footer>
    </div>
  );
}
