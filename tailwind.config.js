/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Background palette
        void: '#080810',
        charcoal: '#0d0d1a',
        surface: '#111124',
        elevated: '#181830',
        border: '#ffffff0d',

        // Red accent palette
        crimson: {
          50:  '#fff1f1',
          100: '#ffe0e0',
          200: '#ffc5c5',
          300: '#ff9898',
          400: '#ff5a5a',
          500: '#f72b2b',
          600: '#e01010',
          700: '#b80000',
          800: '#960909',
          900: '#7c0d0d',
          950: '#430000',
        },

        // Muted tones
        muted: '#6b7280',
        subtle: '#9ca3af',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'radial-void': 'radial-gradient(ellipse at top, #1a0a0a 0%, #080810 50%, #000000 100%)',
        'radial-night': 'radial-gradient(ellipse at center, #0a0a1f 0%, #050508 100%)',
        'gradient-red': 'linear-gradient(135deg, #b80000 0%, #7c0d0d 100%)',
        'gradient-glass': 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
        'red-glow': '0 0 20px rgba(183,0,0,0.4), 0 0 60px rgba(183,0,0,0.15)',
        'card': '0 4px 24px rgba(0,0,0,0.5)',
        'modal': '0 24px 80px rgba(0,0,0,0.8)',
        'player': '0 2px 12px rgba(0,0,0,0.4)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flicker': 'flicker 4s linear infinite',
        'fog-drift': 'fogDrift 20s ease-in-out infinite',
      },
      keyframes: {
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
          '75%': { opacity: '0.95' },
        },
        fogDrift: {
          '0%, 100%': { transform: 'translateX(0) translateY(0)' },
          '33%': { transform: 'translateX(20px) translateY(-10px)' },
          '66%': { transform: 'translateX(-15px) translateY(5px)' },
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
