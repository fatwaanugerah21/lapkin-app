/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      // rem scale vs root (html font-size ~14px at 16px UA); xs/sm < base < lg…
      fontSize: {
        xs: ['0.8571428571rem', { lineHeight: '1.1428571429rem' }],
        sm: ['0.9285714286rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.1428571429rem', { lineHeight: '1.5714285714rem' }],
        xl: ['1.2857142857rem', { lineHeight: '1.7142857143rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.7142857143rem', { lineHeight: '2.1428571429rem' }],
        '4xl': ['2rem', { lineHeight: '2.2857142857rem' }],
        '5xl': ['2.2857142857rem', { lineHeight: '1' }],
        '6xl': ['2.5714285714rem', { lineHeight: '1' }],
        '7xl': ['3rem', { lineHeight: '1' }],
        '8xl': ['3.4285714286rem', { lineHeight: '1' }],
        '9xl': ['4rem', { lineHeight: '1' }],
      },
    },
  },
  plugins: [],
};
