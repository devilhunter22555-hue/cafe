/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#EA580C',
        'primary-dark': '#C2410C',
        secondary: '#0F172A',
        canvas: '#F8FAFC',
        'bg-canvas': '#F8FAFC',
        success: '#16A34A',
        danger: '#DC2626',
        warning: '#D97706',
      },
      opacity: {
        8: '0.08',
      },
    },
  },
  plugins: [],
}
