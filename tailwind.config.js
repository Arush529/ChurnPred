/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'fx-green': '#00f298',
        'fx-green-dim': '#00bf77',
        'fx-green-glow': 'rgba(0, 242, 152, 0.35)',
        'fx-bg': '#080b10',
        'fx-deep': '#0b0e14',
        'fx-panel': '#10131a',
        'fx-panel-glass': 'rgba(16, 19, 26, 0.75)',
        'fx-card-high': '#161a21',
        'fx-card-highest': '#22262f',
        'fx-line': 'rgba(255, 255, 255, 0.08)',
        'fx-line-strong': 'rgba(255, 255, 255, 0.16)',
        'fx-muted': '#a9abb3',
        'risk-high': '#ff3366',
        'risk-medium': '#ffac52',
        'text-main': '#ecedf6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        headline: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"Space Grotesk"', 'monospace'],
      },
      boxShadow: {
        'neon': '0 0 20px rgba(0, 242, 152, 0.25)',
        'panel': '0 12px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      }
    },
  },
  plugins: [],
};
