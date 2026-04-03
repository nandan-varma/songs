import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import withBundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";

const bundleAnalyzer = withBundleAnalyzer({
	enabled: process.env.ANALYZE === "true",
});

// Generate build info at config time
function generateBuildInfo() {
	const isDev = process.env.NODE_ENV === "development";
	const timestamp = Date.now();
	const buildId = `${timestamp}-${Math.random().toString(36).slice(2, 9)}`;

	const gitInfo: Record<string, string> = {};
	try {
		gitInfo.commit = execSync("git rev-parse --short HEAD", {
			encoding: "utf-8",
		}).trim();
		gitInfo.branch = execSync("git rev-parse --abbrev-ref HEAD", {
			encoding: "utf-8",
		}).trim();
	} catch {
		// Git not available
	}

	return {
		id: buildId,
		timestamp,
		version: process.env.npm_package_version || "0.0.0",
		git: gitInfo,
		env: isDev ? "development" : "production",
	};
}

// Write build info to public directory
const buildInfo = generateBuildInfo();
const publicDir = path.join(process.cwd(), "public");
if (!fs.existsSync(publicDir)) {
	fs.mkdirSync(publicDir, { recursive: true });
}
fs.writeFileSync(
	path.join(publicDir, "build-info.json"),
	JSON.stringify(buildInfo, null, 2),
);

const nextConfig: NextConfig = {
	// Features for better performance
	experimental: {
		optimizePackageImports: ["@radix-ui/react-*", "lucide-react"],
		scrollRestoration: true,
	},
	typedRoutes: true,

	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "c.saavncdn.com",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "www.jiosaavn.com",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "static.saavncdn.com",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "placehold.co",
				pathname: "/**",
			},
		],
		// Optimize images further
		formats: ["image/webp", "image/avif"],
		minimumCacheTTL: 60,
	},
};

// Apply bundle analyzer wrapper
export default bundleAnalyzer(nextConfig);
