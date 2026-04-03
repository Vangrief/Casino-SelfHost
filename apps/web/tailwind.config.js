/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        casino: {
          bg: '#0a0f0a',
          felt: '#1a3a1a',
          'felt-light': '#245a24',
          gold: '#d4a843',
          'gold-light': '#e8c96a',
          red: '#c42b2b',
          'red-light': '#e84545',
          card: '#1e1e2e',
          surface: '#141a14',
          border: '#2a3a2a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
