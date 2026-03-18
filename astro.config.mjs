import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

// Custom domain deployment
export default defineConfig({
  site: "https://woohannah.com",
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
