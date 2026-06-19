/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        base:    '#0e0e10',
        surface: '#18181b',
        border:  '#27272a',
        muted:   '#52525b',
        text:    '#e4e4e7',
        subtle:  '#a1a1aa',
        amber:   '#f59e0b',
        'amber-dim': '#78350f',
      },
      fontFamily: {
        mono: ['"IBM Plex Mono"', 'monospace'],
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
