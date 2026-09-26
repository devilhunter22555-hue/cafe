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
          DEFAULT: '#C98A5B',
          light: '#E6C5A8',
        },
        canvas: '#F7F5F2',
        card: '#FFFFFF',
        secondary: '#241B15',
        'text-primary': '#241B15',
        'text-secondary': '#81766D',
        border: '#E8E1DA',
        success: '#4F8A5A',
        warning: '#D99A5B',
        danger: '#C75C5C',
      },
      fontFamily: {
        sans: ['Inter', 'DM Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(36, 27, 21, 0.03)',
        xs: '0 1px 3px 0 rgba(36, 27, 21, 0.05)',
        sm: '0 2px 6px -1px rgba(36, 27, 21, 0.06)',
        md: '0 6px 16px -3px rgba(36, 27, 21, 0.08)',
        lg: '0 12px 24px -4px rgba(36, 27, 21, 0.10)',
        xl: '0 20px 32px -8px rgba(36, 27, 21, 0.14)',
      },
    },
  },
  plugins: [],
}
