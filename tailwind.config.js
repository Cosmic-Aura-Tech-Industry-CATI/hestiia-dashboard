/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          light: '#F5D77F',
          DEFAULT: '#D4AF37',
          dark: '#AA820A',
        },
        charcoal: {
          950: '#0F0F12',
          DEFAULT: '#16161B',
          card: '#1B1B22',
          border: '#272732',
        },
        warmwhite: '#FAFAFA',
        beige: {
          DEFAULT: '#A1A1AA',
          muted: '#71717A',
        },
      },
      fontFamily: {
        serif: ['Cinzel', 'Playfair Display', 'serif'],
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
