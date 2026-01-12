import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";

// GitHub Pages repo deployment:
// - site: https://hiteq.github.io
// - base: /woohannahdotcom
export default defineConfig({
  site: "https://hiteq.github.io",
  base: "/woohannahdotcom",
  integrations: [tailwind()],
});
