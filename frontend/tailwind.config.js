/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx,css,scss,sass,less}"],
  theme: {
    extend: {
      colors: {
        custom_red: "rgb(165, 42, 42)",
        custom_less_red: "rgba(165, 42, 42, 0.85)",
        custom_dark_red: "rgb(130, 17, 49)",
        custom_white: "rgba(255, 255, 255, 1)",
        custom_black: "#000000",
        custom_gray: "#686D76",
        custom_less_gray: "rgb(228, 224, 225)",
        custom_hr_gray: "#aaaaaa5e",
        // "custom-super-less-gray": "rgba(238, 238, 238, 0.25)",
        // "custom-backdrop": "#2C3333",
        custom_green: "#7F9F80",
        custom_dark_blue: "#131921",
        custom_blue: "#1679AB",
        custom_less_blue: "rgb(137, 168, 178)",
        custom_yellow: "rgb(231, 210, 131)",
        custom_pale_yellow: "#EBE4D1",
        custom_pale_orange: "#E8B86D",
      },
      fontFamily: {
        cursive: ['"Dancing Script"', "cursive"],
      },
      keyframes: {
        jump: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-0.5rem)" },
        },
        stretch: {
          "0%, 100%": { transform: "scaleY(1)" },
          "50%": { transform: "scaleY(1.5)" },
        },
        glow: {
          "0%, 100%": { textShadow: "0 0 0 rgba(255,255,255,0)" },
          "50%": { textShadow: "0 0 8px rgba(255,255,255,0.8)" },
        },
        grow: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.3)" },
        },
      },
      animation: {
        "jump-sm": "jump 1s ease-in-out infinite",
        "stretch-sm": "stretch 1.2s ease-in-out infinite",
        "glow-sm": "glow 2s ease-in-out infinite",
        "grow-sm": "grow 1.5s ease-in-out infinite",
      },
    },
    variants: { animation: ["responsive"] },
  },
  plugins: [],
};
