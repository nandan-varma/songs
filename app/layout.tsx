import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PlayerProvider } from "@/contexts/player-context";
import { Navigation } from "@/components/navigation";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { AudioPlayer } from "@/components/audio-player";
import { Toaster } from "@/components/ui/sonner";
import Providers from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Music App",
  description: "Stream your favorite music",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased dark`}
      >
        <Providers>
          <PlayerProvider>
            <Navigation />
            <BreadcrumbNav />
            <main className="pb-32 md:pb-36">{children}</main>
            <AudioPlayer />
            <Toaster />
          </PlayerProvider>
        </Providers>
      </body>
    </html>
  );
}
