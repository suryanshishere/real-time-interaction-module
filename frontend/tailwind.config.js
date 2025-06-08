/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx,css,scss,sass,less}"],
  theme: {
    extend: {
      fontFamily: {
        cursive: ['"Dancing Script"', "cursive"],
      },
      keyframes: {
        jump: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':     { transform: 'translateY(-0.5rem)' },
        },
        stretch: {
          '0%, 100%': { transform: 'scaleY(1)' },
          '50%':     { transform: 'scaleY(1.5)' },
        },
        glow: {
          '0%, 100%': { textShadow: '0 0 0 rgba(255,255,255,0)' },
          '50%':     { textShadow: '0 0 8px rgba(255,255,255,0.8)' },
        },
         grow: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%':     { transform: 'scale(1.3)' },
        },
      },
      animation: {
        'jump-sm':    'jump 1s ease-in-out infinite',
        'stretch-sm': 'stretch 1.2s ease-in-out infinite',
        'glow-sm':    'glow 2s ease-in-out infinite',
         'grow-sm': 'grow 1.5s ease-in-out infinite',
      },
    },
    variants: { animation: ['responsive'] },
  },
  plugins: [],
};
