export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        leaf: {
          50: "#f3f8f1",
          100: "#e4f0df",
          200: "#c9e1c0",
          300: "#a3cb95",
          400: "#77ae65",
          500: "#569343",
          600: "#427735",
          700: "#365e2d",
          800: "#2d4b27",
          900: "#263f22",
          950: "#11220f"
        },
        cream: { 50: "#fdfcf8", 100: "#faf7ee", 200: "#f3ecd9", 300: "#e9dcbe", 400: "#d9c394" },
        clay: { 400: "#c97b5a", 500: "#b96445", 600: "#9d4e34" }
      },
      fontFamily: {
        sans: ["Hind Siliguri", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Hind Siliguri", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      boxShadow: {
        soft: "0 18px 45px -24px rgba(38,63,34,0.35)"
      }
    }
  },
  plugins: []
};
