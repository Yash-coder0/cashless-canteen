// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
    },
  },
})

// /* ── tailwind.config.js ──────────────────────────────────────── */
// /* Save this as tailwind.config.js in the client root            */
// /*
// /** @type {import('tailwindcss').Config} */
// /*
// module.exports = {
//   content: ['./index.html', './src/**/*.{js,jsx}'],
//   theme: {
//     extend: {
//       fontFamily: {
//         sans: ['DM Sans', 'sans-serif'],
//         display: ['Outfit', 'sans-serif'],
//       },
//       colors: {
//         brand: {
//           50:  '#fff7ed',
//           100: '#ffedd5',
//           200: '#fed7aa',
//           400: '#fb923c',
//           500: '#f97316',
//           600: '#ea580c',
//           700: '#c2410c',
//         },
//       },
//       boxShadow: {
//         card: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)',
//         'card-hover': '0 4px 6px rgba(0,0,0,0.07), 0 12px 32px rgba(0,0,0,0.10)',
//       },
//       animation: {
//         'fade-in': 'fadeIn 0.3s ease-out',
//         'slide-up': 'slideUp 0.3s ease-out',
//         'pulse-dot': 'pulseDot 1.5s infinite',
//       },
//       keyframes: {
//         fadeIn:   { from: { opacity: 0 }, to: { opacity: 1 } },
//         slideUp:  { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
//         pulseDot: { '0%,100%': { transform: 'scale(1)', opacity: 1 }, '50%': { transform: 'scale(1.4)', opacity: 0.7 } },
//       },
//     },
//   },
//   plugins: [],
// }
// */
