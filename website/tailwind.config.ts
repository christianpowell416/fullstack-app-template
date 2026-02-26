import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand accent — change this to match your app
        'accent': '#0095F6',
        'accent-hover': '#0077CC',

        // Light mode
        'light-bg': '#FFFFFF',
        'light-card': '#FFFFFF',
        'light-border': '#DBDBDB',
        'light-text': '#000000',
        'light-text-secondary': '#666666',

        // Dark mode (admin dashboard)
        'dark-bg': '#1e1e1e',
        'dark-card': '#222222',
        'dark-border': '#333333',
        'dark-text': '#FFFFFF',
        'dark-text-secondary': '#a0a0a0',

        // Navigation bars
        'nav-bg': '#1a1a1a',
        'nav-border': '#2a2a2a',

        // Admin background
        'admin-bg': '#3a3a3a',

        // Status colors
        'success': '#4CAF50',
        'error': '#f44336',
        'warning': '#FF9500',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 4px 16px rgba(0, 0, 0, 0.15)',
        'button': '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fadeIn': 'fadeIn 0.5s ease-out',
        'slideUp': 'slideUp 0.6s ease-out',
      },
    },
  },
  plugins: [],
}
export default config
