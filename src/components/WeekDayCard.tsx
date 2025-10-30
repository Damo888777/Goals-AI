import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, borderRadius, shadows, emptyStateSpacing } from '../constants/spacing';
import { TaskCard } from './TaskCard';
import { ChevronButton } from './ChevronButton';
import type { Task } from '../types';

interface WeekDayCardProps {
  weekday: string;
  date: string;
  dateObj: Date;
  tasks: Task[];
  onPress?: () => void;
  onAddTask?: (taskData: {
    title: string;
    scheduledDate: Date;
    creationSource: 'spark' | 'manual';
  }) => Promise<void>;
  onToggleComplete?: (taskId: string) => Promise<void>;
  onDeleteTask?: (taskId: string) => Promise<void>;
}

export function WeekDayCard({ weekday, date, dateObj, tasks, onPress, onAddTask, onToggleComplete, onDeleteTask }: WeekDayCardProps) {
  const { t } = useTranslation();
  // Check if this day is today to expand by default
  const isToday = () => {
    const today = new Date();
    return dateObj.toDateString() === today.toDateString();
  };
  
  const [isExpanded, setIsExpanded] = useState(isToday());
  const hasTasks = tasks.length > 0;

  const handlePress = () => {
    setIsExpanded(!isExpanded);
    onPress?.();
  };

  return (
    <View style={{
      backgroundColor: '#F5EBE0',
      borderWidth: 0.5,
      borderColor: '#A3B18A',
      borderRadius: 15,
      // Drop shadow matching Figma specs
      shadowColor: '#7C7C7C',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.75,
      shadowRadius: 0,
      elevation: 4,
    }}>
      <Pressable
        onPress={handlePress}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 15,
          paddingVertical: 10,
        }}
      >
        {/* Left side - Weekday and Date */}
        <View style={{ flex: 1, gap: 0 }}>
          <Text style={typography.title}>
            {weekday}
          </Text>
          <Text style={typography.body}>
            {date}
          </Text>
        </View>

        {/* Right side - Chevron */}
        <ChevronButton
          direction={isExpanded ? 'up' : 'down'}
          size="small"
          color={colors.text.primary}
          style={{ width: 24, height: 24 }}
        />
      </Pressable>

      {/* Expanded Content - Tasks or Empty State */}
      {isExpanded && (
        <View style={{ paddingHorizontal: 15, paddingBottom: 15, gap: 8 }}>
          {hasTasks ? (
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                variant={
                  task.isComplete 
                    ? 'completed' 
                    : task.isFrog 
                      ? 'active-frog'
                      : task.scheduledDate 
                        ? 'active-with-date' 
                        : 'active-without-date'
                }
                onToggleComplete={onToggleComplete}
                onDelete={onDeleteTask}
                creationSource={task.creationSource}
              />
            ))
          ) : (
            <View
              style={{
                backgroundColor: '#E9EDC9',
                borderWidth: 0.5,
                borderColor: '#A3B18A',
                borderRadius: 15,
                padding: 20,
                alignItems: 'center',
                justifyContent: 'center',
                // Drop shadow matching Figma specs
                shadowColor: '#7C7C7C',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.75,
                shadowRadius: 0,
                elevation: 4,
              }}
            >
              <Text style={{
                ...typography.emptyTitle,
                marginBottom: emptyStateSpacing.titleMarginBottom,
              }}>
                {t('components.weekDayCard.emptyState.noTasksFor', { weekday })}
              </Text>
              <Text style={{
                ...typography.emptyDescription,
              }}>
                {t('components.weekDayCard.emptyState.dayLooksClear')}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
