import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from "@/db/schema/auth";
import { external_db as db } from "@/lib/external-db";

const betterAuthSecret = process.env.BETTER_AUTH_SECRET;
const baseURL = process.env.BETTER_AUTH_URL;

if (!betterAuthSecret) {
  throw new Error("BETTER_AUTH_SECRET is required");
}

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
  },
  secret: betterAuthSecret,
  baseURL:
    baseURL ||
    (typeof window === "undefined" ? undefined : window.location.origin),
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
});
