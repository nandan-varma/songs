import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/db/schema/auth";
import { serverConfig } from "@/lib/config/server";

export const external_db = drizzle(serverConfig.DATABASE_URL, { schema });
