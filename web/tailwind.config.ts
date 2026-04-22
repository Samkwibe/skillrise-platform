import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        xs: "420px",
        // `3xl` targets common 1440p/1600p monitors.
        "3xl": "1920px",
        // `4k` targets 4K / ultrawide panels (≥2560px).
        "4k": "2560px",
      },
      colors: {
        g: "var(--g)",
        gh: "var(--g-hover)",
        gd: "var(--gd)",
        gl: "color-mix(in srgb, var(--g) 10%, transparent)",
        ink: "var(--bg)",
        bg: "var(--bg)",
        s1: "var(--surface-1)",
        s2: "var(--surface-2)",
        s3: "var(--surface-3)",
        s4: "var(--surface-4)",
        t1: "var(--text-1)",
        t2: "var(--text-2)",
        t3: "var(--text-3)",
        amber: "var(--amber)",
        red: "var(--red)",
        blue: "var(--blue)",
        purple: "var(--purple)",
        border1: "var(--border-1)",
        border2: "var(--border-2)",
      },
      fontFamily: {
        display: ["var(--font-syne)", "sans-serif"],
        sans: ["var(--font-dm-sans)", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      borderRadius: {
        card: "14px",
        cardLg: "20px",
      },
      maxWidth: {
        mx: "1180px",
        wide: "1440px",
        xwide: "1680px",
        uwide: "1920px",
        "4k": "2400px",
      },
      boxShadow: {
        phone: "var(--shadow-phone)",
        float: "var(--shadow-float)",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        floaty: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        fadeUp: "fadeUp .55s ease forwards",
        floaty: "floaty 4.5s ease-in-out infinite",
        shimmer: "shimmer 2.4s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
