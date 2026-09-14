export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        /* Healthcare Blue — primary brand & actions */
        brand: {
          DEFAULT: '#2563eb',
          dark: '#1d4ed8',
          mid: '#3b82f6',
          tint: '#eaf1fe',
          tint2: '#f5f9ff',
        },
        /* Healthcare Green — success / secondary surfaces */
        health: {
          DEFAULT: '#0f9d6b',
          dark: '#0b7d55',
          mid: '#16b57f',
          tint: '#e8f6ef',
          tint2: '#f3faf6',
        },
        /* Deep navy — primary text */
        navy: {
          DEFAULT: '#0f2942',
          soft: '#1f3f5c',
        },
        ink: {
          500: '#64748b',
          400: '#94a3b8',
        },
        line: {
          DEFAULT: '#e3e8f0',
          soft: '#eef1f6',
        },
        info: {
          DEFAULT: '#2563eb',
          tint: '#e8effd',
        },
        success: {
          DEFAULT: '#0f9d6b',
          tint: '#e8f6ef',
        },
        warn: {
          DEFAULT: '#b45309',
          tint: '#fdf2e3',
        },
        error: {
          DEFAULT: '#dc2626',
          tint: '#fdecec',
        },
        surface: {
          DEFAULT: '#ffffff',
          soft: '#f6f8fb',
        },
      },
      spacing: {
        '4.5': '1.125rem',
      },
      borderRadius: {
        card: '14px',
        chip: '8px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 41, 66, 0.04), 0 1px 3px rgba(15, 41, 66, 0.06)',
        pop: '0 8px 24px -8px rgba(15, 41, 66, 0.18)',
        float: '0 12px 32px -12px rgba(15, 41, 66, 0.28)',
      },
      maxWidth: {
        shell: '1480px',
      },
      fontSize: {
        '2xs': ['11px', '15px'],
      },
    },
  },
}