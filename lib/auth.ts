import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from "@/db/schema/auth";
import { serverConfig } from "@/lib/config/server";
import { external_db as db } from "@/lib/external-db";

export const auth = betterAuth({
	emailAndPassword: {
		enabled: true,
	},
	secret: serverConfig.BETTER_AUTH_SECRET,
	baseURL: serverConfig.BETTER_AUTH_URL,
	database: drizzleAdapter(db, {
		provider: "pg",
		schema,
	}),
});
