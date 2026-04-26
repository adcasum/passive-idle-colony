/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Phantom-inspired dark palette
        bg: {
          DEFAULT: "#0B0F1A",
          elevated: "#121826",
          card: "#1A2233",
        },
        ink: {
          DEFAULT: "#F4F6FB",
          dim: "#A6B0C3",
          mute: "#6B7388",
        },
        accent: {
          DEFAULT: "#A78BFA", // Phantom purple
          green: "#34D399",
          orange: "#F59E0B",
          honey: "#FACC15",
          water: "#60A5FA",
          food: "#84CC16",
          energy: "#F97316",
        },
        border: {
          DEFAULT: "#2A3346",
          strong: "#3A445A",
        },
      },
      fontFamily: {
        sans: ["System"],
      },
    },
  },
  plugins: [],
};
