import type { Metadata } from "next";
import { Big_Shoulders, Schibsted_Grotesk } from "next/font/google";
import "./globals.css";

const schibsted = Schibsted_Grotesk({ subsets: ["latin"], variable: "--font-schibsted" });
const shoulders = Big_Shoulders({ subsets: ["latin"], weight: ["600", "800"], variable: "--font-shoulders" });

export const metadata: Metadata = {
  title: "Lead Qualifier",
  description: "Enrich and score inbound leads with Claude.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${schibsted.variable} ${shoulders.variable}`}>
      <body>{children}</body>
    </html>
  );
}
