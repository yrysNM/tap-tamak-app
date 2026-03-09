import type { Config } from 'tailwindcss'

export default {
  content: [],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#F47B20',
          hover: '#D4611A',
          light: '#FFF8F3',
        },
        dark: '#1A1A1A',
        muted: '#666666',
        border: '#E8E8E8',
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        card: '0 2px 12px 0 rgba(0,0,0,0.06)',
        bottom: '0 -2px 12px 0 rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
} satisfies Config
