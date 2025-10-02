import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { TaskCard } from './TaskCard';
import { images } from '../constants/images';
import { typography } from '../constants/typography';
import type { Task } from '../types';

interface EatTheFrogSectionProps {
  frogTask?: Task;
  onSelectFrog?: () => void;
}

export function EatTheFrogSection({ frogTask, onSelectFrog }: EatTheFrogSectionProps) {
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
          <Pressable style={styles.infoButton}>
            <View style={styles.infoCircle}>
              <Text style={styles.infoText}>i</Text>
            </View>
          </Pressable>
        </View>

        {/* Description */}
        <Text style={styles.description}>
          Choose the one task that will make the biggest impact today.
        </Text>
      </View>

      {/* Task Card */}
      <TaskCard 
        task={frogTask}
        isEmpty={!frogTask}
        isFrog={true}
        onPress={onSelectFrog}
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
  infoButton: {
    width: 13,
    height: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCircle: {
    width: '100%',
    height: '100%',
    borderWidth: 1,
    borderColor: '#7C7C7C',
    borderRadius: 6.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    fontSize: 10,
    color: '#7C7C7C',
  },
  description: {
    ...typography.body,
  },
});
