// Spacing System - 8pt grid for consistent layouts
export const spacing = {
  xxs: 2,  // Extra extra small spacing
  xs: 4,   // Extra small spacing
  sm: 8,   // Small spacing
  md: 12,  // Medium spacing
  lg: 16,  // Large spacing
  xl: 20,  // Extra large spacing
  xxl: 24, // Double extra large spacing
  xxxl: 32, // Triple extra large spacing
} as const;

// Empty state content spacing
export const emptyStateSpacing = {
  titleMarginBottom: 8, // Standard spacing between title and description
  contentPadding: 8,    // Reduced padding for tighter empty state content
} as const;

// Border radius system
export const borderRadius = {
  sm: 8,   // Small radius
  md: 12,  // Medium radius
  lg: 15,  // Large radius
  xl: 20,  // Extra large radius
  card: 20, // Standard card radius
} as const;

// Shadow system
export const shadows = {
  card: {
    shadowColor: '#7C7C7C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  trophy: {
    shadowColor: '#B69121',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  pressed: {
    shadowOffset: { width: 0, height: 2 },
  },
} as const;

// Touch target sizes (Apple HIG compliant)
export const touchTargets = {
  minimum: 44, // Minimum touch target size
  button: 40,  // Standard button size
  icon: 24,    // Icon size
} as const;
