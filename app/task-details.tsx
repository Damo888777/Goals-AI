import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useGoals, useMilestones, useTasks } from '../src/hooks/useDatabase';

export default function TaskDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { goals } = useGoals();
  const { milestones } = useMilestones();
  const { tasks, updateTask, deleteTask } = useTasks();
  
  const [task, setTask] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [isFrog, setIsFrog] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [selectedMilestoneId, setSelectedMilestoneId] = useState('');
  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGoalDropdown, setShowGoalDropdown] = useState(false);
  const [showMilestoneDropdown, setShowMilestoneDropdown] = useState(false);
  const [attachmentType, setAttachmentType] = useState<'goal' | 'milestone'>('goal');

  useEffect(() => {
    if (id && tasks.length > 0) {
      const foundTask = tasks.find(t => t.id === id);
      if (foundTask) {
        setTask(foundTask);
        setTitle(foundTask.title);
        setNotes(foundTask.notes || '');
        setIsFrog(foundTask.isFrog || false);
        setSelectedGoalId(foundTask.goalId || '');
        setSelectedMilestoneId(foundTask.milestoneId || '');
        setScheduledDate(foundTask.scheduledDate ? new Date(foundTask.scheduledDate) : new Date());
        setAttachmentType(foundTask.milestoneId ? 'milestone' : 'goal');
      }
    }
  }, [id, tasks]);

  const selectedGoal = goals.find(g => g.id === selectedGoalId);
  const selectedMilestone = milestones.find(m => m.id === selectedMilestoneId);
  const availableMilestones = selectedGoalId ? milestones.filter(m => m.goalId === selectedGoalId) : milestones;

  const handleSave = async () => {
    if (!task || !title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    try {
      await updateTask(task.id, {
        title: title.trim(),
        notes: notes.trim(),
        isFrog: isFrog,
        goalId: attachmentType === 'goal' ? selectedGoalId : undefined,
        milestoneId: attachmentType === 'milestone' ? selectedMilestoneId : undefined,
        scheduledDate: scheduledDate.toISOString(),
      });
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to update task');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTask(task.id);
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete task');
            }
          },
        },
      ]
    );
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setScheduledDate(selectedDate);
    }
  };

  // Mock focus history data
  const focusHistory = {
    totalSessions: 3,
    totalHours: 2,
    totalMinutes: 45,
    sessions: [
      'Dec.15.2024, 2:30 p.m. - 3:00 p.m.',
      'Dec.14.2024, 10:15 a.m. - 11:00 a.m.',
      'Dec.13.2024, 4:45 p.m. - 5:30 p.m.',
    ]
  };

  if (!task) {
    return (
      <SafeAreaView className="flex-1 bg-[#e9edc9]">
        <View className="flex-1 items-center justify-center">
          <Text className="text-[#364958] text-lg">Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#e9edc9]">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="px-9 pt-4">
          {/* Header */}
          <View className="flex-row items-center mb-6">
            <TouchableOpacity 
              onPress={() => router.back()}
              className="w-11 h-11 items-center justify-center"
            >
              <Ionicons name="chevron-back" size={24} color="#364958" />
            </TouchableOpacity>
            <View className="flex-1 ml-4">
              <Text className="text-[#364958] text-2xl font-bold">My Task</Text>
              <Text className="text-[#364958] text-sm mt-1">
                Review and adjust the details of your task.
              </Text>
            </View>
          </View>

          {/* Task Title Section */}
          <View className="mb-8">
            <View className="mb-4">
              <Text className="text-[#364958] text-xl font-bold mb-2">Task Title</Text>
              <Text className="text-[#364958] text-sm opacity-75">
                Tap on the title to edit.
              </Text>
            </View>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Placeholder Title Text"
              className="bg-[#f5ebe0] border border-[#a3b18a] rounded-2xl px-4 py-4 text-[#364958] text-lg shadow-sm"
              style={{ shadowColor: '#7c7c7c', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.75, shadowRadius: 0 }}
            />
          </View>

          {/* Eat the Frog Section */}
          <View className="mb-8">
            <View className="bg-[#f5ebe0] border border-[#a3b18a] rounded-2xl p-4 flex-row items-center shadow-sm"
              style={{ shadowColor: '#7c7c7c', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.75, shadowRadius: 0 }}
            >
              <View className="flex-1">
                <Text className="text-[#364958] text-lg font-bold mb-2">Eat the frog</Text>
                <Text className="text-[#364958] text-sm opacity-75">
                  Choose this task if completing it will make your day a success.
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsFrog(!isFrog)}
                className={`border border-[#9b9b9b] rounded-xl p-2 shadow-sm ${isFrog ? 'bg-[#a3b18a]' : 'bg-[#d9d9d9]'}`}
                style={{ 
                  shadowColor: '#7c7c7c', 
                  shadowOffset: { width: 0, height: 2 }, 
                  shadowOpacity: 0.75, 
                  shadowRadius: 0,
                  width: 44,
                  height: 44,
                }}
              >
                <Text className="text-2xl text-center" style={{ opacity: isFrog ? 1 : 0.4 }}>🐸</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Goal/Milestone Attachment Section */}
          <View className="mb-8">
            <View className="mb-4">
              <Text className="text-[#364958] text-xl font-bold mb-2">Goal / Milestone</Text>
              <Text className="text-[#364958] text-sm opacity-75">
                Attach either a goal or milestone to your task.
              </Text>
            </View>

            {/* Attachment Type Toggle */}
            <View className="flex-row mb-4 bg-[#f5ebe0] border border-[#a3b18a] rounded-2xl p-1 shadow-sm"
              style={{ shadowColor: '#7c7c7c', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.75, shadowRadius: 0 }}
            >
              <TouchableOpacity
                onPress={() => setAttachmentType('goal')}
                className={`flex-1 py-3 px-4 rounded-xl ${attachmentType === 'goal' ? 'bg-[#a3b18a]' : 'bg-transparent'}`}
              >
                <Text className={`text-center font-bold ${attachmentType === 'goal' ? 'text-[#f5ebe0]' : 'text-[#364958]'}`}>
                  Goal
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setAttachmentType('milestone')}
                className={`flex-1 py-3 px-4 rounded-xl ${attachmentType === 'milestone' ? 'bg-[#a3b18a]' : 'bg-transparent'}`}
              >
                <Text className={`text-center font-bold ${attachmentType === 'milestone' ? 'text-[#f5ebe0]' : 'text-[#364958]'}`}>
                  Milestones
                </Text>
              </TouchableOpacity>
            </View>

            {/* Goal Selection */}
            {attachmentType === 'goal' && (
              <View>
                <TouchableOpacity
                  onPress={() => setShowGoalDropdown(!showGoalDropdown)}
                  className="bg-[#f5ebe0] border border-[#a3b18a] rounded-2xl px-4 py-4 flex-row items-center justify-between shadow-sm"
                  style={{ shadowColor: '#7c7c7c', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.75, shadowRadius: 0 }}
                >
                  <Text className="text-[#364958] text-sm flex-1">
                    {selectedGoal ? selectedGoal.title : 'Select your main or sub goal'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#364958" />
                </TouchableOpacity>

                {showGoalDropdown && (
                  <View className="mt-2 bg-[#f5ebe0] border border-[#a3b18a] rounded-2xl shadow-sm"
                    style={{ shadowColor: '#7c7c7c', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.75, shadowRadius: 0 }}
                  >
                    {goals.map((goal) => (
                      <TouchableOpacity
                        key={goal.id}
                        onPress={() => {
                          setSelectedGoalId(goal.id);
                          setSelectedMilestoneId('');
                          setShowGoalDropdown(false);
                        }}
                        className="px-4 py-4 flex-row items-center justify-between border-b border-[#a3b18a] last:border-b-0"
                      >
                        <Text className="text-[#364958] text-sm font-bold flex-1">
                          {goal.title}
                        </Text>
                        <TouchableOpacity
                          className="bg-[#6096ba] border border-[#9b9b9b] rounded-xl p-2 shadow-sm"
                          style={{ shadowColor: '#7c7c7c', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.75, shadowRadius: 0 }}
                        >
                          <Ionicons name={selectedGoalId === goal.id ? "close" : "add"} size={20} color="#f5ebe0" />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Milestone Selection */}
            {attachmentType === 'milestone' && (
              <View>
                <TouchableOpacity
                  onPress={() => setShowMilestoneDropdown(!showMilestoneDropdown)}
                  className="bg-[#f5ebe0] border border-[#a3b18a] rounded-2xl px-4 py-4 flex-row items-center justify-between shadow-sm"
                  style={{ shadowColor: '#7c7c7c', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.75, shadowRadius: 0 }}
                >
                  <Text className="text-[#364958] text-sm flex-1">
                    {selectedMilestone ? selectedMilestone.title : 'Select milestone'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#364958" />
                </TouchableOpacity>

                {showMilestoneDropdown && (
                  <View className="mt-2 bg-[#f5ebe0] border border-[#a3b18a] rounded-2xl shadow-sm"
                    style={{ shadowColor: '#7c7c7c', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.75, shadowRadius: 0 }}
                  >
                    {availableMilestones.map((milestone) => (
                      <TouchableOpacity
                        key={milestone.id}
                        onPress={() => {
                          setSelectedMilestoneId(milestone.id);
                          setSelectedGoalId('');
                          setShowMilestoneDropdown(false);
                        }}
                        className="px-4 py-4 flex-row items-center justify-between border-b border-[#a3b18a] last:border-b-0"
                      >
                        <Text className="text-[#364958] text-sm font-bold flex-1">
                          {milestone.title}
                        </Text>
                        <TouchableOpacity
                          className="bg-[#6096ba] border border-[#9b9b9b] rounded-xl p-2 shadow-sm"
                          style={{ shadowColor: '#7c7c7c', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.75, shadowRadius: 0 }}
                        >
                          <Ionicons name={selectedMilestoneId === milestone.id ? "close" : "add"} size={20} color="#f5ebe0" />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Date Picker Section */}
          <View className="mb-8">
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              className="bg-[#f5ebe0] border border-[#a3b18a] rounded-2xl px-6 py-4 flex-row items-center justify-between shadow-sm"
              style={{ shadowColor: '#7c7c7c', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.75, shadowRadius: 0 }}
            >
              <Text className="text-[#364958] text-xl font-light">
                {scheduledDate.toLocaleDateString()}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#364958" />
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={scheduledDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            )}
          </View>

          {/* Focus History Section */}
          <View className="mb-8">
            <View className="mb-4">
              <Text className="text-[#364958] text-xl font-bold mb-2">Focus History</Text>
              <Text className="text-[#364958] text-sm opacity-75">
                A record of the time and dedication you've invested in this task.
              </Text>
            </View>
            <View className="bg-[#f5ebe0] border border-[#a3b18a] rounded-2xl p-4 shadow-sm"
              style={{ shadowColor: '#7c7c7c', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.75, shadowRadius: 0 }}
            >
              <Text className="text-[#364958] text-sm font-bold mb-2">Your recent activity</Text>
              <Text className="text-[#364958] text-sm mb-1">
                Sessions in total: <Text className="font-light">{focusHistory.totalSessions} Sessions</Text>
              </Text>
              <Text className="text-[#364958] text-sm mb-1">
                Total time spent: <Text className="font-light">{focusHistory.totalHours} Hours {focusHistory.totalMinutes} Minutes</Text>
              </Text>
              <Text className="text-[#364958] text-sm mb-2">Session history:</Text>
              {focusHistory.sessions.map((session, index) => (
                <Text key={index} className="text-[#364958] text-sm font-light ml-4 mb-1">
                  • {session}
                </Text>
              ))}
            </View>
          </View>

          {/* Notes Section */}
          <View className="mb-8">
            <View className="mb-4">
              <Text className="text-[#364958] text-xl font-bold mb-2">Notes & Details</Text>
              <Text className="text-[#364958] text-sm opacity-75">
                Add any extra thoughts, links, or steps you want to remember.
              </Text>
            </View>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Type here your notes and details..."
              multiline
              numberOfLines={4}
              className="bg-[#f5ebe0] border border-[#a3b18a] rounded-2xl px-4 py-4 text-[#364958] text-base shadow-sm"
              style={{ 
                textAlignVertical: 'top',
                shadowColor: '#7c7c7c', 
                shadowOffset: { width: 0, height: 4 }, 
                shadowOpacity: 0.75, 
                shadowRadius: 0 
              }}
            />
          </View>

          {/* Action Buttons */}
          <View className="flex-row justify-between items-center mb-8">
            <TouchableOpacity
              onPress={handleDelete}
              className="bg-[#bc4b51] border border-[#9b9b9b] rounded-xl px-6 py-3 flex-row items-center shadow-sm"
              style={{ shadowColor: '#7c7c7c', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.75, shadowRadius: 0 }}
            >
              <Ionicons name="trash-outline" size={20} color="#f5ebe0" />
              <Text className="text-[#f5ebe0] text-sm font-bold ml-2">Delete task</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              className="bg-[#a3b18a] border border-[#9b9b9b] rounded-xl px-6 py-3 flex-row items-center shadow-sm"
              style={{ shadowColor: '#7c7c7c', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.75, shadowRadius: 0 }}
            >
              <Ionicons name="save-outline" size={20} color="#f5ebe0" />
              <Text className="text-[#f5ebe0] text-sm font-bold ml-2">Save changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
