import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGoals, useMilestones } from '../src/hooks/useDatabase';

const EMOTIONS = [
  { id: 'confident', label: 'Confident', color: '#f7e1d7', textColor: '#e07a5f' },
  { id: 'grateful', label: 'Grateful', color: '#c8d5b9', textColor: '#6b8e23' },
  { id: 'proud', label: 'Proud', color: '#e6d7ff', textColor: '#8b5cf6' },
  { id: 'calm', label: 'Calm', color: '#b8e6e1', textColor: '#20b2aa' },
  { id: 'energized', label: 'Energized', color: '#ffd89b', textColor: '#ff8c00' },
  { id: 'happy', label: 'Happy', color: '#a8d8ff', textColor: '#4169e1' },
  { id: 'empowered', label: 'Empowered', color: '#ffb3ba', textColor: '#dc143c' },
  { id: 'excited', label: 'Excited', color: '#ffdfba', textColor: '#ff6347' },
  { id: 'fulfilled', label: 'Fulfilled', color: '#f2cc8f', textColor: '#e07a5f' },
];

export default function GoalDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { goals, updateGoal, deleteGoal } = useGoals();
  const { milestones } = useMilestones();
  
  const [goal, setGoal] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [visionImageUrl, setVisionImageUrl] = useState('');

  useEffect(() => {
    if (id && goals.length > 0) {
      const foundGoal = goals.find(g => g.id === id);
      if (foundGoal) {
        setGoal(foundGoal);
        setTitle(foundGoal.title);
        setNotes(foundGoal.notes || '');
        setSelectedEmotions(foundGoal.feelings || []);
        setVisionImageUrl(foundGoal.visionImageUrl || '');
      }
    }
  }, [id, goals]);

  const handleEmotionToggle = (emotionId: string) => {
    setSelectedEmotions(prev => {
      if (prev.includes(emotionId)) {
        return prev.filter(id => id !== emotionId);
      } else if (prev.length < 5) {
        return [...prev, emotionId];
      }
      return prev;
    });
  };

  const handleSave = async () => {
    if (!goal || !title.trim()) {
      Alert.alert('Error', 'Please enter a goal title');
      return;
    }

    try {
      await updateGoal(goal.id, {
        title: title.trim(),
        notes: notes.trim(),
        feelings: selectedEmotions,
        visionImageUrl: visionImageUrl,
      });
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to update goal');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this goal? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteGoal(goal.id);
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete goal');
            }
          },
        },
      ]
    );
  };

  const goalMilestones = milestones.filter(m => m.goalId === id);

  if (!goal) {
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
              <Text className="text-[#364958] text-2xl font-bold">My Goal</Text>
              <Text className="text-[#364958] text-sm mt-1">
                Review and adjust the details of your vision.
              </Text>
            </View>
          </View>

          {/* Goal Title Section */}
          <View className="mb-8">
            <View className="mb-4">
              <Text className="text-[#364958] text-xl font-bold mb-2">Goal Title</Text>
              <Text className="text-[#364958] text-sm opacity-75">
                Tap the title to edit.
              </Text>
            </View>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Enter your goal title"
              className="bg-[#f5ebe0] border border-[#a3b18a] rounded-2xl px-4 py-4 text-[#364958] text-lg shadow-sm"
              style={{ shadowColor: '#7c7c7c', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.75, shadowRadius: 0 }}
            />
          </View>

          {/* Emotions Section */}
          <View className="mb-8">
            <View className="mb-4">
              <Text className="text-[#364958] text-xl font-bold mb-2">
                How do you feel after you achieved your goal?
              </Text>
              <Text className="text-[#364958] text-sm">
                Choose up to 5 emotions.
              </Text>
            </View>
            <View className="flex-row flex-wrap gap-4">
              {EMOTIONS.map((emotion) => (
                <TouchableOpacity
                  key={emotion.id}
                  onPress={() => handleEmotionToggle(emotion.id)}
                  className="px-3 py-2 rounded-md border-[0.3px] shadow-sm"
                  style={{
                    backgroundColor: selectedEmotions.includes(emotion.id) 
                      ? emotion.color 
                      : '#f5ebe0',
                    borderColor: emotion.textColor,
                    shadowColor: '#7c7c7c',
                    shadowOffset: { width: 0, height: 1.5 },
                    shadowOpacity: 0.75,
                    shadowRadius: 0,
                    width: 80,
                    height: 30,
                  }}
                >
                  <Text 
                    className="text-center text-sm"
                    style={{ color: emotion.textColor }}
                  >
                    {emotion.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Vision Section */}
          <View className="mb-8">
            <View className="mb-4">
              <Text className="text-[#364958] text-xl font-bold mb-2">Your Vision</Text>
              <Text className="text-[#364958] text-sm opacity-75">
                Begin with the end in mind. This is what you're working towards.
              </Text>
            </View>
            <TouchableOpacity 
              className="bg-[#e3e3e3] border border-[#a3b18a] rounded-2xl h-64 items-center justify-center shadow-sm"
              style={{ shadowColor: '#9b9b9b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.75, shadowRadius: 0 }}
            >
              {visionImageUrl ? (
                <Image 
                  source={{ uri: visionImageUrl }} 
                  className="w-full h-full rounded-2xl"
                  resizeMode="cover"
                />
              ) : (
                <View className="items-center justify-center">
                  <Ionicons name="image-outline" size={48} color="#9b9b9b" />
                  <Text className="text-[#9b9b9b] text-sm mt-2">Tap to add vision image</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Milestones Section */}
          <View className="mb-8">
            <View className="bg-[#f5ebe0] border border-[#a3b18a] rounded-2xl p-4 shadow-sm"
              style={{ shadowColor: '#7c7c7c', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.75, shadowRadius: 0 }}
            >
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-[#364958] text-sm">Explore your milestones</Text>
                <Ionicons name="chevron-down" size={20} color="#364958" />
              </View>
              <Text className="text-[#364958] text-lg font-bold mb-4">Milestones</Text>
              
              {goalMilestones.length > 0 ? (
                goalMilestones.map((milestone) => (
                  <TouchableOpacity
                    key={milestone.id}
                    onPress={() => router.push(`/milestone-details?id=${milestone.id}`)}
                    className="bg-[rgba(233,237,201,0.4)] border border-[#a3b18a] rounded-2xl p-4 mb-3 shadow-sm"
                    style={{ shadowColor: '#7c7c7c', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.75, shadowRadius: 0 }}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className="text-[#364958] text-sm font-bold mb-1">
                          {milestone.title}
                        </Text>
                        <Text className="text-[#364958] text-xs opacity-75 mb-2">
                          Milestone description
                        </Text>
                        <View className="flex-row items-center">
                          <Ionicons name="calendar-outline" size={13} color="#364958" />
                          <Text className="text-[#364958] text-xs ml-2">
                            {milestone.targetDate ? new Date(milestone.targetDate).toLocaleDateString() : 'None'}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        className="bg-[#a3b18a] border border-[#9b9b9b] rounded-xl p-2 shadow-sm"
                        style={{ shadowColor: '#7c7c7c', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.75, shadowRadius: 0 }}
                      >
                        <Ionicons name="checkmark" size={20} color="#f5ebe0" />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <Text className="text-[#364958] text-sm opacity-75">No milestones yet</Text>
              )}
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
              <Text className="text-[#f5ebe0] text-sm font-bold ml-2">Delete goal</Text>
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
