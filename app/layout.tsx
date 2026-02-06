import type { Metadata } from "next";
import { IBM_Plex_Mono, Newsreader, Spline_Sans } from "next/font/google";
import "./globals.css";
import { HeaderWrapper } from "@/components/header-wrapper";
import { Providers } from "@/components/providers";

const splineSans = Spline_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-display",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "600"],
});

  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Riassu.mi - Riassunti PDF con AI",
  description: "Trasforma i tuoi PDF di studio in riassunti intelligenti e quiz di verifica. Powered by AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body className={`${splineSans.variable} ${newsreader.variable} ${plexMono.variable} antialiased`}>
        <Providers>
          <HeaderWrapper />
          {children}
        </Providers>
      </body>
    </html>
  );
}
