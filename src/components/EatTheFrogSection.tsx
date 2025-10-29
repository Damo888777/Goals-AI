import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { TaskCard } from './TaskCard';
import { InfoPopup } from './InfoPopup';
import { InfoButton } from './InfoButton';
import { images } from '../constants/images';
import { typography } from '../constants/typography';
import type { Task } from '../types';
import { useState } from 'react';

interface EatTheFrogSectionProps {
  frogTask?: Task | null;
  onSelectFrog?: () => void;
  onToggleComplete?: (taskId: string) => Promise<void>;
  onDelete?: (taskId: string) => Promise<void>;
}

export function EatTheFrogSection({ frogTask, onSelectFrog, onToggleComplete, onDelete }: EatTheFrogSectionProps) {
  const { t } = useTranslation();
  const [showInfoPopup, setShowInfoPopup] = useState(false);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          {/* Frog Icon */}
          <Image 
            source={images.icons.frog} 
            style={styles.icon}
            contentFit="contain"
          />
          
          <Text style={styles.title}>
            {t('components.eatTheFrogSection.title')}
          </Text>
          
          {/* Info Button */}
          <InfoButton onPress={() => setShowInfoPopup(true)} />
        </View>

        {/* Description */}
        <Text style={styles.description}>
          {t('components.eatTheFrogSection.description')}
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
        title={t('infoContent.eatTheFrog.title')}
        content={t('infoContent.eatTheFrog.content')}
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
