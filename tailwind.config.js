/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Netflix brand palette — used throughout the app
        netflix: {
          red: '#E50914',       // primary accent (buttons, logo)
          dark: '#141414',      // page background
          gray: '#808080',      // secondary text
          lightgray: '#B3B3B3', // muted text
        },
      },
      fontFamily: {
        sans: ['Netflix Sans', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(to right, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 60%)',
        'row-gradient': 'linear-gradient(to top, rgba(20,20,20,1) 0%, rgba(20,20,20,0) 100%)',
      },
    },
  },
  plugins: [],
}

