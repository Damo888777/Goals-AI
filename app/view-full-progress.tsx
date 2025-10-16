import { View, Text, ScrollView, TextInput, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState, useEffect, useMemo } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { CompletedTaskCard } from '../src/components/CompletedTaskCard';
import type { Task } from '../src/types';
import { typography } from '../src/constants/typography';
import { colors } from '../src/constants/colors';
import { spacing, borderRadius, shadows, emptyStateSpacing } from '../src/constants/spacing';
import { useTasks } from '../src/hooks/useDatabase';
import { Button } from '../src/components/Button';
import { BackChevronButton } from '../src/components/ChevronButton';

export default function ViewFullProgressScreen() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDateModalVisible, setIsDateModalVisible] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const { tasks } = useTasks();

  // Get completed tasks from database
  const completedTasks = useMemo(() => {
    return tasks.filter((task: Task) => task.isComplete);
  }, [tasks]);

  const handleBack = () => {
    router.back();
  };

  const handleTaskPress = (task: Task) => {
    console.log('Task pressed:', task.id);
  };

  const handleDatePickerPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTempDate(selectedDate || new Date());
    setIsDateModalVisible(true);
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (date) {
      setTempDate(date);
    }
  };

  const handleDateConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDate(tempDate);
    setIsDateModalVisible(false);
  };

  const handleDateCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTempDate(selectedDate || new Date());
    setIsDateModalVisible(false);
  };

  const clearDateFilter = () => {
    setSelectedDate(null);
  };

  const formatDate = (date: Date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${month}.${day}.${year}`;
  };

  // Filter tasks based on search query and date
  const filteredTasks = useMemo(() => {
    return completedTasks.filter((task: Task) => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
      const taskCompletionDate = formatDate(task.updatedAt || new Date());
      const matchesDate = !selectedDate || taskCompletionDate === formatDate(selectedDate);
      return matchesSearch && matchesDate;
    });
  }, [completedTasks, searchQuery, selectedDate]);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingHorizontal: 36,
          paddingBottom: 50,
          gap: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <BackChevronButton
              onPress={handleBack}
              style={styles.backButton}
            />
            <Text style={styles.headerTitle}>All Completed Tasks</Text>
          </View>
          <Text style={styles.headerDescription}>Review your completed tasks and celebrate your progress.</Text>
        </View>

        {/* Search and Date Filter Container */}
        <View style={styles.filtersContainer}>
          {/* Search Bar */}
          <View style={styles.searchInnerContainer}>
            <View style={styles.searchInputContainer}>
              <Icon name="search" size={20} color="#7C7C7C" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search completed tasks..."
                placeholderTextColor="#7C7C7C"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                  <Icon name="clear" size={20} color="#7C7C7C" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Date Filter */}
          <View style={styles.dateFilterInnerContainer}>
            <Ionicons name="calendar-outline" size={20} color="#7C7C7C" style={styles.dateIcon} />
            <TouchableOpacity 
              style={styles.datePickerButton}
              onPress={handleDatePickerPress}
            >
              <Text style={styles.datePickerButtonText}>
                {selectedDate ? formatDate(selectedDate) : 'Filter by completion date'}
              </Text>
            </TouchableOpacity>
            {selectedDate && (
              <TouchableOpacity onPress={clearDateFilter} style={styles.clearDateButton}>
                <Text style={styles.clearDateButtonText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Completed Tasks Section */}
        <View style={styles.completedTasksContainer}>
          <View style={styles.completedTasksHeader}>
            <Text style={styles.completedTasksTitle}>Completed Tasks</Text>
            <Text style={styles.resultsText}>
              {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
            </Text>
          </View>

          {/* Completed Tasks List */}
          <View style={styles.tasksListContainer}>
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task: Task) => (
                <CompletedTaskCard
                  key={task.id}
                  task={task}
                  onPress={() => handleTaskPress(task)}
                />
              ))
            ) : (
              <CompletedTaskCard
                emptyState={{
                  title: "No completed tasks found",
                  description: searchQuery || selectedDate 
                    ? 'Try adjusting your search or date filter.'
                    : 'Complete some tasks to see them here.'
                }}
              />
            )}
          </View>
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      <Modal
        visible={isDateModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleDateCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date</Text>
            </View>
            
            <View style={styles.datePickerWrapper}>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                textColor="#364958"
                style={styles.nativeDatePicker}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={handleDateCancel}
              >
                <Text style={styles.cancelModalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmModalButton]}
                onPress={handleDateConfirm}
              >
                <Text style={styles.confirmModalButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  header: {
    gap: 8,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.title,
  },
  headerDescription: {
    ...typography.body,
    color: '#7C7C7C',
    fontWeight: '300',
    lineHeight: 18,
  },
  filtersContainer: {
    backgroundColor: '#F5EBE0',
    borderWidth: 0.5,
    borderColor: '#A3B18A',
    borderRadius: 20,
    padding: 15,
    gap: 12,
    shadowColor: '#7C7C7C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  searchInnerContainer: {
    backgroundColor: '#EAE2B7', // Completed task background
    borderWidth: 0.5,
    borderColor: '#B69121', // Completed task border
    borderRadius: 15,
    padding: 12,
    shadowColor: '#B69121',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 4,
    gap: 8,
  },
  searchIcon: {
    marginLeft: 4,
  },
  dateIcon: {
    marginLeft: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#364958',
    fontFamily: 'Helvetica',
    paddingVertical: 4,
  },
  clearButton: {
    padding: 4,
  },
  dateFilterInnerContainer: {
    backgroundColor: '#EAE2B7', // Completed task background
    borderWidth: 0.5,
    borderColor: '#B69121', // Completed task border
    borderRadius: 15,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#B69121',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  datePickerButton: {
    flex: 1,
    paddingVertical: 4,
    minHeight: 44,
    justifyContent: 'center',
  },
  datePickerButtonText: {
    fontSize: 14,
    color: '#364958',
    fontFamily: 'Helvetica',
  },
  clearDateButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  clearDateButtonText: {
    fontSize: 14,
    color: '#BC4749',
    fontFamily: 'Helvetica',
    fontWeight: '500',
  },
  completedTasksContainer: {
    backgroundColor: '#F5EBE0',
    borderWidth: 0.5,
    borderColor: '#A3B18A',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#7C7C7C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  completedTasksHeader: {
    marginBottom: 20,
    gap: 4,
  },
  completedTasksTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#364958',
    fontFamily: 'Helvetica',
  },
  resultsText: {
    fontSize: 14,
    color: '#7C7C7C',
    fontFamily: 'Helvetica',
    fontWeight: '300',
  },
  tasksListContainer: {
    gap: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#F5EBE0',
    borderRadius: 20,
    padding: 20,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#364958',
    fontFamily: 'Helvetica',
  },
  datePickerWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  nativeDatePicker: {
    height: 200,
    width: '100%',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  cancelModalButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#BC4749',
  },
  cancelModalButtonText: {
    color: '#BC4749',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Helvetica',
  },
  confirmModalButton: {
    backgroundColor: '#A3B18A',
  },
  confirmModalButtonText: {
    color: '#F5EBE0',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Helvetica',
  },
});
