/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6F4E37',
          dark: '#2B2118',
          light: '#8B654C',
        },
        'dark-coffee': '#2B2118',
        accent: {
          DEFAULT: '#C98A52',
          light: '#DFC1A2',
        },
        canvas: '#F7F5F2',
        secondary: '#2B2118',
        'text-secondary': '#7A7068',
        success: '#4F8A5A',
        warning: '#D99A5B',
        danger: '#C75C5C',
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(43, 33, 24, 0.04)',
        xs: '0 1px 3px 0 rgba(43, 33, 24, 0.06)',
        sm: '0 2px 4px 0 rgba(43, 33, 24, 0.06)',
        md: '0 4px 8px -1px rgba(43, 33, 24, 0.08)',
        lg: '0 10px 15px -3px rgba(43, 33, 24, 0.1)',
      }
    }
  },
  plugins: []
}
