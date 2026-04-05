import { createAuthClient } from "better-auth/react"; // make sure to import from better-auth/react
import { publicConfig } from "@/lib/config/public";

export const authClient = createAuthClient({
	baseURL: publicConfig.NEXT_PUBLIC_SITE_URL,
});
