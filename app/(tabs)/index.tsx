import { View, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect, useMemo } from 'react';
import { GreetingMessage } from '../../src/components/GreetingMessage';
import { EatTheFrogSection } from '../../src/components/EatTheFrogSection';
import { TodaysTasksSection } from '../../src/components/TodaysTasksSection';
import { CompletedTasksSection } from '../../src/components/CompletedTasksSection';
import { FAB } from '../../src/components/FAB';
import { SparkTutorialOverlay } from '../../src/components/SparkTutorialOverlay';
import { useTodaysTasks } from '../../src/hooks/useTodaysTasks';
import { useTasks, useTodaysCompletedTasks } from '../../src/hooks/useDatabase';
import { useOnboarding } from '../../src/hooks/useOnboarding';
import { useOverdueTasks } from '../../src/hooks/useOverdueTasks';
import { OverdueTasksModal } from '../../src/components/OverdueTasksModal';
import type { Task } from '../../src/types';

export default function TodayTab() {
  const insets = useSafeAreaInsets();
  const { 
    tasks: todaysTasks, 
    frogTask, 
    setFrogTaskForToday: updateFrogTask
  } = useTodaysTasks();
  
  const { completeTask, createTask, deleteTask, updateTask } = useTasks();
  const { completedTasks } = useTodaysCompletedTasks();
  const { shouldShowSparkTutorial, completeSparkTutorial, userPreferences } = useOnboarding();
  const { overdueTasks, hasOverdueTasks } = useOverdueTasks();
  const [showOverdueModal, setShowOverdueModal] = useState(false);

  const handleFABLongPress = () => {
    console.log('FAB long pressed - Show context menu');
  };

  const handleAddFrogTask = async (taskData: {
    title: string;
    scheduledDate: Date;
    isFrog: boolean;
    creationSource: 'spark' | 'manual';
  }) => {
    try {
      await createTask({
        title: taskData.title,
        scheduledDate: taskData.scheduledDate,
        isFrog: taskData.isFrog,
        creationSource: taskData.creationSource
      });
      console.log('Frog task created successfully');
    } catch (error) {
      console.error('Error creating frog task:', error);
    }
  };

  const handleSelectFrog = () => {
    console.log('Select frog task');
  };

  const handleTaskPress = (task: Task) => {
    console.log('Task pressed:', task.id);
  };

  const handleAddTask = async () => {
    try {
      // Create a task scheduled for today
      const today = new Date();
      await createTask({
        title: 'New Task',
        scheduledDate: today,
        creationSource: 'manual'
      });
      console.log('Task created successfully');
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleToggleComplete = async (taskId: string) => {
    try {
      await completeTask(taskId);
    } catch (error) {
      console.error('Error toggling task completion:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      console.log('Task deleted successfully');
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleViewAllFinished = () => {
    console.log('View all finished tasks');
  };

  // Show overdue modal when overdue tasks are detected
  useEffect(() => {
    if (hasOverdueTasks && !showOverdueModal) {
      setShowOverdueModal(true);
    }
  }, [hasOverdueTasks, showOverdueModal]);

  const handleOverdueReschedule = async (taskIds: string[], newDate: Date) => {
    try {
      for (const taskId of taskIds) {
        await updateTask(taskId, { scheduledDate: newDate.toISOString() });
      }
      console.log(`Rescheduled ${taskIds.length} tasks to ${newDate.toDateString()}`);
    } catch (error) {
      console.error('Error rescheduling tasks:', error);
    }
  };

  const handleOverdueComplete = async (taskIds: string[]) => {
    try {
      for (const taskId of taskIds) {
        await completeTask(taskId);
      }
      console.log(`Completed ${taskIds.length} overdue tasks`);
    } catch (error) {
      console.error('Error completing tasks:', error);
    }
  };

  const handleOverdueDelete = async (taskIds: string[]) => {
    try {
      for (const taskId of taskIds) {
        await deleteTask(taskId);
      }
      console.log(`Deleted ${taskIds.length} overdue tasks`);
    } catch (error) {
      console.error('Error deleting tasks:', error);
    }
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
          paddingBottom: 50,
          gap: 45,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <GreetingMessage username={userPreferences?.name || "User"} />

        {/* Eat the Frog Section */}
        <EatTheFrogSection
          frogTask={frogTask}
          onAddFrogTask={handleAddFrogTask}
          onSelectFrog={handleSelectFrog}
          onToggleComplete={handleToggleComplete}
          onDelete={handleDeleteTask}
        />

        {/* Today's Tasks Section */}
        <TodaysTasksSection
          tasks={displayTasks}
          onTaskPress={handleTaskPress}
          onAddTask={handleAddTask}
          onToggleComplete={handleToggleComplete}
          onDelete={handleDeleteTask}
        />

        {/* Completed Tasks Section */}
        <CompletedTasksSection
          tasks={completedTasks}
          onTaskPress={handleTaskPress}
          onViewAllFinished={handleViewAllFinished}
          onToggleComplete={handleToggleComplete}
        />
      </ScrollView>

      {/* Floating Action Button */}
      <FAB onLongPress={handleFABLongPress} />

      {/* Spark Tutorial Overlay */}
      <SparkTutorialOverlay
        visible={shouldShowSparkTutorial}
        onComplete={completeSparkTutorial}
      />

      {/* Overdue Tasks Modal */}
      <OverdueTasksModal
        visible={showOverdueModal}
        overdueTasks={overdueTasks}
        onClose={() => setShowOverdueModal(false)}
        onReschedule={handleOverdueReschedule}
        onComplete={handleOverdueComplete}
        onDelete={handleOverdueDelete}
      />
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
