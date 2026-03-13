import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { external_db as db } from "@/lib/external-db";

const betterAuthSecret = process.env.BETTER_AUTH_SECRET;

if (!betterAuthSecret) {
	throw new Error("BETTER_AUTH_SECRET is required");
}

export const auth = betterAuth({
	emailAndPassword: {
		enabled: true,
	},
	secret: betterAuthSecret,
	database: drizzleAdapter(db, {
		provider: "pg",
	}),
});
