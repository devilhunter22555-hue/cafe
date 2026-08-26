/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#EA580C',
        secondary: '#1E293B',
        success: '#16A34A',
        danger: '#DC2626',
        warning: '#D97706',
      },
    },
  },
  plugins: [],
}

