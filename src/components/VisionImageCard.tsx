import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '../constants/colors';
import { borderRadius, shadows } from '../constants/spacing';

interface VisionImageCardProps {
  width: number;
  height: number;
  imageUri?: string;
  style?: ViewStyle;
}

export function VisionImageCard({ width, height, imageUri, style }: VisionImageCardProps) {
  return (
    <View
      style={[
        styles.container,
        {
          width,
          height,
        },
        style
      ]}
    >
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
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
