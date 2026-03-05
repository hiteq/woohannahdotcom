import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// Custom domain deployment
export default defineConfig({
  site: "https://woohannah.com",
  vite: {
    plugins: [tailwindcss()],
  },
});
