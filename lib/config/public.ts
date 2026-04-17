import { z } from "zod";

function getDefaultSiteUrl() {
	if (process.env.NEXT_PUBLIC_SITE_URL) {
		return process.env.NEXT_PUBLIC_SITE_URL;
	}

	if (process.env.BETTER_AUTH_URL) {
		return process.env.BETTER_AUTH_URL;
	}

	if (process.env.VERCEL_URL) {
		return `https://${process.env.VERCEL_URL}`;
	}

	return "http://localhost:3000";
}

const publicConfigSchema = z.object({
	NEXT_PUBLIC_API_URL: z
		.string()
		.url()
		.default("https://saavn-api.nandanvarma.com/api"),
	NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
});

export const publicConfig = publicConfigSchema.parse({
	NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
	NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || getDefaultSiteUrl(),
});

export const metadataBase = new URL(publicConfig.NEXT_PUBLIC_SITE_URL);
