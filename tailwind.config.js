/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
      },
      colors: {
        navy: {
          950: '#071C2C',
          900: '#0B3D5C',
          800: '#124F73',
          700: '#1A6288',
        },
        teal: {
          600: '#0F7173',
          500: '#128F8C',
          100: '#DCF3EF',
        },
        amber: {
          500: '#F2A93B',
          100: '#FDF0DC',
        },
        coral: {
          600: '#E7594F',
          100: '#FBE4E2',
        },
        cloud: {
          50: '#F7FAFC',
          100: '#EEF3F6',
          200: '#DFE7EC',
        },
        storm: {
          700: '#435570',
          500: '#66788F',
          300: '#AAB6C4',
        },
      },
      boxShadow: {
        soft: '0 1px 2px rgba(11,61,92,0.06), 0 8px 24px rgba(11,61,92,0.08)',
      },
      borderRadius: {
        card: '14px',
      },
    },
  },
  plugins: [],
}
