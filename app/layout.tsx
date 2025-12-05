import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AudioPlayer } from "@/components/audio-player";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { Navigation } from "@/components/navigation";
import { ServiceWorkerManager } from "@/components/offline/service-worker-manager";
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
	manifest: "/manifest.json",
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
	maximumScale: 1,
	userScalable: false,
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<head>
				<script
					crossOrigin="anonymous"
					src="//unpkg.com/react-scan/dist/auto.global.js"
				/>
			</head>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased dark`}
			>
				<Providers>
					<ServiceWorkerManager />
					<Navigation />
					<BreadcrumbNav />
					<main className="pb-32 md:pb-36">{children}</main>
					<AudioPlayer />
					<Toaster />
				</Providers>
			</body>
		</html>
	);
}
