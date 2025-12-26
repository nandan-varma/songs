import type { Metadata, Viewport } from "next";
import "./globals.css";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { AudioPlayer } from "@/components/audio-player";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { ErrorBoundary } from "@/components/error-boundary";
import { Navigation } from "@/components/navigation";
import { ServiceWorkerManager } from "@/components/offline/service-worker-manager";
import { Toaster } from "@/components/ui/sonner";
import Providers from "./providers";

// if dev environment then localhost else production url
const isDev = process.env.NODE_ENV === "development";

const url = isDev
	? "http://localhost:3000"
	: `https://${process.env.VERCEL_URL}`;

export const metadata: Metadata = {
	title: "Music App - Stream Your Favorite Music",
	description:
		"Discover, stream, and download millions of songs from your favorite artists. Listen to music online or offline with our modern music streaming app.",
	keywords: [
		"music",
		"streaming",
		"songs",
		"artists",
		"albums",
		"playlists",
		"download",
		"offline",
	],
	manifest: "/manifest.json",
	icons: {
		icon: [
			{ url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
			{ url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
			{ url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
			{ url: "/favicon.ico", sizes: "any" },
		],
		apple: [
			{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
		],
		other: [
			{
				rel: "android-chrome-192x192",
				url: "/android-chrome-192x192.png",
			},
			{
				rel: "android-chrome-512x512",
				url: "/android-chrome-512x512.png",
			},
		],
	},
	openGraph: {
		title: "Music App",
		description: "Stream your favorite music",
		url: url,
		siteName: "Music App",
		images: [
			{
				url: "/og-image.png",
				width: 1200,
				height: 630,
				alt: "Music App",
			},
			{
				url: "/og-image-square.png",
				width: 1200,
				height: 1200,
				alt: "Music App",
			},
		],
		locale: "en_US",
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: "Music App",
		description: "Stream your favorite music",
		images: ["/twitter-image.png"],
	},
	appleWebApp: {
		capable: true,
		statusBarStyle: "default",
		title: "Music App",
	},
	formatDetection: {
		telephone: false,
	},
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	userScalable: true,
	maximumScale: 5,
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className={`antialiased dark`}>
				<Providers>
					<NuqsAdapter>
						<ServiceWorkerManager />
						<Navigation />
						<BreadcrumbNav />
						<main className="pb-32 md:pb-36">{children}</main>
						<ErrorBoundary context="AudioPlayer">
							<AudioPlayer />
						</ErrorBoundary>
						<Toaster />
					</NuqsAdapter>
				</Providers>
			</body>
		</html>
	);
}
