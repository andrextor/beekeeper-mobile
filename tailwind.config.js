const c = require('./src/lib/colors.json')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    colors: {
      transparent: 'transparent',
      deep: c.deep,
      leaf: c.leaf,
      sprout: c.sprout,
      honey: c.honey,
      pollen: c.pollen,
      white: c.white,
      stone: c.stone,
      bg: c.white,
      'bg-soft': c.stone['50'],
      surface: c.white,
      border: c.stone['200'],
      text: c.deep,
      muted: c.stone['700'],
      primary: c.leaf,
      'on-primary': c.white,
      accent: c.honey,
      'on-accent': c.deep,
      danger: c.danger,
      'on-danger': c.white,
      'success-bg': c.successBg,
      queen: c.queen,
    },
    fontFamily: {
      display: ['PlusJakartaSans_700Bold'],
      'display-semibold': ['PlusJakartaSans_600SemiBold'],
      sans: ['Inter_400Regular'],
      'sans-semibold': ['Inter_600SemiBold'],
      'sans-bold': ['Inter_700Bold'],
      mono: ['monospace'],
    },
    fontSize: {
      caption: ['15px', '20px'],
      body: ['17px', '24px'],
      section: ['20px', '26px'],
      title: ['26px', '32px'],
      'field-label': ['22px', '28px'],
      'field-value': ['32px', '38px'],
      code: ['28px', '36px'],
    },
    extend: {
      borderRadius: {
        button: '14px',
        card: '16px',
      },
      spacing: {
        target: '56px',
        field: '72px',
        tile: '96px',
      },
    },
  },
  plugins: [],
}
