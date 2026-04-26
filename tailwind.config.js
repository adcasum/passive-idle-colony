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
        // Warm honey-themed palette. Replaces the cold Phantom-style dark.
        // Background tones lean toward toasted brown / espresso so honey-gold
        // accents read as glowing rather than sterile.
        bg: {
          DEFAULT: "#1A140A", // toasted espresso base
          elevated: "#241A0E",
          card: "#2A1F12", // warm dark card surface
          tile: "#3A2C1A", // empty slot tint
        },
        ink: {
          DEFAULT: "#FFF4D6", // soft cream
          dim: "#E2C99A", // muted honey
          mute: "#9C8868", // dim parchment
        },
        accent: {
          DEFAULT: "#FFC940", // golden honey (primary)
          deep: "#E0A810", // pressed / darker
          green: "#7BD96A", // food
          warn: "#FFB445",
          danger: "#FF6F61",
          honey: "#FFC940",
          water: "#7DD3FC",
          food: "#A5E36F",
          energy: "#FFAA3A",
        },
        border: {
          DEFAULT: "#3D2C18",
          strong: "#5A4220",
        },
      },
      fontFamily: {
        sans: ["System"],
      },
    },
  },
  plugins: [],
};
