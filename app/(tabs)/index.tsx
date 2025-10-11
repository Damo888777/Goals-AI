import { View, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect, useMemo } from 'react';
import { GreetingMessage } from '../../src/components/GreetingMessage';
import { EatTheFrogSection } from '../../src/components/EatTheFrogSection';
import { TodaysTasksSection } from '../../src/components/TodaysTasksSection';
import { CompletedTasksSection } from '../../src/components/CompletedTasksSection';
import { FAB } from '../../src/components/FAB';
import { useTodaysTasks } from '../../src/hooks/useTodaysTasks';
import { useTasks } from '../../src/hooks/useDatabase';
import type { Task } from '../../src/types';

export default function TodayTab() {
  const insets = useSafeAreaInsets();
  const { 
    tasks: todaysTasks, 
    frogTask, 
    setFrogTaskForToday: updateFrogTask,
    isLoading
  } = useTodaysTasks();
  
  const { completeTask } = useTasks();

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
      await completeTask(taskId);
    } catch (error) {
      console.error('Error toggling task completion:', error);
    }
  };

  const handleViewAllFinished = () => {
    console.log('View all finished tasks');
  };




  // Use real database data only
  const displayTasks = todaysTasks || [];
  const displayFrogTask = frogTask;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          paddingTop: insets.top + 20,
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

        {/* Completed Tasks Section */}
        <CompletedTasksSection
          tasks={[]}
          onTaskPress={handleTaskPress}
          onViewAllFinished={handleViewAllFinished}
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
