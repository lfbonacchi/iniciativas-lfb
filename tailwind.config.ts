import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "pae-red": "#C8102E",
        "pae-blue": "#003DA5",
        "pae-green": "#00843D",
        "pae-amber": "#F59E0B",
        "pae-bg": "#EBF0F7",
        "pae-surface": "#FFFFFF",
        "pae-border": "#DDDDDD",
        "pae-text": "#333333",
        "pae-text-secondary": "#666666",
        "pae-text-tertiary": "#999999",
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
