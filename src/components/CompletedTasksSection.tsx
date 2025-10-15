import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { CompletedTaskCard } from './CompletedTaskCard';
import { InfoPopup } from './InfoPopup';
import { InfoButton } from './InfoButton';
import { typography } from '../constants/typography';
import { spacing, emptyStateSpacing } from '../constants/spacing';
import type { Task } from '../types';

interface CompletedTasksSectionProps {
  tasks: Task[];
  onTaskPress?: (task: Task) => void;
  onViewAllFinished?: () => void;
  onToggleComplete?: (taskId: string) => Promise<void>;
}

export function CompletedTasksSection({ tasks, onTaskPress, onViewAllFinished, onToggleComplete }: CompletedTasksSectionProps) {
  const [showInfoPopup, setShowInfoPopup] = useState(false);
  const hasTasks = tasks.length > 0;
  
  // Show only the first 3 completed tasks
  const displayTasks = tasks.slice(0, 3);

  const handleViewFullProgress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/view-full-progress');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          {/* Checkmark Icon */}
          <View style={styles.checkmarkIcon}>
            <Text style={styles.checkmarkText}>✓</Text>
          </View>
          
          <Text style={styles.title}>
            Today's Wins
          </Text>
          
          {/* Info Button */}
          <InfoButton onPress={() => setShowInfoPopup(true)} />
        </View>

        <Text style={styles.description}>
          Celebrate your progress and achievements.
        </Text>
      </View>

      {/* Tasks List */}
      {hasTasks ? (
        <View style={styles.tasksList}>
          {displayTasks.filter(task => task && task.id).map((task) => (
            <CompletedTaskCard
              key={task.id}
              task={task}
              onPress={() => onTaskPress?.(task)}
            />
          ))}
        </View>
      ) : (
        <CompletedTaskCard
          emptyState={{
            title: "No completed tasks today",
            description: "Complete your first task to start building momentum!"
          }}
        />
      )}
      
      {/* View All Finished Tasks Button - Always visible */}
      <Pressable
        onPress={handleViewFullProgress}
        style={styles.viewAllButton}
      >
        <Text style={styles.viewAllButtonText}>
          All Completed Tasks
        </Text>
      </Pressable>
      
      {/* Info Popup */}
      <InfoPopup
        visible={showInfoPopup}
        title="Completed Tasks"
        content="Review your completed tasks and celebrate your progress. Tap 'View All Finished Tasks' to see your complete history."
        onClose={() => setShowInfoPopup(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5EBE0',
    borderWidth: 0.5,
    borderColor: '#A3B18A',
    borderRadius: 20,
    padding: 15,
    gap: 15,
    shadowColor: '#7C7C7C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  headerContainer: {
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkmarkIcon: {
    width: 23,
    height: 23,
    backgroundColor: '#A3B18A',
    borderRadius: 11.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    fontSize: 14,
    color: '#F5EBE0',
    fontWeight: 'bold',
  },
  title: {
    flex: 1,
    ...typography.title,
  },
  description: {
    ...typography.body,
  },
  tasksList: {
    gap: 12,
  },
  viewAllButton: {
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  viewAllButtonText: {
    fontSize: 12,
    color: '#364958',
    fontFamily: 'Helvetica',
    fontWeight: 'bold',
    opacity: 0.5,
  },
});
