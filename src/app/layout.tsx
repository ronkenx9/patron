import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PATRON — private crowdfunding on STRK20",
  description: "Back creators, open source, and communities on Starknet. Every STRK in the bar is verifiable; every backer stays invisible.",
};

export const viewport: Viewport = {
  themeColor: "#f3f0e7",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
