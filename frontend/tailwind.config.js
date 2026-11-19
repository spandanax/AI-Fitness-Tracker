/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0A0A0C',
          surface: '#121318',
          card: '#181920',
          border: '#262833',
          hover: '#1F212A'
        },
        electric: {
          blue: '#3B82F6',
          cyan: '#06B6D4',
          indigo: '#6366F1'
        },
        neon: {
          green: '#10B981',
          emerald: '#059669',
          amber: '#F59E0B',
          red: '#EF4444'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
