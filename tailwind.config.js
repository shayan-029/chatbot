/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'DM Sans'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        surface: {
          DEFAULT:  "#0d0f1a",
          card:     "#12152b",
          elevated: "#181c35",
          border:   "#252a4a",
        },
        accent: {
          DEFAULT: "#7c6ff7",
          hover:   "#9d94f9",
          glow:    "rgba(124,111,247,0.20)",
        },
        text: {
          primary:   "#f0eeff",
          secondary: "#a89ff5",
          muted:     "#4a4680",
        },
      },
      animation: {
        "fade-up":      "fadeUp 0.3s ease forwards",
        "pulse-dot":    "pulseDot 1.4s ease-in-out infinite",
        shimmer:        "shimmer 2s linear infinite",
        "turtle-float": "turtleFloat 9s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        pulseDot: {
          "0%, 80%, 100%": { transform: "scale(0.6)", opacity: "0.4" },
          "40%":           { transform: "scale(1)",   opacity: "1" },
        },
        shimmer: {
          from: { backgroundPosition: "200% 0" },
          to:   { backgroundPosition: "-200% 0" },
        },
        turtleFloat: {
          "0%":   { transform: "translateY(0px)   rotate(-4deg) scale(1)",    opacity: "0.22", filter: "drop-shadow(0 0 0px  rgba(124,111,247,0))" },
          "25%":  { transform: "translateY(-28px) rotate(4deg)  scale(1.06)", opacity: "0.34", filter: "drop-shadow(0 0 60px rgba(124,111,247,0.60))" },
          "50%":  { transform: "translateY(-12px) rotate(-2deg) scale(0.97)", opacity: "0.26", filter: "drop-shadow(0 0 24px rgba(124,111,247,0.35))" },
          "75%":  { transform: "translateY(-32px) rotate(5deg)  scale(1.08)", opacity: "0.38", filter: "drop-shadow(0 0 80px rgba(124,111,247,0.70))" },
          "100%": { transform: "translateY(0px)   rotate(-4deg) scale(1)",    opacity: "0.22", filter: "drop-shadow(0 0 0px  rgba(124,111,247,0))" },
        },
      },
    },
  },
  plugins: [],
};
