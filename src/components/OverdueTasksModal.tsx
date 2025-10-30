import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Image } from 'expo-image';
import type { Task } from '../types';
import { useGoals, useMilestones } from '../hooks/useDatabase';

interface OverdueTasksModalProps {
  visible: boolean;
  overdueTasks: Task[];
  onClose: () => void;
  onReschedule: (taskIds: string[], newDate: Date) => Promise<void>;
  onComplete: (taskIds: string[]) => Promise<void>;
  onDelete: (taskIds: string[]) => Promise<void>;
}

interface SelectableTask extends Task {
  isSelected: boolean;
  _raw?: any; // WatermelonDB raw data access
}

export function OverdueTasksModal({
  visible,
  overdueTasks,
  onClose,
  onReschedule,
  onComplete,
  onDelete,
}: OverdueTasksModalProps) {
  const { t } = useTranslation();
  const [selectableTasks, setSelectableTasks] = useState<SelectableTask[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [actionType, setActionType] = useState<'reschedule' | 'complete' | 'delete' | null>(null);

  const { goals } = useGoals();
  const { milestones } = useMilestones();

  // Initialize selectable tasks when modal opens
  React.useEffect(() => {
    if (visible && overdueTasks.length > 0) {
      console.log('🔍 Modal: Received overdue tasks:', overdueTasks.map(t => ({
        id: t.id,
        title: t.title,
        scheduledDate: t.scheduledDate
      })));
      
      setSelectableTasks(
        overdueTasks.map(task => ({ ...task, isSelected: false }))
      );
    }
  }, [visible, overdueTasks]);

  const toggleTaskSelection = (taskId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectableTasks(prev =>
      prev.map(task => {
        const currentTaskId = task._raw?.id || task.id;
        return currentTaskId === taskId ? { ...task, isSelected: !task.isSelected } : task;
      })
    );
  };

  const getSelectedTaskIds = () => {
    return selectableTasks.filter(task => task.isSelected).map(task => task._raw?.id || task.id);
  };

  const handleAction = async (type: 'reschedule' | 'complete' | 'delete') => {
    const selectedIds = getSelectedTaskIds();
    
    if (selectedIds.length === 0) {
      Alert.alert(t('components.overdueTasksModal.alerts.noTasksSelected'), t('components.overdueTasksModal.alerts.noTasksSelectedMessage'));
      return;
    }

    setActionType(type);

    if (type === 'reschedule') {
      setShowDatePicker(true);
    } else if (type === 'complete') {
      Alert.alert(
        t('components.overdueTasksModal.alerts.markComplete'),
        t('components.overdueTasksModal.alerts.markCompleteMessage', { count: selectedIds.length }),
        [
          { text: t('components.overdueTasksModal.alerts.cancel'), style: 'cancel' },
          {
            text: t('components.overdueTasksModal.alerts.complete'),
            onPress: async () => {
              await onComplete(selectedIds);
              // Remove completed tasks from selection
              setSelectableTasks(prev => prev.filter(task => !selectedIds.includes(task._raw?.id || task.id)));
            }
          }
        ]
      );
    } else if (type === 'delete') {
      Alert.alert(
        t('components.overdueTasksModal.alerts.deleteTasks'),
        t('components.overdueTasksModal.alerts.deleteTasksMessage', { count: selectedIds.length }),
        [
          { text: t('components.overdueTasksModal.alerts.cancel'), style: 'cancel' },
          {
            text: t('components.overdueTasksModal.alerts.delete'),
            style: 'destructive',
            onPress: async () => {
              await onDelete(selectedIds);
              // Remove deleted tasks from selection
              setSelectableTasks(prev => prev.filter(task => !selectedIds.includes(task._raw?.id || task.id)));
            }
          }
        ]
      );
    }
  };

  const handleDateConfirm = async () => {
    const selectedIds = getSelectedTaskIds();
    setShowDatePicker(false);
    
    if (actionType === 'reschedule' && selectedIds.length > 0) {
      await onReschedule(selectedIds, selectedDate);
      // Remove rescheduled tasks from selection
      setSelectableTasks(prev => prev.filter(task => !selectedIds.includes(task._raw?.id || task.id)));
    }
    
    setActionType(null);
  };

  const handleRescheduleToday = async () => {
    const selectedIds = getSelectedTaskIds();
    
    if (selectedIds.length === 0) {
      Alert.alert(t('components.overdueTasksModal.alerts.noTasksSelected'), t('components.overdueTasksModal.alerts.noTasksSelectedReschedule'));
      return;
    }

    const today = new Date();
    await onReschedule(selectedIds, today);
    // Remove rescheduled tasks from selection
    setSelectableTasks(prev => prev.filter(task => !selectedIds.includes(task._raw?.id || task.id)));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const monthKeys = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 
                       'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const month = t(`calendar.months.${monthKeys[date.getMonth()]}`);
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${month}.${day}.${year}`;
  };

  const getProjectText = (task: SelectableTask) => {
    const milestoneId = task._raw?.milestone_id || task.milestoneId;
    const goalId = task._raw?.goal_id || task.goalId;
    
    if (milestoneId) {
      const milestone = milestones.find(m => m.id === milestoneId);
      return milestone?.title || t('components.overdueTasksModal.taskDefaults.milestone');
    }
    if (goalId) {
      const goal = goals.find(g => g.id === goalId);
      return goal?.title || t('components.overdueTasksModal.taskDefaults.goal');
    }
    return t('components.overdueTasksModal.taskDefaults.noProjectLinked');
  };

  // Auto-close modal when no tasks remain
  React.useEffect(() => {
    if (visible && selectableTasks.length === 0 && overdueTasks.length === 0) {
      onClose();
    }
  }, [selectableTasks.length, overdueTasks.length, visible, onClose]);

  if (!visible || selectableTasks.length === 0) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('components.overdueTasksModal.title')}</Text>
            <Text style={styles.modalSubtitle}>
              {t('components.overdueTasksModal.subtitle', { count: selectableTasks.length })}
            </Text>
          </View>

          {/* Tasks List */}
          <ScrollView style={styles.tasksList} showsVerticalScrollIndicator={false}>
            {selectableTasks.map((task) => {
              console.log('🔍 Rendering task:', {
                id: task._raw?.id || task.id,
                title: task._raw?.title || task.title,
                scheduledDate: task._raw?.scheduled_date || task.scheduledDate,
                fullTask: task
              });
              
              return (
                <TouchableOpacity
                  key={task._raw?.id || task.id}
                  style={[
                    styles.taskCard,
                    task.isSelected && styles.taskCardSelected
                  ]}
                  onPress={() => toggleTaskSelection(task._raw?.id || task.id)}
                >
                  {/* Selection Checkbox */}
                  <View style={styles.taskCardContent}>
                    <View style={[
                      styles.checkbox,
                      task.isSelected && styles.checkboxSelected
                    ]}>
                      {task.isSelected && (
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      )}
                    </View>

                    {/* Task Content */}
                    <View style={styles.taskInfo}>
                      <Text style={styles.taskTitle} numberOfLines={3}>
                        {task._raw?.title || task.title || t('components.overdueTasksModal.taskDefaults.noTitle')}
                      </Text>
                    
                    <View style={styles.taskMeta}>
                      <View style={styles.metaRow}>
                        <Ionicons name="flag" size={12} color="#364958" />
                        <Text style={styles.metaText}>
                          {getProjectText(task)}
                        </Text>
                      </View>
                      <View style={styles.metaRow}>
                        <Ionicons name="calendar-outline" size={12} color="#BC4B51" />
                        <Text style={[styles.metaText, styles.overdueText]}>
                          {t('components.overdueTasksModal.taskDefaults.due')} {formatDate(task._raw?.scheduled_date || task.scheduledDate || new Date().toISOString())}
                        </Text>
                      </View>
                    </View>

                    {/* Frog Badge */}
                    {(task._raw?.is_frog || task.isFrog) && (
                      <View style={styles.frogBadge}>
                        <Image 
                          source={require('../../assets/frog.png')}
                          style={styles.frogIcon}
                          contentFit="contain"
                        />
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.rescheduleButton]}
              onPress={handleRescheduleToday}
            >
              <Text style={styles.actionButtonText}>{t('components.overdueTasksModal.buttons.rescheduleToToday')}</Text>
            </TouchableOpacity>

            <View style={styles.actionButtonRow}>
              <TouchableOpacity
                style={[styles.actionButton, styles.customDateButton]}
                onPress={() => handleAction('reschedule')}
              >
                <Ionicons name="calendar-outline" size={20} color="#F5EBE0" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.completeButton]}
                onPress={() => handleAction('complete')}
              >
                <Text style={styles.completeButtonText}>✓</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleAction('delete')}
              >
                <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>{t('components.overdueTasksModal.buttons.close')}</Text>
          </TouchableOpacity>
        </View>

        {/* Date Picker Modal */}
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.dateModalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('components.overdueTasksModal.datePicker.title')}</Text>
              </View>
              
              <View style={styles.datePickerWrapper}>
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="spinner"
                  onChange={(event, date) => {
                    if (date) setSelectedDate(date);
                  }}
                  textColor="#364958"
                />
              </View>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.modalCancelButton}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={styles.modalCancelText}>{t('components.overdueTasksModal.datePicker.cancel')}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.modalConfirmButton}
                  onPress={handleDateConfirm}
                >
                  <Text style={styles.modalConfirmText}>{t('components.overdueTasksModal.datePicker.confirm')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#F5EBE0',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    height: '85%',
    shadowColor: '#7C7C7C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    borderWidth: 0.5,
    borderColor: '#A3B18A',
  },
  modalHeader: {
    padding: 20,
    paddingBottom: 15,
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: '#A3B18A',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#364958',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 15,
    fontWeight: '300',
    color: '#364958',
    textAlign: 'center',
    lineHeight: 20,
  },
  tasksList: {
    maxHeight: 400,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  taskCard: {
    backgroundColor: '#E9EDC9',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: '#A3B18A',
    shadowColor: '#7C7C7C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  taskCardSelected: {
    backgroundColor: '#D4E2B8',
    borderColor: '#A3B18A',
    borderWidth: 2,
  },
  taskCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#A3B18A',
    backgroundColor: '#F5EBE0',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxSelected: {
    backgroundColor: '#A3B18A',
    borderColor: '#A3B18A',
  },
  taskInfo: {
    flex: 1,
    position: 'relative',
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#364958',
    marginBottom: 8,
    paddingRight: 30, // Space for frog badge
    lineHeight: 20,
    width: '100%',
  },
  taskMeta: {
    gap: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '300',
    color: '#364958',
  },
  overdueText: {
    color: '#BC4B51',
    fontWeight: '500',
  },
  frogBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 20,
    height: 20,
    backgroundColor: '#90EE90',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: '#228B22',
  },
  frogIcon: {
    width: 12,
    height: 12,
  },
  actionButtonsContainer: {
    padding: 20,
    gap: 12,
  },
  actionButtonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    shadowColor: '#7C7C7C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  rescheduleButton: {
    backgroundColor: '#E9EDC9',
    borderWidth: 0.5,
    borderColor: '#A3B18A',
  },
  customDateButton: {
    backgroundColor: '#6096BA',
    flex: 1,
    borderWidth: 0.5,
    borderColor: '#9b9b9b',
  },
  completeButton: {
    backgroundColor: '#A3B18A',
    flex: 1,
    borderColor: '#9B9B9B',
  },
  deleteButton: {
    backgroundColor: '#BC4B51',
    flex: 1,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#364958',
  },
  completeButtonText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F5EBE0',
    textAlign: 'center',
  },
  closeButton: {
    paddingVertical: 15,
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: '#A3B18A',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#364958',
    opacity: 0.7,
  },
  
  // Date picker modal styles (matching manual-task.tsx)
  dateModalContainer: {
    backgroundColor: '#F5EBE0',
    borderRadius: 20,
    width: '100%',
    maxWidth: 350,
    alignSelf: 'center',
    shadowColor: '#7C7C7C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    borderWidth: 0.5,
    borderColor: '#A3B18A',
  },
  datePickerWrapper: {
    backgroundColor: '#E9EDC9',
    marginHorizontal: 15,
    borderRadius: 15,
    borderWidth: 0.5,
    borderColor: '#A3B18A',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    gap: 15,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    shadowColor: '#7C7C7C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
    backgroundColor: '#BC4B51',
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    shadowColor: '#7C7C7C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
    backgroundColor: '#A3B18A',
  },
  modalCancelText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
