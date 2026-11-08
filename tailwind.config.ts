import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        studio: {
          950: "#090A0C",
          900: "#0F1115",
          850: "#14171E",
          800: "#1A1E27",
          700: "#242A36",
          600: "#323B4C",
          500: "#4D5970",
          400: "#8B97AB",
          300: "#C1CAD7",
          100: "#F0F3F7",
        },
        lime: {
          accent: "#D4FF00",
          glow: "rgba(212, 255, 0, 0.15)",
        },
        brand: {
          green: "#155E47",
          cream: "#F6F4EB",
          orange: "#FF7B25",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "sans-serif"],
        display: ["var(--font-display)", "Poppins", "sans-serif"],
        serif: ["var(--font-serif)", "Playfair Display", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
