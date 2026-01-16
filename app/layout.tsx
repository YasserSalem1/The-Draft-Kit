import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "R&D Drafting Platform",
  description: "Advanced Drafting & Reporting Intelligence",
};

import { VoiceGuide } from "@/components/features/VoiceGuide";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} antialiased bg-background text-foreground`}
      >
        <VoiceGuide />
        {children}
      </body>
    </html>
  );
}
