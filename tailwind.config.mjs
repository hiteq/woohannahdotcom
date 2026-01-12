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
            img: {
              marginTop: theme("spacing.8"), // 2rem
              marginBottom: theme("spacing.2"), // 이미지-캡션 간격 줄임
            },
          },
        },
      }),
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
