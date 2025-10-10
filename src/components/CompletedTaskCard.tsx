import { View, Text, Pressable, StyleSheet } from 'react-native';
import { typography } from '../constants/typography';
import type { Task } from '../types';
import { useState } from 'react';

interface CompletedTaskCardProps {
  task: Task;
  onPress?: () => void;
}

export function CompletedTaskCard({ task, onPress }: CompletedTaskCardProps) {
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
    if (task.goalId || task.milestoneId) {
      return 'Linked to project';
    }
    return 'No project linked';
  };

  return (
    <Pressable 
      onPress={onPress} 
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      style={[styles.container, isPressed && styles.containerPressed]}
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
            <Text style={{ fontSize: 12, color: '#364958' }}>📅</Text>
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
    backgroundColor: '#EAE2B7', // Same golden color as TrophyCard
    borderWidth: 0.5,
    borderColor: '#B69121', // Same golden border as TrophyCard
    borderRadius: 20,
    padding: 15,
    marginBottom: 8, // Match TaskCard spacing
    shadowColor: '#B69121',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  containerPressed: {
    shadowOffset: { width: 0, height: 2 },
  },
  content: {
    gap: 8,
  },
  title: {
    ...typography.body,
    fontWeight: '700',
    width: '100%',
  },
  metaInfo: {
    gap: 4,
  },
  projectText: {
    fontSize: 14,
    color: '#364958',
    fontFamily: 'Helvetica',
    fontWeight: '300',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  completionDate: {
    fontSize: 12,
    color: '#364958',
    fontFamily: 'Helvetica',
    fontWeight: '300',
  },
});
