/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#6F4E37',
        'primary-dark': '#563B29',
        'primary-light': '#8C6549',
        secondary: '#2B2118',
        'dark-coffee': '#2B2118',
        accent: '#C98A52',
        'accent-hover': '#B57943',
        canvas: '#F7F5F2',
        'bg-canvas': '#F7F5F2',
        card: '#FFFFFF',
        'text-main': '#2B2118',
        'text-muted': '#7A7068',
        success: '#4F8A5A',
        warning: '#D99A5B',
        danger: '#C75C5C',
      },
      opacity: {
        8: '0.08',
        15: '0.15',
      },
      boxShadow: {
        subtle: '0 1px 3px 0 rgba(43, 33, 24, 0.05), 0 1px 2px -1px rgba(43, 33, 24, 0.05)',
        card: '0 2px 8px -2px rgba(43, 33, 24, 0.06), 0 1px 4px -1px rgba(43, 33, 24, 0.04)',
        hover: '0 8px 20px -4px rgba(43, 33, 24, 0.10), 0 4px 8px -2px rgba(43, 33, 24, 0.06)',
      },
    },
  },
  plugins: [],
}
