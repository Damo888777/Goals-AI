import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { PomodoroSessionData, TaskTimeStats } from '../src/hooks/usePomodoroSessions';

interface FocusHistorySectionProps {
  taskId: string;
  focusSessions: PomodoroSessionData[];
  timeStats: TaskTimeStats | null;
  onStartPomodoro: () => void;
  isCompletedTask?: boolean;
}

export const FocusHistorySection: React.FC<FocusHistorySectionProps> = ({ 
  taskId, 
  focusSessions, 
  timeStats,
  onStartPomodoro,
  isCompletedTask = false
}) => {
  const { t } = useTranslation();
  // Use timeStats if available, otherwise calculate from sessions using actual duration
  const totalSessions = timeStats?.totalSessions || focusSessions.length;
  const totalMinutes = timeStats?.totalMinutes || focusSessions.reduce((sum, session) => {
    // Use actual duration if available, otherwise planned duration
    if (session.actualDurationSeconds) {
      return sum + Math.ceil(session.actualDurationSeconds / 60);
    }
    return sum + session.durationMinutes;
  }, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  
  // Get today's sessions for progress indicators
  const today = new Date();
  const todaySessions = focusSessions.filter(session => {
    const sessionDate = session.completedAt ? new Date(session.completedAt) : new Date(session.createdAt);
    return sessionDate.toDateString() === today.toDateString();
  });
  const todayPomodoroCount = todaySessions.filter(s => s.sessionType === 'work').length;

  const formatSessionTime = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();
    
    const timeStr = date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    
    if (isToday) {
      return `${t('focusHistory.timeFormat.today')}, ${timeStr}`;
    } else if (isYesterday) {
      return `${t('focusHistory.timeFormat.yesterday')}, ${timeStr}`;
    } else {
      return `${date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })}, ${timeStr}`;
    }
  };

  const formatSessionDuration = (session: PomodoroSessionData) => {
    // Use actual duration if available, otherwise fall back to planned duration
    if (session.actualDurationSeconds) {
      const minutes = Math.floor(session.actualDurationSeconds / 60);
      const seconds = session.actualDurationSeconds % 60;
      
      // Format based on the duration
      if (seconds === 0) {
        // Exact minutes: "25 Minutes"
        return `${minutes} ${minutes === 1 ? 'Minute' : 'Minutes'}`;
      } else {
        // With seconds: "12:40 Minutes"
        return `${minutes}:${seconds.toString().padStart(2, '0')} Minutes`;
      }
    }
    return `${session.durationMinutes} ${session.durationMinutes === 1 ? 'Minute' : 'Minutes'}`;
  };

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>
        {t('focusHistory.title')}
      </Text>
      <Text style={styles.sectionSubtitle}>
        {t('focusHistory.subtitle')}
      </Text>
      
      <View style={styles.focusHistoryCard}>
        {totalSessions === 0 ? (
          // Empty State
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateTitle}>
              {t('focusHistory.emptyState.title')}
            </Text>
            <Text style={styles.emptyStateDescription}>
              {isCompletedTask 
                ? t('focusHistory.emptyState.completedTaskDescription')
                : t('focusHistory.emptyState.activeTaskDescription')}
            </Text>
            {!isCompletedTask && (
              <TouchableOpacity
                style={[styles.startPomodoroButton, { marginTop: 8 }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onStartPomodoro();
                }}
              >
                <Text style={styles.startPomodoroButtonText}>{t('focusHistory.emptyState.startFocusSession')}</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          // Active State with Sessions
          <>
            <Text style={styles.focusHistoryCardTitle}>{t('focusHistory.activeState.title')}</Text>
            <Text style={styles.focusHistoryDescription}>
              {t('focusHistory.activeState.description')}
            </Text>
            
            {/* Today's Progress Indicators */}
            {todayPomodoroCount > 0 && (
              <View style={styles.sessionIndicatorSection}>
                <Text style={styles.sessionIndicatorLabel}>{t('focusHistory.activeState.todaysProgress')}</Text>
                <View style={styles.sessionIndicators}>
                  {[...Array(4)].map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.sessionIndicator,
                        index < todayPomodoroCount ? styles.completedIndicator : null
                      ]}
                    />
                  ))}
                </View>
              </View>
            )}
            
            {/* Session Statistics */}
            <View style={styles.sessionStats}>
              <Text style={styles.sessionStatsText}>{t('focusHistory.activeState.sessionsInTotal')} {totalSessions} {t('focusHistory.activeState.sessions')}</Text>
              <Text style={styles.sessionStatsText}>
                {t('focusHistory.activeState.totalTimeSpent')} {totalHours > 0 ? `${totalHours} ${t('focusHistory.activeState.hours')} ` : ''}{remainingMinutes} {t('focusHistory.activeState.minutes')}
              </Text>
            </View>
            
            {/* Session History */}
            <View style={styles.sessionHistorySection}>
              <Text style={styles.sessionHistoryTitle}>{t('focusHistory.activeState.sessionHistory')}</Text>
              <View style={styles.sessionHistoryList}>
                {focusSessions.slice(0, 5).map((session) => {
                  const sessionDate = session.completedAt ? new Date(session.completedAt) : new Date(session.createdAt);
                  return (
                    <View key={session.id} style={styles.sessionHistoryItem}>
                      <View style={styles.sessionBullet} />
                      <Text style={styles.sessionHistoryText}>
                        {formatSessionTime(sessionDate)} - {formatSessionDuration(session)}
                      </Text>
                    </View>
                  );
                })}
                {focusSessions.length > 5 && (
                  <Text style={[styles.sessionHistoryText, { fontStyle: 'italic', textAlign: 'center', marginTop: 8 }]}>
                    {t('focusHistory.activeState.andMoreSessions', { count: focusSessions.length - 5 })}
                  </Text>
                )}
              </View>
            </View>
            
            {/* Start Another Session Button */}
            <TouchableOpacity
              style={[styles.startPomodoroButton, { marginTop: 16 }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onStartPomodoro();
              }}
            >
              <Text style={styles.startPomodoroButtonText}>{t('focusHistory.activeState.startAnotherSession')}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Section styles
  sectionContainer: {
    marginBottom: 43,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#364958',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 15,
    color: '#364958',
    lineHeight: 20,
    marginBottom: 15,
    fontWeight: '300',
  },

  // Focus History styles (matching pomodoro.tsx aesthetics)
  focusHistoryCard: {
    backgroundColor: '#f5ebe0',
    borderRadius: 20,
    padding: 20,
    borderWidth: 0.5,
    borderColor: '#a3b18a',
    shadowColor: '#7c7c7c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  focusHistoryCardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#364958',
    marginBottom: 8,
  },
  focusHistoryDescription: {
    fontSize: 15,
    fontWeight: '300',
    color: '#364958',
    lineHeight: 20,
    marginBottom: 20,
  },
  sessionStats: {
    marginBottom: 20,
  },
  sessionStatsText: {
    fontSize: 15,
    color: '#364958',
    marginBottom: 4,
    fontWeight: '400',
  },
  sessionHistorySection: {
    marginTop: 8,
  },
  sessionHistoryTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#364958',
    marginBottom: 12,
  },
  sessionHistoryList: {
    gap: 8,
  },
  sessionHistoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sessionBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#364958',
  },
  sessionHistoryText: {
    fontSize: 14,
    color: '#364958',
    flex: 1,
    fontWeight: '400',
  },
  // Empty state styles
  emptyStateContainer: {
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#364958',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 15,
    fontWeight: '300',
    color: '#364958',
    textAlign: 'center',
    lineHeight: 20,
  },
  startPomodoroButton: {
    backgroundColor: '#fed0bb',
    borderWidth: 0.5,
    borderColor: '#bc4b51',
    borderRadius: 15,
    paddingHorizontal: 24,
    paddingVertical: 12,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7c7c7c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  startPomodoroButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#bc4b51',
  },
  // Session indicators (matching pomodoro.tsx)
  sessionIndicatorSection: {
    marginBottom: 20,
  },
  sessionIndicatorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#364958',
    marginBottom: 8,
  },
  sessionIndicators: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 8,
  },
  sessionIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e0e0e0',
  },
  completedIndicator: {
    backgroundColor: '#bc4b51',
  },
});
