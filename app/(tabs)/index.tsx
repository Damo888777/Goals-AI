import { View, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect, useMemo } from 'react';
import { GreetingMessage } from '../../src/components/GreetingMessage';
import { EatTheFrogSection } from '../../src/components/EatTheFrogSection';
import { TodaysTasksSection } from '../../src/components/TodaysTasksSection';
import { FAB } from '../../src/components/FAB';
import { useTodaysTasks } from '../../src/hooks/useTodaysTasks';
import type { Task } from '../../src/types';

export default function TodayTab() {
  const insets = useSafeAreaInsets();
  const { 
    todaysTasks, 
    frogTask, 
    setFrogTask: updateFrogTask,
    toggleTaskComplete,
    isLoading,
    refreshTasks 
  } = useTodaysTasks();

  const handleFABLongPress = () => {
    console.log('FAB long pressed - Show context menu');
  };

  const handleSelectFrog = () => {
    console.log('Select frog task');
  };

  const handleTaskPress = (task: Task) => {
    console.log('Task pressed:', task.id);
  };

  const handleAddTask = () => {
    console.log('Add task');
  };

  const handleToggleComplete = async (taskId: string) => {
    try {
      await toggleTaskComplete(taskId);
      await refreshTasks();
    } catch (error) {
      console.error('Error toggling task completion:', error);
    }
  };

  // Mock tasks for demo purposes
  const mockTasks: Task[] = useMemo(() => [
    {
      id: 'mock-1',
      title: 'Complete project presentation slides',
      notes: 'Focus on key metrics and visual design',
      scheduledDate: new Date().toISOString(),
      isFrog: false,
      isComplete: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: 'demo-user',
      goalId: undefined,
      milestoneId: undefined,
      creationSource: 'manual'
    },
    {
      id: 'mock-2', 
      title: 'Review quarterly goals and adjust priorities',
      notes: 'Check progress on all active goals',
      scheduledDate: new Date().toISOString(),
      isFrog: false,
      isComplete: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: 'demo-user',
      goalId: undefined,
      milestoneId: undefined,
      creationSource: 'spark'
    }
  ], []);

  const mockFrogTask: Task = useMemo(() => ({
    id: 'mock-frog',
    title: 'Write first chapter of book',
    notes: 'The most important task that will move me closer to my dreams',
    scheduledDate: new Date().toISOString(),
    isFrog: true,
    isComplete: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: 'demo-user',
    goalId: undefined,
    milestoneId: undefined,
    creationSource: 'manual'
  }), []);

  // Use mock data if no real tasks exist
  const displayTasks = todaysTasks.length > 0 ? todaysTasks : mockTasks;
  const displayFrogTask = frogTask || mockFrogTask;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          paddingTop: insets.top + 63,
          paddingHorizontal: 36,
          paddingBottom: 150,
          gap: 45,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <GreetingMessage username="User" />

        {/* Eat the Frog Section */}
        <EatTheFrogSection 
          frogTask={displayFrogTask}
          onSelectFrog={handleSelectFrog}
        />

        {/* Today's Tasks Section */}
        <TodaysTasksSection
          tasks={displayTasks}
          onTaskPress={handleTaskPress}
          onAddTask={handleAddTask}
          onToggleComplete={handleToggleComplete}
          isLoading={isLoading}
        />
      </ScrollView>

      {/* Floating Action Button */}
      <FAB onLongPress={handleFABLongPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E9EDC9',
  },
  scrollView: {
    flex: 1,
  },
});
