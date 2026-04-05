import { z } from "zod";
import { publicConfig } from "@/lib/config/public";

const serverConfigSchema = z.object({
	DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
	BETTER_AUTH_SECRET: z.string().min(1, "BETTER_AUTH_SECRET is required"),
	BETTER_AUTH_URL: z.string().url(),
});

export const serverConfig = serverConfigSchema.parse({
	DATABASE_URL: process.env.DATABASE_URL,
	BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
	BETTER_AUTH_URL:
		process.env.BETTER_AUTH_URL ?? publicConfig.NEXT_PUBLIC_SITE_URL,
});
