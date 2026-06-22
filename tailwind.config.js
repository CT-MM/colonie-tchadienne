/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        tchad: {
          blue: '#002664',
          yellow: '#FECB00',
          red: '#C60C30',
          'blue-light': '#003B8E',
          'blue-dark': '#001A4D',
          'yellow-light': '#FFD633',
          'red-light': '#E01040',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
