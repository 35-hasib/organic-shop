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
        cream: { 50: "#fdfcf8", 100: "#faf7ee", 200: "#f3ecd9" }
      },
      fontFamily: {
        sans: ["Hind Siliguri", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,.04), 0 8px 24px -16px rgba(16,24,40,.18)"
      }
    }
  },
  plugins: []
};
