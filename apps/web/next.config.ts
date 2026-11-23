import type { NextConfig } from "next";

const config: NextConfig = {
	agentRules: false,
	images: {
		remotePatterns: [
			{ protocol: "https", hostname: "**.saavncdn.com" },
			{ protocol: "https", hostname: "www.jiosaavn.com" },
		],
	},
};

export default config;
