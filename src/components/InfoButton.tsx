import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

interface InfoButtonProps {
  onPress: () => void;
}

export function InfoButton({ onPress }: InfoButtonProps) {
  return (
    <Pressable 
      style={styles.infoButton}
      onPress={onPress}
    >
      <View style={styles.infoCircle}>
        <Text style={styles.infoText}>i</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  infoButton: {
    width: 18,  // Increased for better touch target
    height: 18, // Increased for better touch target
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCircle: {
    width: 13,
    height: 13,
    borderWidth: 1,
    borderColor: '#7C7C7C',
    borderRadius: 6.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#7C7C7C',
    textAlign: 'center',
    lineHeight: 11,  // Better vertical alignment
    marginTop: -0.5, // Fine-tune vertical position
  },
});