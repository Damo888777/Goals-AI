import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '../constants/colors';
import { borderRadius, shadows } from '../constants/spacing';

interface VisionImageCardProps {
  width: number;
  height: number;
  imageUrl?: string;
  style?: ViewStyle;
}

export function VisionImageCard({ width, height, imageUrl, style }: VisionImageCardProps) {
  return (
    <View
      style={[
        {
          width,
          height,
          backgroundColor: '#E3E3E3',
          borderRadius: 12,
          overflow: 'hidden',
        },
        style
      ]}
    >
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          contentFit="cover"
        />
      ) : (
        <View style={styles.placeholder} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.sm,
    borderWidth: 0.5,
    borderColor: colors.border.primary,
    backgroundColor: colors.background.secondary,
    overflow: 'hidden',
    ...shadows.card,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.background.primary,
  },
});
