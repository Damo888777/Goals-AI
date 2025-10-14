import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { TaskCard } from './TaskCard';
import { InfoPopup } from './InfoPopup';
import { InfoButton } from './InfoButton';
import { images } from '../constants/images';
import { typography } from '../constants/typography';
import { INFO_CONTENT } from '../constants/infoContent';
import type { Task } from '../types';
import { useState } from 'react';

interface TodaysTasksSectionProps {
  tasks: Task[];
  onTaskPress?: (task: Task) => void;
  onAddTask?: () => void;
  onToggleComplete?: (taskId: string) => Promise<void>;
  onDelete?: (taskId: string) => Promise<void>;
}

export function TodaysTasksSection({ tasks, onTaskPress, onAddTask, onToggleComplete, onDelete }: TodaysTasksSectionProps) {
  const [showInfoPopup, setShowInfoPopup] = useState(false);
  const hasTasks = tasks.length > 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          {/* Notes Icon */}
          <Image 
            source={{ uri: images.icons.notes }} 
            style={styles.icon}
            contentFit="contain"
          />
          
          <Text style={styles.title}>
            Todays Tasks
          </Text>
          
          {/* Info Button */}
          <InfoButton onPress={() => setShowInfoPopup(true)} />
        </View>

        <Text style={styles.description}>
          Take action and get a step closer to your dreams.
        </Text>
      </View>

      {/* Tasks List */}
      {hasTasks ? (
        <View style={styles.tasksList}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              variant={task.isComplete ? 'completed' : (task.scheduledDate ? 'active-with-date' : 'active-without-date')}
              onPress={() => onTaskPress?.(task)}
              onToggleComplete={onToggleComplete}
              onDelete={onDelete}
            />
          ))}
        </View>
      ) : (
        <TaskCard variant="empty-today" onPress={onAddTask} />
      )}
      
      {/* Info Popup */}
      <InfoPopup
        visible={showInfoPopup}
        title={INFO_CONTENT.TODAYS_TASKS.title}
        content={INFO_CONTENT.TODAYS_TASKS.content}
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
  icon: {
    width: 23,
    height: 23,
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
});
