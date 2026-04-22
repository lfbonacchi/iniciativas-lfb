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
        "pae-amber-dark": "#92400E",
        "pae-yellow": "#EAB308",
        "pae-orange": "#F97316",
        "pae-orange-dark": "#9A3412",
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
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.03), 0 3px 8px -2px rgba(15,23,42,0.06)",
        "card-hover":
          "0 2px 4px rgba(0,0,0,0.04), 0 10px 20px -6px rgba(0,61,165,0.12)",
        pill: "0 1px 2px rgba(0,0,0,0.04)",
      },
      transitionDuration: {
        DEFAULT: "200ms",
      },
      transitionTimingFunction: {
        DEFAULT: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
