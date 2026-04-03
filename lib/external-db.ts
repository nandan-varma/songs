import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/db/schema/auth";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

export const external_db = drizzle(databaseUrl, { schema });
