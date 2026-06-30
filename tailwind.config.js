/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        carbon: {
          DEFAULT: '#0A0A0A',
          surface: '#161616',
          raised: '#1F1F1F',
        },
        steel: {
          DEFAULT: '#3D3D3D',
          light: '#5C5C5C',
        },
        blood: {
          DEFAULT: '#DC2626',
          dim: '#7F1D1D',
          glow: '#EF4444',
        },
        forge: {
          DEFAULT: '#C9A646',
          dim: '#8A7330',
          glow: '#E8C76A',
        },
        amberwarn: {
          DEFAULT: '#D97706',
          glow: '#F59E0B',
        },
        bone: {
          DEFAULT: '#E8E8E8',
          dim: '#A3A3A3',
        }
      },
      fontFamily: {
        display: ['"Oswald"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
      },
      boxShadow: {
        'plate': '0 0 0 1px rgba(255,255,255,0.04), 0 8px 24px -4px rgba(0,0,0,0.6)',
        'glow-green': '0 0 24px -2px rgba(34,197,94,0.35)',
        'glow-red': '0 0 24px -2px rgba(220,38,38,0.4)',
        'glow-amber': '0 0 24px -2px rgba(245,158,11,0.35)',
        'glow-gold': '0 0 30px -4px rgba(201,166,70,0.4)',
      },
      letterSpacing: {
        'widest2': '0.18em',
      }
    },
  },
  plugins: [],
}
