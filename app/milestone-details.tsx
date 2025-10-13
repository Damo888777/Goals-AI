import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useGoals, useMilestones } from '../src/hooks/useDatabase';

export default function MilestoneDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { goals } = useGoals();
  const { milestones, updateMilestone, deleteMilestone } = useMilestones();
  
  const [milestone, setMilestone] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [targetDate, setTargetDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGoalDropdown, setShowGoalDropdown] = useState(false);

  useEffect(() => {
    if (id && milestones.length > 0) {
      const foundMilestone = milestones.find(m => m.id === id);
      if (foundMilestone) {
        setMilestone(foundMilestone);
        setTitle(foundMilestone.title);
        setNotes('');
        setSelectedGoalId(foundMilestone.goalId || '');
        setTargetDate(foundMilestone.targetDate ? new Date(foundMilestone.targetDate) : new Date());
      }
    }
  }, [id, milestones]);

  const selectedGoal = goals.find(g => g.id === selectedGoalId);

  const handleSave = async () => {
    if (!milestone || !title.trim()) {
      Alert.alert('Error', 'Please enter a milestone title');
      return;
    }

    if (!selectedGoalId) {
      Alert.alert('Error', 'Please select a goal for this milestone');
      return;
    }

    try {
      await updateMilestone(milestone.id, {
        title: title.trim(),
        goalId: selectedGoalId,
        targetDate: targetDate.toISOString(),
      });
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to update milestone');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Milestone',
      'Are you sure you want to delete this milestone? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMilestone(milestone.id);
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete milestone');
            }
          },
        },
      ]
    );
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setTargetDate(selectedDate);
    }
  };

  if (!milestone) {
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
              <Text className="text-[#364958] text-2xl font-bold">My Milestone</Text>
              <Text className="text-[#364958] text-sm mt-1">
                Review and adjust the details of your milestone.
              </Text>
            </View>
          </View>

          {/* Milestone Title Section */}
          <View className="mb-8">
            <View className="mb-4">
              <Text className="text-[#364958] text-xl font-bold mb-2">Milestone Title</Text>
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

          {/* My Goal Section */}
          <View className="mb-8">
            <View className="mb-4">
              <Text className="text-[#364958] text-xl font-bold mb-2">My goal</Text>
              <Text className="text-[#364958] text-sm opacity-75">
                Attach this milestone to your goal.
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowGoalDropdown(!showGoalDropdown)}
              className="bg-[#f5ebe0] border-[0.5px] border-[#a3b18a] rounded-2xl px-4 py-4 flex-row items-center justify-between shadow-sm"
              style={{ shadowColor: '#7c7c7c', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.75, shadowRadius: 0 }}
            >
              <Text className="text-[#364958] text-base flex-1">
                {selectedGoal ? selectedGoal.title : 'Select your goal'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#364958" />
            </TouchableOpacity>

            {/* Goal Dropdown */}
            {showGoalDropdown && (
              <View className="mt-2 bg-[#f5ebe0] border border-[#a3b18a] rounded-2xl shadow-sm"
                style={{ shadowColor: '#7c7c7c', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.75, shadowRadius: 0 }}
              >
                {goals.map((goal) => (
                  <TouchableOpacity
                    key={goal.id}
                    onPress={() => {
                      setSelectedGoalId(goal.id);
                      setShowGoalDropdown(false);
                    }}
                    className="px-4 py-4 flex-row items-center justify-between border-b border-[#a3b18a] last:border-b-0"
                  >
                    <Text className="text-[#364958] text-sm font-bold flex-1">
                      {goal.title}
                    </Text>
                    <View className="bg-[#6096ba] border border-[#9b9b9b] rounded-xl p-2 shadow-sm"
                      style={{ shadowColor: '#7c7c7c', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.75, shadowRadius: 0 }}
                    >
                      <Ionicons name="add" size={20} color="#f5ebe0" />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Date Picker Section */}
          <View className="mb-8">
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              className="bg-[#f5ebe0] border-[0.5px] border-[#a3b18a] rounded-2xl px-6 py-4 flex-row items-center justify-between shadow-sm"
              style={{ shadowColor: '#7c7c7c', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.75, shadowRadius: 0 }}
            >
              <Text className="text-[#364958] text-base font-normal">
                Select date
              </Text>
              <Ionicons name="chevron-down" size={20} color="#364958" />
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={targetDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            )}
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
              <Text className="text-[#f5ebe0] text-sm font-bold ml-2">Delete milestone</Text>
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
