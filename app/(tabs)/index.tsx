import { View, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { GreetingMessage } from '../../src/components/GreetingMessage';
import { EatTheFrogSection } from '../../src/components/EatTheFrogSection';
import { TodaysTasksSection } from '../../src/components/TodaysTasksSection';
import { FAB } from '../../src/components/FAB';
import type { Task } from '../../src/types';

export default function TodayTab() {
  const insets = useSafeAreaInsets();
  const [frogTask, setFrogTask] = useState<Task | undefined>(undefined);
  const [tasks, setTasks] = useState<Task[]>([]);

  const handleFABPress = () => {
    console.log('FAB pressed - Open Spark AI');
  };

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
          frogTask={frogTask}
          onSelectFrog={handleSelectFrog}
        />

        {/* Today's Tasks Section */}
        <TodaysTasksSection
          tasks={tasks}
          onTaskPress={handleTaskPress}
          onAddTask={handleAddTask}
        />
      </ScrollView>

      {/* Floating Action Button */}
      <FAB onPress={handleFABPress} onLongPress={handleFABLongPress} />
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
