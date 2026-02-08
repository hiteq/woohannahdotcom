import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";

// Custom domain deployment
export default defineConfig({
  site: "https://woohannah.com",
  integrations: [tailwind()],
});
