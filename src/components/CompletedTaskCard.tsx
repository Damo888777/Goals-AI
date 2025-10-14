import { View, Text, Pressable, StyleSheet } from 'react-native';
import { typography } from '../constants/typography';
import { colors } from '../constants/colors';
import { spacing, borderRadius, shadows } from '../constants/spacing';
import type { Task } from '../types';
import { useState } from 'react';
import { router } from 'expo-router';

interface CompletedTaskCardProps {
  task?: Task;
  onPress?: () => void;
  emptyState?: {
    title: string;
    description: string;
  };
}

export function CompletedTaskCard({ task, onPress, emptyState }: CompletedTaskCardProps) {
  const [isPressed, setIsPressed] = useState(false);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: '2-digit', 
      year: 'numeric' 
    }).replace(/\s/g, '.');
  };

  const getProjectText = () => {
    if (task?.goalId || task?.milestoneId) {
      return 'Linked to project';
    }
    return 'No project linked';
  };

  // Empty state rendering
  if (emptyState) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateTitle}>{emptyState.title}</Text>
        <Text style={styles.emptyStateDescription}>{emptyState.description}</Text>
      </View>
    );
  }

  // Regular task rendering
  if (!task) return null;

  return (
    <Pressable 
      onPress={() => {
        if (task?.id) {
          router.push(`/task-details?id=${task.id}`);
        } else if (onPress) {
          onPress();
        }
      }} 
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      style={[
        styles.container,
        {
          backgroundColor: '#EAE2B7',
          transform: [{ scale: isPressed ? 0.98 : 1 }]
        }
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {task.title}
        </Text>
        
        <View style={styles.metaInfo}>
          <Text style={styles.projectText}>
            {getProjectText()}
          </Text>
          <View style={styles.dateRow}>
            <Text style={{ fontSize: 12, color: colors.text.primary }}>📅</Text>
            <Text style={styles.completionDate}>
              Completed: {formatDate(task.updatedAt?.toISOString() || new Date().toISOString())}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#EAE2B7',
    borderWidth: 0.5,
    borderColor: '#926C15',
    borderRadius: 20,
    padding: spacing.md,
    marginBottom: spacing.xs,
    shadowColor: '#7C7C7C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  content: {
    gap: spacing.xs,
  },
  title: {
    ...typography.body,
    fontWeight: '700',
    width: '100%',
  },
  metaInfo: {
    gap: spacing.xxs,
  },
  projectText: {
    ...typography.caption,
    color: colors.text.primary,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  completionDate: {
    ...typography.caption,
    color: colors.text.primary,
  },
  emptyState: {
    backgroundColor: '#EAE2B7',
    borderWidth: 0.5,
    borderColor: '#926C15',
    borderRadius: 20,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C7C7C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  emptyStateTitle: {
    ...typography.emptyTitle,
    marginBottom: spacing.xs,
  },
  emptyStateDescription: {
    ...typography.emptyDescription,
  },
});
