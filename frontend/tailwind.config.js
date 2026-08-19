/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0f172a'
        },
        success: {
          50: '#ecfdf5',
          500: '#22c55e',
          600: '#16a34a'
        },
        danger: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626'
        },
        warning: {
          50: '#fffbeb',
          500: '#f59e0b',
          600: '#d97706'
        }
      },
      boxShadow: {
        soft: '0 20px 45px -22px rgba(15, 23, 42, 0.22)',
        glow: '0 18px 40px rgba(14, 165, 233, 0.18)'
      }
    }
  },
  plugins: []
};
