import { defineConfig } from "astro/config";
import preact from "@astrojs/preact";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://apacha01.github.io",
  base: "/noted",
  integrations: [preact()],
  vite: {
    plugins: [tailwindcss()],
  },
});
