// Design System Colors from Figma
export const colors = {
  // Primary Background Colors
  background: {
    primary: '#E9EDC9',      // Main app background (light green)
    secondary: '#F5EBE0',    // Card backgrounds (cream)
    tertiary: '#EAE0D5',     // Navigation bar (light tan)
  },
  
  // Text Colors
  text: {
    primary: '#364958',      // Main text (dark blue-gray)
    tertiary: '#7C7C7C',     // Tertiary/disabled text (gray)
  },
  
  // Border Colors
  border: {
    primary: '#A3B18A',      // Main borders (sage green)
    secondary: '#9B9B9B',    // Secondary borders (gray)
    dark: '#000814',         // Dark borders
  },
  
  // Accent Colors
  accent: {
    frog: '#A3B18A',         // Eat the Frog accent
    task: '#E9EDC9',         // Task card background
    fab: '#364958',          // FAB button (dark blue-gray)
  },
  
  // Emotion Badge Colors
  emotion: {
    happy: {
      bg: '#BDE0FE',
      border: '#023047',
      text: '#023047',
    },
    proud: {
      bg: '#CDB4DB',
      border: '#3D405B',
      text: '#3D405B',
    },
    counter: {
      bg: '#FCB9B2',
      border: '#BC4749',
      text: '#BC4749',
    },
  },
  
  // Goal Colors
  goal: {
    card: '#E9EDC9',
    progress: '#A1C181',
  },
  
  // Trophy/Vision Colors
  trophy: {
    bg: '#EAE2B7',
    border: '#926C15',
  },
  
  // Completed Task Colors
  completedTask: '#EAE2B7',
  completedTaskPressed: '#D4D1A1',
  
  // Button Colors
  button: {
    primary: '#364958',
    secondary: '#F5EBE0',
    cancel: '#F5EBE0',
    save: '#364958',
  },
  
  // Additional color aliases for components
  primary: '#364958',
  secondary: '#F5EBE0',
  success: '#A3B18A',
  error: '#B23A48',
  white: '#FFFFFF',
  lightGray: '#F5F5F5',
  textSecondary: '#7C7C7C',
} as const;
