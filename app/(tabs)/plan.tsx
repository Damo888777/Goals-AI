import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { WeekDayCard } from '../../src/components/WeekDayCard';
import { TaskCard } from '../../src/components/TaskCard';
import { FAB } from '../../src/components/FAB';
import { ChevronButton } from '../../src/components/ChevronButton';
import { typography } from '../../src/constants/typography';
import { useWeeklyTasks } from '../../src/hooks/useWeeklyTasks';
import { useSomedayTasks } from '../../src/hooks/useSomedayTasks';
import { useTasks } from '../../src/hooks/useDatabase';
import type { Task } from '../../src/types';

type ViewMode = 'week' | 'backlog';
type BacklogFilter = 'someday' | 'scheduled';

export default function PlanTab() {
  const insets = useSafeAreaInsets();
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [backlogFilter, setBacklogFilter] = useState<BacklogFilter>('someday');
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  
  // Use real data hooks
  const { weekDays: realWeekDays, getWeekRange } = useWeeklyTasks(currentWeekOffset);
  const { somedayTasks, toggleTaskComplete, createSomedayTask } = useSomedayTasks();
  const { createTask, completeTask, deleteTask } = useTasks();
  
  // Get week range for display
  const { startDate, endDate } = getWeekRange();

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeekOffset(prev => direction === 'prev' ? prev - 1 : prev + 1);
  };


  return (
    <View style={{ flex: 1, backgroundColor: '#E9EDC9' }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingHorizontal: 36,
          paddingBottom: 50,
          gap: 43,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Plan Console Header */}
        <View className="gap-2">
          <Text style={typography.title}>
            Plan Console
          </Text>
          <Text style={typography.body}>
            This is where your dreams take shape. Start with your vision, then build the plan to make it real.
          </Text>
        </View>

        {/* Toggle View and Week Indicator Container */}
        <View style={{ gap: 10 }}>
          {/* Toggle View */}
          <View style={{ gap: 8 }}>
            {/* First Row: This Week | Backlog */}
            <View style={styles.toggleContainer}>
              <Pressable
                onPress={() => setViewMode('week')}
                style={[
                  styles.toggleButton,
                  viewMode === 'week' && styles.toggleButtonActive
                ]}
              >
                <Text style={[
                  styles.toggleButtonText,
                  viewMode === 'week' && styles.toggleButtonTextActive
                ]}>
                  This Week
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setViewMode('backlog')}
                style={[
                  styles.toggleButton,
                  viewMode === 'backlog' && styles.toggleButtonActive
                ]}
              >
                <Text style={[
                  styles.toggleButtonText,
                  viewMode === 'backlog' && styles.toggleButtonTextActive
                ]}>
                  Backlog
                </Text>
              </Pressable>
            </View>

            {/* Second Row: Scheduled | Ideas (conditional) */}
            {viewMode === 'backlog' && (
              <View style={styles.toggleContainer}>
                <Pressable
                  onPress={() => setBacklogFilter('scheduled')}
                  style={[
                    styles.toggleButton,
                    backlogFilter === 'scheduled' && styles.toggleButtonActive
                  ]}
                >
                  <Text style={[
                    styles.toggleButtonText,
                    backlogFilter === 'scheduled' && styles.toggleButtonTextActive
                  ]}>
                    Scheduled
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setBacklogFilter('someday')}
                  style={[
                    styles.toggleButton,
                    backlogFilter === 'someday' && styles.toggleButtonActive
                  ]}
                >
                  <Text style={[
                    styles.toggleButtonText,
                    backlogFilter === 'someday' && styles.toggleButtonTextActive
                  ]}>
                    Someday
                  </Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Week Indicator - This Week */}
          {viewMode === 'week' && (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '300',
                color: '#364958',
              }}>
                {startDate}
              </Text>
              <Text style={{
                fontSize: 14,
                fontWeight: '300',
                color: '#364958',
              }}>
                -
              </Text>
              <Text style={{
                fontSize: 14,
                fontWeight: '300',
                color: '#364958',
              }}>
                {endDate}
              </Text>
            </View>
          )}

          {/* Week Indicator - Scheduled */}
          {viewMode === 'backlog' && backlogFilter === 'scheduled' && (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <ChevronButton
                direction="left"
                size="small"
                color="#364958"
                onPress={() => navigateWeek('prev')}
              />
              <Text style={{
                fontSize: 14,
                fontWeight: '300',
                color: '#364958',
              }}>
                {startDate}
              </Text>
              <Text style={{
                fontSize: 14,
                fontWeight: '300',
                color: '#364958',
              }}>
                -
              </Text>
              <Text style={{
                fontSize: 14,
                fontWeight: '300',
                color: '#364958',
              }}>
                {endDate}
              </Text>
              <ChevronButton
                direction="right"
                size="small"
                color="#364958"
                onPress={() => navigateWeek('next')}
              />
            </View>
          )}
        </View>

        {/* Week Days List */}
        {viewMode === 'week' && (
          <View style={{ gap: 20 }}>
            {realWeekDays.map((day) => (
              <WeekDayCard
                key={day.name}
                weekday={day.name}
                date={day.date}
                dateObj={day.dateObj}
                tasks={day.tasks}
                onPress={() => console.log(`${day.name} pressed`)}
                onAddTask={async (taskData) => {
                  try {
                    await createTask({
                      title: taskData.title,
                      scheduledDate: taskData.scheduledDate,
                      creationSource: taskData.creationSource
                    });
                    console.log('Weekday task created successfully');
                  } catch (error) {
                    console.error('Error creating weekday task:', error);
                  }
                }}
                onToggleComplete={async (taskId) => {
                  try {
                    await completeTask(taskId);
                    console.log('Task completed successfully');
                  } catch (error) {
                    console.error('Error completing task:', error);
                  }
                }}
                onDeleteTask={async (taskId) => {
                  try {
                    await deleteTask(taskId);
                    console.log('Task deleted successfully');
                  } catch (error) {
                    console.error('Error deleting task:', error);
                  }
                }}
              />
            ))}
          </View>
        )}

        {/* Backlog View - Scheduled */}
        {viewMode === 'backlog' && backlogFilter === 'scheduled' && (
          <View style={{ gap: 20 }}>
            {realWeekDays.map((day) => (
              <WeekDayCard
                key={day.name}
                weekday={day.name}
                date={day.date}
                dateObj={day.dateObj}
                tasks={day.tasks}
                onAddTask={async (taskData) => {
                  try {
                    await createTask({
                      title: taskData.title,
                      scheduledDate: taskData.scheduledDate,
                      creationSource: taskData.creationSource
                    });
                    console.log('Scheduled task created successfully');
                  } catch (error) {
                    console.error('Error creating scheduled task:', error);
                  }
                }}
                onToggleComplete={async (taskId) => {
                  try {
                    await completeTask(taskId);
                    console.log('Task completed successfully');
                  } catch (error) {
                    console.error('Error completing task:', error);
                  }
                }}
                onDeleteTask={async (taskId) => {
                  try {
                    await deleteTask(taskId);
                    console.log('Task deleted successfully');
                  } catch (error) {
                    console.error('Error deleting task:', error);
                  }
                }}
              />
            ))}
          </View>
        )}

        {/* Backlog View - Someday */}
        {viewMode === 'backlog' && backlogFilter === 'someday' && (
          <View style={{ gap: 20 }}>
            {/* Someday Tasks Container with cream background */}
            <View style={{
              backgroundColor: '#F5EBE0',
              borderWidth: 0.5,
              borderColor: '#A3B18A',
              borderRadius: 15,
              padding: 20,
              // Drop shadow matching Figma specs
              shadowColor: '#7C7C7C',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.75,
              shadowRadius: 0,
              elevation: 4,
            }}>
              <Text style={{
                ...typography.title,
                fontSize: 18,
                marginBottom: 16,
                color: '#364958',
              }}>
                Someday Tasks
              </Text>
              
              <View style={{ gap: 12 }}>
                {somedayTasks.filter(task => !task.scheduledDate).length > 0 ? (
                  somedayTasks
                    .filter(task => !task.scheduledDate)
                    .map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        variant={task.isComplete ? 'completed' : 'active-without-date'}
                        onPress={() => console.log('Someday task pressed:', task.id)}
                        onToggleComplete={toggleTaskComplete}
                        onDelete={async (taskId) => {
                          try {
                            await deleteTask(taskId);
                            console.log('Someday task deleted successfully');
                          } catch (error) {
                            console.error('Error deleting someday task:', error);
                          }
                        }}
                      />
                    ))
                ) : (
                  <TaskCard
                    variant="empty-someday"
                  />
                )}
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <FAB />
    </View>
  );
}

const styles = StyleSheet.create({
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5EBE0',
    borderRadius: 12,
    padding: 4,
    borderWidth: 0.5,
    borderColor: '#A3B18A',
    shadowColor: '#7C7C7C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#364958',
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#364958',
    fontFamily: 'Helvetica',
  },
  toggleButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
