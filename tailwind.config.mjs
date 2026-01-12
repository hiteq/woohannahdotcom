/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}"],
  theme: {
    extend: {
      typography: (theme) => ({
        DEFAULT: {
          css: {
            h1: {
              marginTop: theme("spacing.12"), // 3rem
              marginBottom: theme("spacing.6"), // 1.5rem
            },
            h2: {
              marginTop: theme("spacing.10"), // 2.5rem
              marginBottom: theme("spacing.5"), // 1.25rem
            },
            h3: {
              marginTop: theme("spacing.8"), // 2rem
              marginBottom: theme("spacing.4"), // 1rem
            },
            p: {
              marginTop: theme("spacing.4"), // 1rem
              marginBottom: theme("spacing.4"), // 1rem
            },
            ul: {
              marginTop: theme("spacing.4"), // 1rem
              marginBottom: theme("spacing.4"), // 1rem
            },
            li: {
              marginTop: theme("spacing.2"), // 0.5rem
              marginBottom: theme("spacing.2"), // 0.5rem
            },
            // 이미지가 텍스트와 너무 붙지 않게
            img: {
              marginTop: theme("spacing.8"), // 2rem
              marginBottom: theme("spacing.8"), // 2rem
            },
          },
        },
      }),
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
