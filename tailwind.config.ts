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
        arc: {
          bg: '#0a0a0f',
          card: '#13131a',
          border: '#1e1e2e',
          accent: '#00d4aa',
          blue: '#4f8ef7',
          text: '#c7c5d1',
          muted: '#6b6580',
        }
      },
      backgroundImage: {
        'arc-gradient': 'linear-gradient(135deg, #00d4aa 0%, #4f8ef7 100%)',
      }
    },
  },
  plugins: [],
}

export default config
