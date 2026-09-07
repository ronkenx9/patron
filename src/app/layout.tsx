import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "PATRON — fund the work, skip the supporter list",
  description: "Private crowdfunding for creators and communities. Verifiable campaign totals without a published supporter list.",
};

export const viewport: Viewport = {
  themeColor: "#f3efe5",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-scroll-behavior="smooth" className={`${geist.variable} ${mono.variable}`}><body>{children}</body></html>;
}
