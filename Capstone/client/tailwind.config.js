/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: '#10142B',
        mist: '#F1F2F8',
        brand: { DEFAULT: '#4F3BE8', dark: '#3A28C4', soft: '#E9E6FD' },
        sun: '#FFC53D',
        ok: '#0F9D74',
        bad: '#D6335A',
      },
    },
  },
  plugins: [],
};
