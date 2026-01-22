import type { Metadata, Viewport } from "next";
import "./globals.css";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { AudioPlayer } from "@/components/audio-player";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { ErrorBoundary } from "@/components/common/error-boundary";
import { Navigation } from "@/components/navigation";
import { ServiceWorkerManager } from "@/components/offline/service-worker-manager";
import { KeyboardShortcutsManager } from "@/components/ui/keyboard-shortcuts-manager";
import { Toaster } from "@/components/ui/sonner";
import Providers from "./providers";

// if dev environment then localhost else production url
const isDev = process.env.NODE_ENV === "development";

const url = isDev
	? "http://localhost:3000"
	: `https://${process.env.VERCEL_URL}`;

export const metadata: Metadata = {
	title: "Music App",
	description: "Stream your favorite music",
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
				<a
					href="#main-content"
					className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
				>
					Skip to main content
				</a>
				<Providers>
					<NuqsAdapter>
						<ServiceWorkerManager />
						<Navigation />
						<BreadcrumbNav />
						<main id="main-content" className="pb-32 md:pb-36">
							{children}
						</main>
						<KeyboardShortcutsManager />
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
