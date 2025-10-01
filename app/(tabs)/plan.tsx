import { View, Text, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { WeekDayCard } from '../../src/components/WeekDayCard';
import { FAB } from '../../src/components/FAB';
import { typography } from '../../src/constants/typography';
import type { Task } from '../../src/types';

type ViewMode = 'week' | 'backlog';
type BacklogFilter = 'ideas' | 'scheduled';

export default function PlanTab() {
  const insets = useSafeAreaInsets();
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [backlogFilter, setBacklogFilter] = useState<BacklogFilter>('ideas');
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);

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
                  onPress={() => setBacklogFilter('ideas')}
                  style={{
                    flex: 1,
                    height: 32,
                    borderRadius: 8,
                    borderWidth: 0.5,
                    borderColor: '#A3B18A',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: backlogFilter === 'ideas' ? '#364958' : '#F5EBE0',
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
                      color: backlogFilter === 'ideas' ? '#FFFFFF' : '#757575',
                    }}
                  >
                    Ideas
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

        {/* Backlog View - Ideas */}
        {viewMode === 'backlog' && backlogFilter === 'ideas' && (
          <View style={{ gap: 20 }}>
            {/* Idea Card 1 */}
            <View style={{
              backgroundColor: '#F5EBE0',
              borderWidth: 0.5,
              borderColor: '#A3B18A',
              borderRadius: 15,
              padding: 15,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              // Drop shadow matching Figma specs
              shadowColor: '#7C7C7C',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.75,
              shadowRadius: 0,
              elevation: 4,
            }}>
              <View style={{ flex: 1 }}>
                <Text style={{
                  ...typography.title,
                  fontSize: 16,
                  marginBottom: 4,
                }}>
                  Placeholder Idea Title
                </Text>
                <Text style={{
                  fontSize: 12,
                  fontWeight: '300',
                  color: '#364958',
                }}>
                  Potential Goal
                </Text>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: 4,
                }}>
                  <View style={{
                    width: 12,
                    height: 12,
                    backgroundColor: '#E9EDC9',
                    borderRadius: 2,
                    marginRight: 6,
                  }} />
                  <Text style={{
                    fontSize: 12,
                    fontWeight: '300',
                    color: '#364958',
                  }}>
                    None
                  </Text>
                </View>
              </View>
              <Pressable style={{
                width: 32,
                height: 32,
                backgroundColor: '#7FB3D3',
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Text style={{
                  fontSize: 18,
                  fontWeight: '400',
                  color: '#FFFFFF',
                }}>
                  +
                </Text>
              </Pressable>
            </View>

            {/* Idea Card 2 */}
            <View style={{
              backgroundColor: '#F5EBE0',
              borderWidth: 0.5,
              borderColor: '#A3B18A',
              borderRadius: 15,
              padding: 15,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              // Drop shadow matching Figma specs
              shadowColor: '#7C7C7C',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.75,
              shadowRadius: 0,
              elevation: 4,
            }}>
              <View style={{ flex: 1 }}>
                <Text style={{
                  ...typography.title,
                  fontSize: 16,
                  marginBottom: 4,
                }}>
                  Placeholder Idea Title
                </Text>
                <Text style={{
                  fontSize: 12,
                  fontWeight: '300',
                  color: '#364958',
                }}>
                  Potential Goal
                </Text>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: 4,
                }}>
                  <View style={{
                    width: 12,
                    height: 12,
                    backgroundColor: '#E9EDC9',
                    borderRadius: 2,
                    marginRight: 6,
                  }} />
                  <Text style={{
                    fontSize: 12,
                    fontWeight: '300',
                    color: '#364958',
                  }}>
                    None
                  </Text>
                </View>
              </View>
              <Pressable style={{
                width: 32,
                height: 32,
                backgroundColor: '#7FB3D3',
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Text style={{
                  fontSize: 18,
                  fontWeight: '400',
                  color: '#FFFFFF',
                }}>
                  +
                </Text>
              </Pressable>
            </View>

            {/* Idea Card 3 */}
            <View style={{
              backgroundColor: '#F5EBE0',
              borderWidth: 0.5,
              borderColor: '#A3B18A',
              borderRadius: 15,
              padding: 15,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              // Drop shadow matching Figma specs
              shadowColor: '#7C7C7C',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.75,
              shadowRadius: 0,
              elevation: 4,
            }}>
              <View style={{ flex: 1 }}>
                <Text style={{
                  ...typography.title,
                  fontSize: 16,
                  marginBottom: 4,
                }}>
                  Placeholder Idea Title
                </Text>
                <Text style={{
                  fontSize: 12,
                  fontWeight: '300',
                  color: '#364958',
                }}>
                  Potential Goal
                </Text>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: 4,
                }}>
                  <View style={{
                    width: 12,
                    height: 12,
                    backgroundColor: '#E9EDC9',
                    borderRadius: 2,
                    marginRight: 6,
                  }} />
                  <Text style={{
                    fontSize: 12,
                    fontWeight: '300',
                    color: '#364958',
                  }}>
                    None
                  </Text>
                </View>
              </View>
              <Pressable style={{
                width: 32,
                height: 32,
                backgroundColor: '#7FB3D3',
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Text style={{
                  fontSize: 18,
                  fontWeight: '400',
                  color: '#FFFFFF',
                }}>
                  +
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <FAB />
    </View>
  );
}
