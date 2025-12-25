import withBundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";

const bundleAnalyzer = withBundleAnalyzer({
	enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
	// Experimental features for better performance
	experimental: {
		optimizePackageImports: ["@radix-ui/react-*", "lucide-react"],
		scrollRestoration: true,
		typedRoutes: true,
	},

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
