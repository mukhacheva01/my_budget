/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        stonebrown: '#5F5449',
        smokyrose: '#9B6A6C',
        rosytaupe: '#B09398',
        azuremist: '#CEDFD9',
        palemist: '#EBFCFB',
        pagebg: '#FCF6F2',
        ink: '#302B3B',
        muted: '#858195',
        success: '#4DBA83',
      },
      borderRadius: {
        card: '28px',
        lg2: '32px',
        xl2: '36px',
      },
      boxShadow: {
        card: '0 6px 24px rgba(48, 43, 59, 0.08)',
        soft: '0 2px 12px rgba(48, 43, 59, 0.06)',
      },
    },
  },
  plugins: [],
};
