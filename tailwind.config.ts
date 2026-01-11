import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#1a1a1a',
        foreground: '#ffffff',
        card: '#2a2a2a',
        'card-hover': '#333333',
        border: '#404040',
        primary: {
          DEFAULT: '#f97316',
          hover: '#ea580c',
        },
      },
    },
  },
  plugins: [],
}
export default config
