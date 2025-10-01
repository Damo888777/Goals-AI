import React from 'react';
import { View, Text } from 'react-native';

// Simple icon components using View and Text for now
export const SaveIcon: React.FC<{ size?: number; color?: string }> = ({ 
  size = 20, 
  color = '#f5ebe0' 
}) => (
  <View 
    className="items-center justify-center rounded-sm"
    style={{ width: size, height: size, backgroundColor: color }}
  >
    <Text style={{ color: '#364958', fontSize: size * 0.6, fontWeight: 'bold' }}>💾</Text>
  </View>
);

// Cancel/X Icon Component
export const CancelIcon: React.FC<{ size?: number; color?: string }> = ({ 
  size = 20, 
  color = '#f5ebe0' 
}) => (
  <View 
    className="items-center justify-center rounded-sm"
    style={{ width: size, height: size, backgroundColor: color }}
  >
    <Text style={{ color: '#364958', fontSize: size * 0.8, fontWeight: 'bold' }}>✕</Text>
  </View>
);

// Chevron Down Icon Component
export const ChevronDownIcon: React.FC<{ size?: number; color?: string }> = ({ 
  size = 20, 
  color = '#364958' 
}) => (
  <View 
    className="items-center justify-center"
    style={{ width: size, height: size }}
  >
    <Text style={{ color, fontSize: size * 0.8 }}>▼</Text>
  </View>
);

// Frog Icon Component
export const FrogIcon: React.FC<{ size?: number; color?: string }> = ({ 
  size = 20, 
  color = '#364958' 
}) => (
  <View 
    className="items-center justify-center"
    style={{ width: size, height: size }}
  >
    <Text style={{ fontSize: size * 0.8 }}>🐸</Text>
  </View>
);

// Plus Icon Component
export const PlusIcon: React.FC<{ size?: number; color?: string }> = ({ 
  size = 20, 
  color = '#364958' 
}) => (
  <View 
    className="items-center justify-center"
    style={{ width: size, height: size }}
  >
    <Text style={{ color, fontSize: size * 0.8, fontWeight: 'bold' }}>+</Text>
  </View>
);

// Check Icon Component
export const CheckIcon: React.FC<{ size?: number; color?: string }> = ({ 
  size = 20, 
  color = '#364958' 
}) => (
  <View 
    className="items-center justify-center"
    style={{ width: size, height: size }}
  >
    <Text style={{ color, fontSize: size * 0.8, fontWeight: 'bold' }}>✓</Text>
  </View>
);
