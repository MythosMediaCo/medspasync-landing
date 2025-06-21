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
        // MedSpaSync Pro Brand Colors
        medspa: {
          primary: '#000000',
          secondary: '#FFFFFF',
          accent: '#FF6B35',
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
          info: '#3B82F6',
          // MedSpaSync Pro Neutral Palette
          grey: {
            100: '#F8F9FA',
            200: '#E9ECEF',
            300: '#DEE2E6',
            400: '#CED4DA',
            500: '#6C757D',
            600: '#495057',
            700: '#343A40',
            800: '#212529',
            900: '#000000'
          }
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['SF Mono', 'Monaco', 'Cascadia Code', 'monospace']
      },
      fontSize: {
        // MedSpaSync Pro Type Scale
        'hero': ['3.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'h1': ['2.5rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'h2': ['1.875rem', { lineHeight: '1.3' }],
        'h3': ['1.25rem', { lineHeight: '1.4' }],
        'body-large': ['1.125rem', { lineHeight: '1.6' }],
        'body': ['1rem', { lineHeight: '1.6' }],
        'body-small': ['0.875rem', { lineHeight: '1.5' }],
        'caption': ['0.75rem', { lineHeight: '1.4' }]
      },
      spacing: {
        // MedSpaSync Pro Spacing Scale (8px base unit)
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        '2xl': '48px',
        '3xl': '64px',
        '4xl': '80px'
      },
      borderRadius: {
        'medspa': '8px',
        'medspa-lg': '12px',
        'medspa-xl': '16px'
      },
      boxShadow: {
        'medspa-sm': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        'medspa-md': '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
        'medspa-lg': '0 20px 40px -10px rgba(0, 0, 0, 0.15)'
      },
      maxWidth: {
        'medspa-container': '1200px',
        'medspa-content': '800px'
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography')
  ]
};
