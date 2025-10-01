// Global Typography System - Based on Today's Tasks hierarchy
export const typography = {
  // Section titles - 20px Bold (for headers like "Today's Tasks")
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#364958',
  },
  
  // Body text - 15px Light (for descriptions)
  body: {
    fontSize: 15,
    fontWeight: '300' as const,
    color: '#364958',
  },
  
  // Task/Card titles - 15px Bold (primary content in cards)
  cardTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#364958',
  },
  
  // Card descriptions - 10px Light (secondary content in cards)
  cardDescription: {
    fontSize: 10,
    fontWeight: '300' as const,
    color: '#364958',
  },
  
  // Small text for badges, counters, etc.
  small: {
    fontSize: 10,
    fontWeight: '400' as const,
    color: '#364958',
  },
} as const;
