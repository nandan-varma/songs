import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import svelte from "@astrojs/svelte";
import node from "@astrojs/node";

import vercel from "@astrojs/vercel";

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [tailwind(), svelte()],
  adapter: vercel(),
});