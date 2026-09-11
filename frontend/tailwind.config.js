/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Official FISOP Brand Palette (SIH 26129)
        'gov-steel': '#004E98',      // Steel Azure (Primary Dark)
        'gov-blue': '#3A6EA5',       // Cornflower Ocean (Primary Interactive)
        'gov-orange': '#FF6700',     // Pumpkin Spice (Primary CTA & Accents)
        'gov-platinum': '#EBEBEB',   // Platinum (Light Neutral)
        'gov-silver': '#C0C0C0',     // Silver (Mid Neutral)
        gov: {
          primary: '#004E98',        // Steel Azure as primary
          'primary-hover': '#003870',
          'primary-light': '#e8f0fe',
          blue: '#3A6EA5',           // Cornflower Ocean
          orange: '#FF6700',         // Pumpkin Spice
          platinum: '#EBEBEB',
          silver: '#C0C0C0',
          navy: '#002f5c',
          dark: '#002244',
          gold: '#FF6700',
          border: '#d1d5db',
          surface: '#f8fafc',
          card: '#ffffff',
        },
        status: {
          success: {
            DEFAULT: '#15803d',
            bg: '#f0fdf4',
            border: '#bbf7d0',
            text: '#166534',
          },
          warning: {
            DEFAULT: '#b45309',
            bg: '#fffbeb',
            border: '#fde68a',
            text: '#92400e',
          },
          danger: {
            DEFAULT: '#b91c1c',
            bg: '#fef2f2',
            border: '#fecaca',
            text: '#991b1b',
          },
          info: {
            DEFAULT: '#0369a1',
            bg: '#f0f9ff',
            border: '#bae6fd',
            text: '#075985',
          },
          neutral: {
            DEFAULT: '#475569',
            bg: '#f1f5f9',
            border: '#e2e8f0',
            text: '#334155',
          },
        },
      },
      keyframes: {
        pulseSubtle: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.85', transform: 'scale(1.02)' },
        },
        flowLine: {
          '0%': { strokeDashoffset: '24' },
          '100%': { strokeDashoffset: '0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
      animation: {
        'pulse-subtle': 'pulseSubtle 3s ease-in-out infinite',
        'flow-line': 'flowLine 1.5s linear infinite',
        'float-slow': 'float 4s ease-in-out infinite',
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}
