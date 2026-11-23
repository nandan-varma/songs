import type { NextConfig } from "next";

const config: NextConfig = {
	agentRules: false,
	images: {
		remotePatterns: [{ protocol: "https", hostname: "**.saavncdn.com" }],
	},
};

export default config;
