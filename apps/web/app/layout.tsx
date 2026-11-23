import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { BottomNav, DesktopNav } from "@/components/nav";
import { MiniPlayer } from "@/components/player/mini-player";
import { Providers } from "@/components/providers";
import { ThemeToggle } from "@/components/theme-toggle";
import "./globals.css";

export const metadata: Metadata = {
	metadataBase: new URL(
		process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
	),
	title: { default: "Songs", template: "%s | Songs" },
	description: "Stream your favorite music.",
	icons: { apple: "/apple-touch-icon.png" },
	openGraph: { images: "/og-image.png" },
};

export const viewport: Viewport = {
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "#ffffff" },
		{ media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
	],
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className="flex min-h-dvh flex-col">
				<Providers>
					<header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur">
						<Link href="/" className="text-lg font-semibold">
							Songs
						</Link>
						<DesktopNav />
						<div className="ml-auto">
							<ThemeToggle />
						</div>
					</header>
					<main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
						{children}
					</main>
					<div className="sticky bottom-0 z-30">
						<MiniPlayer />
						<BottomNav />
					</div>
				</Providers>
			</body>
		</html>
	);
}
