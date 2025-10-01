import { View, Text, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { WeekDayCard } from '../../src/components/WeekDayCard';
import { TaskCard } from '../../src/components/TaskCard';
import { FAB } from '../../src/components/FAB';
import { typography } from '../../src/constants/typography';
import type { Task } from '../../src/types';

type ViewMode = 'week' | 'backlog';
type BacklogFilter = 'someday' | 'scheduled';

export default function PlanTab() {
  const insets = useSafeAreaInsets();
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [backlogFilter, setBacklogFilter] = useState<BacklogFilter>('someday');
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  
  // Sample someday tasks (tasks without timestamps)
  const [somedayTasks, setSomedayTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Learn a new programming language',
      isEatTheFrog: false,
      isCompleted: false,
      goalId: undefined,
      milestoneId: undefined,
      dueDate: undefined, // No timestamp - someday task
      notes: 'Maybe Python or Rust',
      focusSessions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2', 
      title: 'Plan a weekend getaway',
      isEatTheFrog: false,
      isCompleted: false,
      goalId: undefined,
      milestoneId: undefined,
      dueDate: undefined, // No timestamp - someday task
      notes: 'Somewhere peaceful and relaxing',
      focusSessions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  // Get current week dates
  const getCurrentWeekDates = () => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay; // Adjust for Sunday
    const monday = new Date(today);
    const weekOffset = (viewMode === 'backlog' && backlogFilter === 'scheduled') ? currentWeekOffset * 7 : 0;
    monday.setDate(today.getDate() + mondayOffset + weekOffset);
    
    const formatDate = (date: Date) => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[date.getMonth()]}.${String(date.getDate()).padStart(2, '0')}.${date.getFullYear()}`;
    };
    
    const weekDays = [];
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      weekDays.push({
        name: dayNames[i],
        date: formatDate(date),
        tasks: [] as Task[]
      });
    }
    
    return {
      weekDays,
      startDate: formatDate(monday),
      endDate: formatDate(new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000))
    };
  };
  
  const { weekDays, startDate, endDate } = getCurrentWeekDates();

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeekOffset(prev => direction === 'prev' ? prev - 1 : prev + 1);
  };


  return (
    <View style={{ flex: 1, backgroundColor: '#E9EDC9' }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: insets.top + 63,
          paddingHorizontal: 36,
          paddingBottom: 150,
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
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable
                onPress={() => setViewMode('week')}
                style={{
                  flex: 1,
                  height: 32,
                  borderRadius: 8,
                  borderWidth: 0.5,
                  borderColor: '#A3B18A',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: viewMode === 'week' ? '#364958' : '#F5EBE0',
                  // Drop shadow matching Figma specs
                  shadowColor: '#7C7C7C',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.75,
                  shadowRadius: 0,
                  elevation: 4,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '400',
                    color: viewMode === 'week' ? '#FFFFFF' : '#757575',
                  }}
                >
                  This Week
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setViewMode('backlog')}
                style={{
                  flex: 1,
                  height: 32,
                  borderRadius: 8,
                  borderWidth: 0.5,
                  borderColor: '#A3B18A',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: viewMode === 'backlog' ? '#364958' : '#F5EBE0',
                  // Drop shadow matching Figma specs
                  shadowColor: '#7C7C7C',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.75,
                  shadowRadius: 0,
                  elevation: 4,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '400',
                    color: viewMode === 'backlog' ? '#FFFFFF' : '#757575',
                  }}
                >
                  Backlog
                </Text>
              </Pressable>
            </View>

            {/* Second Row: Scheduled | Ideas (conditional) */}
            {viewMode === 'backlog' && (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable
                  onPress={() => setBacklogFilter('scheduled')}
                  style={{
                    flex: 1,
                    height: 32,
                    borderRadius: 8,
                    borderWidth: 0.5,
                    borderColor: '#A3B18A',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: backlogFilter === 'scheduled' ? '#364958' : '#F5EBE0',
                    // Drop shadow matching Figma specs
                    shadowColor: '#7C7C7C',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.75,
                    shadowRadius: 0,
                    elevation: 4,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '400',
                      color: backlogFilter === 'scheduled' ? '#FFFFFF' : '#757575',
                    }}
                  >
                    Scheduled
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setBacklogFilter('someday')}
                  style={{
                    flex: 1,
                    height: 32,
                    borderRadius: 8,
                    borderWidth: 0.5,
                    borderColor: '#A3B18A',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: backlogFilter === 'someday' ? '#364958' : '#F5EBE0',
                    // Drop shadow matching Figma specs
                    shadowColor: '#7C7C7C',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.75,
                    shadowRadius: 0,
                    elevation: 4,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '400',
                      color: backlogFilter === 'someday' ? '#FFFFFF' : '#757575',
                    }}
                  >
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
              <Pressable
                onPress={() => navigateWeek('prev')}
                style={{
                  width: 44,
                  height: 44,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <View style={{
                  width: 8,
                  height: 8,
                  borderLeftWidth: 1.5,
                  borderBottomWidth: 1.5,
                  borderColor: '#364958',
                  transform: [{ rotate: '45deg' }],
                  marginRight: 2,
                }} />
              </Pressable>
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
              <Pressable
                onPress={() => navigateWeek('next')}
                style={{
                  width: 44,
                  height: 44,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <View style={{
                  width: 8,
                  height: 8,
                  borderRightWidth: 1.5,
                  borderBottomWidth: 1.5,
                  borderColor: '#364958',
                  transform: [{ rotate: '-45deg' }],
                  marginLeft: 2,
                }} />
              </Pressable>
            </View>
          )}
        </View>

        {/* Week Days List */}
        {viewMode === 'week' && (
          <View style={{ gap: 20 }}>
            {weekDays.map((day) => (
              <WeekDayCard
                key={day.name}
                weekday={day.name}
                date={day.date}
                tasks={day.tasks}
              />
            ))}
          </View>
        )}

        {/* Backlog View - Scheduled */}
        {viewMode === 'backlog' && backlogFilter === 'scheduled' && (
          <View style={{ gap: 20 }}>
            {weekDays.map((day) => (
              <WeekDayCard
                key={day.name}
                weekday={day.name}
                date={day.date}
                tasks={day.tasks}
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
                {somedayTasks.length > 0 ? (
                  somedayTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onPress={() => console.log('Someday task pressed:', task.id)}
                    />
                  ))
                ) : (
                  <TaskCard
                    isEmpty={true}
                    onPress={() => console.log('Add someday task')}
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
