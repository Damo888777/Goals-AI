import { View, Text, Pressable } from 'react-native';
import { useState } from 'react';
import { typography } from '../constants/typography';
import { TaskCard } from './TaskCard';
import type { Task } from '../types';

interface WeekDayCardProps {
  weekday: string;
  date: string;
  tasks: Task[];
  onPress?: () => void;
}

export function WeekDayCard({ weekday, date, tasks, onPress }: WeekDayCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
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
        <View 
          style={{
            width: 24,
            height: 24,
            alignItems: 'center',
            justifyContent: 'center',
            transform: [{ rotate: isExpanded ? '180deg' : '0deg' }],
          }}
        >
          <View style={{
            width: 8,
            height: 8,
            borderRightWidth: 1.5,
            borderBottomWidth: 1.5,
            borderColor: '#364958',
            transform: [{ rotate: '45deg' }],
            marginTop: -2,
          }} />
        </View>
      </Pressable>

      {/* Expanded Content - Tasks or Empty State */}
      {isExpanded && (
        <View style={{ paddingHorizontal: 15, paddingBottom: 15, gap: 8 }}>
          {hasTasks ? (
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onPress={() => console.log('Task pressed:', task.id)}
                onToggleComplete={async (taskId) => console.log('Toggle complete:', taskId)}
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
                ...typography.cardTitle,
                textAlign: 'center',
                marginBottom: 8,
              }}>
                No tasks for today
              </Text>
              <Text style={{
                ...typography.cardDescription,
                textAlign: 'center',
              }}>
                Your day looks clear. Add a task to get started.
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
