/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      opacity: {
        8: '0.08',
        12: '0.12',
        14: '0.14',
        16: '0.16',
        18: '0.18',
        22: '0.22',
        28: '0.28',
        68: '0.68',
        72: '0.72',
        74: '0.74',
        76: '0.76',
        78: '0.78',
        82: '0.82',
        86: '0.86',
        88: '0.88',
        92: '0.92',
        94: '0.94',
        96: '0.96'
      },
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        lab: {
          navy: '#0b1220',
          panel: '#111b2e',
          surface: '#162238',
          border: '#1e3252',
          pcb: '#0f5132',
          pcbLight: '#10b981',
          cyan: '#22d3ee',
          amber: '#f59e0b',
          hot: '#ef4444',
          cold: '#3b82f6'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace']
      },
      boxShadow: {
        'glow-cyan': '0 0 24px -4px rgba(34, 211, 238, 0.4)',
        'glow-pcb': '0 0 24px -4px rgba(16, 185, 129, 0.4)',
        'glow-amber': '0 0 24px -4px rgba(245, 158, 11, 0.4)',
        'glow-hot': '0 0 24px -4px rgba(239, 68, 68, 0.45)',
        'glow-cold': '0 0 24px -4px rgba(59, 130, 246, 0.45)'
      },
      backgroundImage: {
        'pcb-grid':
          'linear-gradient(to right, rgba(34,211,238,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(34,211,238,0.06) 1px, transparent 1px)'
      },
      backgroundSize: {
        'pcb-grid': '40px 40px'
      }
    }
  },
  plugins: []
};
