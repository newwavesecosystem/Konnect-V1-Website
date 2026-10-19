/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./public/index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#002882',
          green: '#227451',
          sky: '#84C1FF',
          navy: '#0A1B3D',
          ink: '#333A45',
          cloud: '#F7F9FC',
          line: '#DCE4F0',
          blueTint: '#EAF1FF',
          greenTint: '#EAF6EF'
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Sora', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        soft: '0 12px 36px rgba(10, 27, 61, 0.08)',
        float: '0 24px 70px rgba(10, 27, 61, 0.14)'
      }
    }
  },
  plugins: []
}
