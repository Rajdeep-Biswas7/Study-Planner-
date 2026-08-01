/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1B1F3B',      // primary background — deep indigo, not pure black
        surface: '#242A52',  // raised cards/panels on top of ink
        linen: '#F3EFE6',    // primary text on dark bg
        marigold: '#E8A33D', // primary accent — festival lamp / highlight
        teal: '#3E8E86',     // secondary accent — calm/done state
        rollover: '#C1584B'  // muted rust — rollover/warning state only
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Inter"', 'sans-serif']
      }
    }
  },
  plugins: []
}
