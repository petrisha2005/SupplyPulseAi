/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1F160F",
        panel: "#FBF7EF",
        brand: "#0F9F8A"
      },
      boxShadow: {
        soft: "0 18px 44px rgba(42, 26, 18, 0.10)"
      }
    }
  },
  plugins: []
};
