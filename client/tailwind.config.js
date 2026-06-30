/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          500: "#4f6df5",
          600: "#3d56d6",
          700: "#3045b0",
        },
      },
    },
  },
  plugins: [],
};
