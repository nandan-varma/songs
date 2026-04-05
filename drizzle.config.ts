import { defineConfig } from "drizzle-kit";
import { serverConfig } from "./lib/config/server";

export default defineConfig({
	dialect: "postgresql",
	schema: "./db/schema/",
	dbCredentials: {
		url: serverConfig.DATABASE_URL,
	},
});
