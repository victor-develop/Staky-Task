/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['Menlo', 'Monaco', 'Courier New', 'monospace'],
      },
      colors: {
        term: {
          bg: '#0c0c0c',
          fg: '#cccccc',
          green: '#22c55e',
          blue: '#3b82f6',
          yellow: '#eab308',
          red: '#ef4444',
          gray: '#3f3f46',
          cursor: '#22c55e'
        }
      },
      animation: {
        'blink': 'blink 1s step-end infinite',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        }
      }
    }
  },
  plugins: [],
}