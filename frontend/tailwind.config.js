export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Non-blue palette
        primary: '#7c3aed', // violet-600
        accent: '#f59e0b',  // amber-500
      },
      fontFamily: {
        // Two typographies: display for headings, sans for body
        display: ['Poppins', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'Inter', 'Arial', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
      },
    },
  },
  darkMode: 'class',
  plugins: [],
}
