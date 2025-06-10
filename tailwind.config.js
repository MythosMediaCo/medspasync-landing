/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './public/**/*.html',
    './public/**/*.js',
    './server/**/*.js'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#3B82F6',
          purple: '#8B5CF6',
          green: '#10B981',
          yellow: '#FACC15'
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui']
      }
    }
  },
  plugins: []
};
