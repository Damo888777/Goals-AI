/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  darkMode: 'class',
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Primary Background Colors
        'bg-primary': '#E9EDC9',
        'bg-secondary': '#F5EBE0',
        'bg-tertiary': '#EAE0D5',
        
        // Text Colors
        'text-primary': '#364958',
        'text-secondary': '#344E41',
        'text-tertiary': '#7C7C7C',
        
        // Border Colors
        'border-primary': '#A3B18A',
        'border-secondary': '#9B9B9B',
        'border-dark': '#000814',
        
        // Accent Colors
        'accent-frog': '#A3B18A',
        'accent-task': '#E9EDC9',
        'accent-fab': '#364958',
        
        // Goal Colors
        'goal-card': '#E9EDC9',
        'goal-progress': '#A1C181',
        
        // Trophy Colors
        'trophy-bg': '#EAE2B7',
        'trophy-border': '#926C15',
      },
      fontFamily: {
        'helvetica': ['Helvetica', 'sans-serif'],
        'helvetica-light': ['Helvetica-Light', 'sans-serif'],
        'helvetica-bold': ['Helvetica-Bold', 'sans-serif'],
      },
      borderRadius: {
        'card': '20px',
        'button': '10px',
        'small': '5px',
      },
    },
  },
  plugins: [],
};
