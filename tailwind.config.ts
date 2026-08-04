import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"ABC Solar"', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
        display: ['"ABC Solar"', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', '"SF Mono"', '"Roboto Mono"', 'monospace'],
      },
      colors: {
        cream: { DEFAULT: '#F5F3EF', '2': '#ECE9E2' },
        paper: { DEFAULT: '#FFFFFF', soft: '#FAF9F6' },
        ink: { DEFAULT: '#1A1E5A', '2': '#4F5180', '3': '#8A8CA8', '4': '#C9CADD' },
        line: { DEFAULT: '#E6E4DD', soft: '#EFEEE9' },
        accent: { DEFAULT: '#5526AD', soft: '#EAE5F4', bright: '#6050DC' },
        gold: { DEFAULT: '#E2A91A', light: '#F5C84A' },
        legod: {
          purple: '#333990',
          violet: '#6050DC',
          'violet-deep': '#5526AD',
        },
        success: { DEFAULT: '#16623B', bg: '#DFF5E8', border: '#B6E2C7' },
        warning: { DEFAULT: '#8A5B0A', bg: '#FFF6DD', border: '#F5D896' },
        danger: { DEFAULT: '#A23030', bg: '#FCE3E3', border: '#F2BFBF' },
      },
      borderRadius: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '20px',
        xl: '28px',
        '2xl': '36px',
        pill: '999px',
      },
      spacing: {
        '1': '4px',  '2': '8px',  '3': '12px', '4': '16px',
        '5': '24px', '6': '32px', '7': '48px',  '8': '64px', '9': '96px',
      },
      fontSize: {
        micro:   ['11px', { lineHeight: '1.4' }],
        caption: ['12px', { lineHeight: '1.4' }],
        sm:      ['14px', { lineHeight: '1.5' }],
        base:    ['16px', { lineHeight: '1.5' }],
        'body-lg': ['18px', { lineHeight: '1.55' }],
        h4: ['22px', { lineHeight: '1.1' }],
        h3: ['28px', { lineHeight: '1.1' }],
        h2: ['36px', { lineHeight: '1.05' }],
        h1: ['48px', { lineHeight: '1.0' }],
      },
      boxShadow: {
        card:    '0 16px 40px -12px rgba(26,30,90,0.18)',
        popover: '0 24px 60px -12px rgba(26,30,90,0.25)',
        modal:   '0 32px 80px -16px rgba(26,30,90,0.35)',
        glow:    '0 0 32px rgba(96,80,220,0.55)',
      },
      letterSpacing: {
        tight:   '-0.01em',
        wide:    '0.04em',
        wider:   '0.08em',
        widest:  '0.14em',
      },
    },
  },
  plugins: [],
}

export default config
