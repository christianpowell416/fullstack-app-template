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
        // Mavericks brand
        'accent': 'var(--accent)',
        'accent-hover': 'var(--accent-hover)',
        'green': '#76E59F',
        'green-hover': '#5CD88A',

        // Theme-aware colors (driven by CSS variables)
        'dark-bg': 'var(--dark-bg)',
        'dark-card': 'var(--dark-card)',
        'dark-border': 'var(--dark-border)',
        'dark-text': 'var(--dark-text)',
        'dark-text-secondary': 'var(--dark-text-secondary)',

        // Light purple surfaces
        'light-purple': '#F2EFFF',

        // Navigation
        'nav-bg': 'var(--nav-bg)',
        'nav-border': 'var(--nav-border)',

        // Admin background
        'admin-bg': 'var(--admin-bg)',

        // Status colors
        'success': '#76E59F',
        'error': '#F5527B',
        'warning': '#F5A623',
      },
      fontFamily: {
        display: ['var(--font-krona)', 'sans-serif'],
        heading: ['var(--font-space)', 'sans-serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.2)',
        'card-hover': '0 4px 16px rgba(0, 0, 0, 0.3)',
        'button': '0 2px 4px rgba(0, 0, 0, 0.2)',
        'glow': '0 0 20px rgba(112, 82, 245, 0.3)',
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
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fadeIn': 'fadeIn 0.5s ease-out forwards',
        'slideUp': 'slideUp 0.6s ease-out forwards',
        'shimmer': 'shimmer 2s infinite linear',
      },
    },
  },
  plugins: [],
}
export default config
