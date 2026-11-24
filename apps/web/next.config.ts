import type { NextConfig } from "next";

const config: NextConfig = {
	agentRules: false,
	images: { unoptimized: true },
	headers: async () => [
		{
			source: "/:path*",
			headers: [
				{
					key: "X-Robots-Tag",
					value: "noindex, nofollow, noarchive, noimageai, noai",
				},
			],
		},
	],
};

export default config;
