import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Offline Music - Music App",
  description:
    "Access your downloaded music offline. Listen to your favorite songs without an internet connection.",
};

export default function DownloadsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
