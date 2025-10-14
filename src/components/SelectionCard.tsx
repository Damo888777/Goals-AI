import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, borderRadius, shadows, touchTargets } from '../constants/spacing';
import { BaseCard } from './BaseCard';

export type SelectionType = 'task' | 'goal' | 'milestone';

interface SelectionOption {
  type: SelectionType;
  label: string;
}

interface SelectionCardProps {
  selectedType: SelectionType;
  onTypeChange: (type: SelectionType) => void;
  options?: SelectionOption[];
}

export function SelectionCard({ 
  selectedType, 
  onTypeChange, 
  options = [
    { type: 'task', label: 'Task' },
    { type: 'goal', label: 'Goal' },
    { type: 'milestone', label: 'Milestone' }
  ]
}: SelectionCardProps) {
  return (
    <BaseCard variant="secondary" padding="xl">
      <View style={styles.container}>
        {options.map((option, index) => (
          <TouchableOpacity
            key={option.type}
            style={[
              styles.optionButton,
              index === 0 && styles.firstOption,
              index === options.length - 1 && styles.lastOption,
            ]}
            onPress={() => onTypeChange(option.type)}
          >
            <View style={[
              styles.radioButton,
              selectedType === option.type ? styles.radioButtonSelected : styles.radioButtonUnselected
            ]} />
            <Text style={[
              styles.optionLabel,
              selectedType === option.type && styles.optionLabelSelected
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </BaseCard>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: touchTargets.minimum,
  },
  firstOption: {
    borderTopLeftRadius: borderRadius.md,
    borderTopRightRadius: borderRadius.md,
  },
  lastOption: {
    borderBottomLeftRadius: borderRadius.md,
    borderBottomRightRadius: borderRadius.md,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    marginRight: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    backgroundColor: colors.border.primary,
    borderColor: colors.border.primary,
  },
  radioButtonUnselected: {
    backgroundColor: colors.border.secondary,
    borderColor: colors.border.primary,
  },
  optionLabel: {
    ...typography.cardTitle,
    flex: 1,
  },
  optionLabelSelected: {
    fontWeight: '700',
  },
});
