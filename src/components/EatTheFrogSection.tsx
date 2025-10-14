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

interface EatTheFrogSectionProps {
  frogTask?: Task | null;
  onAddFrogTask?: (taskData: {
    title: string;
    scheduledDate: Date;
    isFrog: boolean;
    creationSource: 'spark' | 'manual';
  }) => Promise<void>;
  onSelectFrog?: () => void;
  onToggleComplete?: (taskId: string) => Promise<void>;
  onDelete?: (taskId: string) => Promise<void>;
}

export function EatTheFrogSection({ frogTask, onAddFrogTask, onSelectFrog, onToggleComplete, onDelete }: EatTheFrogSectionProps) {
  const [showInfoPopup, setShowInfoPopup] = useState(false);
  const handleSelectFrog = async () => {
    try {
      // Create a new frog task for today if none exists
      if (!frogTask) {
        const today = new Date();
        await onAddFrogTask?.({
          title: 'New Frog Task',
          scheduledDate: today,
          isFrog: true,
          creationSource: 'manual'
        });
      }
    } catch (error) {
      console.error('Error creating frog task:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          {/* Frog Icon */}
          <Image 
            source={{ uri: images.icons.frog }} 
            style={styles.icon}
            contentFit="contain"
          />
          
          <Text style={styles.title}>
            Eat the frog
          </Text>
          
          {/* Info Button */}
          <InfoButton onPress={() => setShowInfoPopup(true)} />
        </View>

        {/* Description */}
        <Text style={styles.description}>
          Choose the one task that will make the biggest impact today.
        </Text>
      </View>

      {/* Task Card */}
      <TaskCard 
        task={frogTask}
        variant={frogTask ? 'active-frog' : 'empty-frog'}
        onPress={onSelectFrog}
        onToggleComplete={onToggleComplete}
        onDelete={onDelete}
      />
      
      {/* Info Popup */}
      <InfoPopup
        visible={showInfoPopup}
        title={INFO_CONTENT.EAT_THE_FROG.title}
        content={INFO_CONTENT.EAT_THE_FROG.content}
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
});
