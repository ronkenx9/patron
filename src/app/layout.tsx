import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PATRON — private tips without a public client list",
  description: "A creator tip jar on the live STRK20 pool. Fans tip privately; the public book shows only a count and an aggregate.",
};

export const viewport: Viewport = {
  themeColor: "#f3f0e7",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
