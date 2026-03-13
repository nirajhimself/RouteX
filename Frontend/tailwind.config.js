/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          red: "#e8001d",
          "red-dark": "#b8001a",
          "red-glow": "rgba(232,0,29,0.25)",
        },
        dark: {
          900: "#070a0f",
          800: "#0c1018",
          700: "#111723",
          600: "#18202e",
          500: "#1f2a3c",
          400: "#2a3a52",
          300: "#3d5068",
        },
        // Light mode surface palette
        light: {
          bg: "#f0f2f8",
          card: "#ffffff",
          border: "#e4e9f2",
          border2: "#d0d7e8",
          sidebar: "#ffffff",
          hover: "#f5f7fd",
          muted: "#8896b3",
          sub: "#b0bcd4",
        },
      },
      fontFamily: {
        sans: ["Geist", "Inter", "system-ui", "sans-serif"],
        mono: ["Geist Mono", "JetBrains Mono", "monospace"],
        display: ["Syne", "sans-serif"],
      },
      boxShadow: {
        "red-glow": "0 0 20px rgba(232,0,29,0.3)",
        card: "0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)",
        "card-hover": "0 4px 16px rgba(0,0,0,0.5)",
        // Light mode shadows
        "light-card":
          "0 2px 8px rgba(17,24,60,0.06), 0 0 1px rgba(17,24,60,0.08)",
        "light-hover":
          "0 8px 24px rgba(17,24,60,0.10), 0 0 1px rgba(17,24,60,0.08)",
        "light-sidebar": "2px 0 16px rgba(17,24,60,0.06)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "slide-in": "slideIn 0.3s ease",
        "fade-in": "fadeIn 0.4s ease",
      },
      keyframes: {
        slideIn: {
          from: { opacity: 0, transform: "translateX(-12px)" },
          to: { opacity: 1, transform: "none" },
        },
        fadeIn: {
          from: { opacity: 0, transform: "translateY(8px)" },
          to: { opacity: 1, transform: "none" },
        },
      },
    },
  },
  plugins: [],
};
