import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PATRON — private tips",
  description: "A private tip jar for creators on STRK20.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
