import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BottomNav, DesktopNav } from "@/components/nav";
import { MiniPlayer } from "@/components/player/mini-player";
import { Providers } from "@/components/providers";
import { SearchBox } from "@/components/search-box";
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
					<header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background px-4 md:gap-4">
						<Link
							href="/"
							className="flex h-11 items-center text-lg font-semibold"
						>
							Songs
						</Link>
						<DesktopNav />
						<Suspense fallback={<div className="flex-1" />}>
							<SearchBox />
						</Suspense>
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
