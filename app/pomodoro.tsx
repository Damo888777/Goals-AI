import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, AppState, AppStateStatus, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Audio } from 'expo-av';
import { useFonts } from 'expo-font';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { notificationService } from '../src/services/notificationService';
import * as Notifications from 'expo-notifications';
import LiveActivityModule from '../src/modules/LiveActivityModule';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Pomodoro session types
type SessionType = 'work' | 'shortBreak' | 'longBreak';

interface PomodoroSession {
  type: SessionType;
  duration: number; // in seconds
  label: string;
}

const POMODORO_SESSIONS: Record<SessionType, PomodoroSession> = {
  work: { type: 'work', duration: 25 * 60, label: 'Focus Time' },
  shortBreak: { type: 'shortBreak', duration: 5 * 60, label: 'Short Break' },
  longBreak: { type: 'longBreak', duration: 30 * 60, label: 'Long Break' }
};

export default function PomodoroScreen() {
  const { taskTitle, taskId } = useLocalSearchParams<{ taskTitle?: string; taskId?: string }>();
  
  const [fontsLoaded] = useFonts({
    'Digital-7': require('../assets/fonts/digital-7.ttf'),
  });

  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [currentSession, setCurrentSession] = useState<SessionType>('work');
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [currentTask, setCurrentTask] = useState(taskTitle || '[Placeholder of Task Title]');
  const [backgroundTime, setBackgroundTime] = useState<number | null>(null);
  const [liveActivityId, setLiveActivityId] = useState<string | null>(null);
  const [hasShownBackgroundAlert, setHasShownBackgroundAlert] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef(AppState.currentState);
  const backgroundTimeRef = useRef<number | null>(null);

  // Cleanup Live Activity and notifications on component unmount (navigation away)
  useEffect(() => {
    return () => {
      console.log('🧹 Component unmounting, cleaning up Live Activity and notifications');
      
      // Cancel all scheduled notifications
      Notifications.cancelAllScheduledNotificationsAsync().catch((error: any) => {
        console.error('Failed to cancel notifications on unmount:', error);
      });
      
      // End Live Activity
      if (liveActivityId) {
        LiveActivityModule.endPomodoroActivity(liveActivityId).catch((error: any) => {
          console.error('Failed to cleanup Live Activity on unmount:', error);
        });
      }
    };
  }, [liveActivityId]);

  // Handle app state changes for background timer
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground
        if (backgroundTimeRef.current && isRunning) {
          const timeInBackground = Math.floor((Date.now() - backgroundTimeRef.current) / 1000);
          setTimeLeft(prev => Math.max(0, prev - timeInBackground));
        }
        backgroundTimeRef.current = null;
      } else if (nextAppState.match(/inactive|background/) && isRunning) {
        // App went to background
        backgroundTimeRef.current = Date.now();
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [isRunning]);

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSessionComplete(true); // true = natural completion
            return 0;
          }
          const newTime = prev - 1;
          
          // Update Live Activity every 30 seconds (Live Activity now calculates time natively)
          if (liveActivityId && newTime % 30 === 0) {
            console.log(`🔄 [Live Activity Update] Periodic sync: ${newTime}s remaining`);
            LiveActivityModule.updatePomodoroActivity(liveActivityId, {
              timeRemaining: newTime,
              totalDuration: POMODORO_SESSIONS[currentSession].duration,
              sessionType: currentSession,
              isRunning: true,
              completedPomodoros,
              taskTitle: currentTask,
            }).then(() => {
              console.log(`✅ [Live Activity Update] Periodic sync successful`);
            }).catch((error: any) => {
              console.error(`❌ [Live Activity Update] Periodic sync failed:`, error);
            });
          }
          
          return newTime;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, currentSession, currentTask, completedPomodoros]);

  // Play completion sound
  const playCompletionSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/sounds/Complete Sound.mp3')
      );
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.log('Error playing sound:', error);
    }
  };

  const sendCompletionNotification = async (sessionType: SessionType, newCompletedPomodoros?: number) => {
    try {
      // Send push notification via OneSignal API
      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'pomodoro_completion',
          sessionType,
          completedPomodoros: newCompletedPomodoros || completedPomodoros,
          taskTitle: currentTask,
        }),
      });
      
      if (!response.ok) {
        console.warn('Failed to send push notification:', response.status);
      }
    } catch (error) {
      console.warn('Error sending push notification:', error);
    }
  };

  const handleSessionComplete = async (isNaturalCompletion: boolean = false) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsRunning(false);
    
    // Always cancel notifications on completion to prevent duplicates
    console.log('🚫 Session complete - cancelling all notifications');
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    // Add strong haptic vibration for completion
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await playCompletionSound();

    // End current Live Activity
    if (liveActivityId) {
      try {
        console.log('🧹 Session complete - ending Live Activity');
        await LiveActivityModule.endPomodoroActivity(liveActivityId);
        setLiveActivityId(null);
      } catch (error) {
        console.error('Failed to end Live Activity:', error);
      }
    }

    if (currentSession === 'work') {
      const newCompletedPomodoros = completedPomodoros + 1;
      setCompletedPomodoros(newCompletedPomodoros);
      
      // Send completion notification for work session
      await sendCompletionNotification('work', newCompletedPomodoros);
      
      // Determine next session type
      const nextSession: SessionType = newCompletedPomodoros % 4 === 0 ? 'longBreak' : 'shortBreak';
      setCurrentSession(nextSession);
      setTimeLeft(POMODORO_SESSIONS[nextSession].duration);
      
      Alert.alert(
        'Pomodoro Complete! 🍅',
        `Great work! You've completed ${newCompletedPomodoros} pomodoro${newCompletedPomodoros > 1 ? 's' : ''} today. Time for a ${nextSession === 'longBreak' ? 'long' : 'short'} break.`,
        [{ text: 'Start Break', onPress: () => setIsRunning(true) }]
      );
    } else {
      // Break completed - send notification for break end
      await sendCompletionNotification(currentSession);
      
      setCurrentSession('work');
      setTimeLeft(POMODORO_SESSIONS.work.duration);
      
      Alert.alert(
        'Break Complete! ☕',
        'Break time is over. Ready to focus again?',
        [{ text: 'Start Focus', onPress: () => setIsRunning(true) }]
      );
    }
  };

  const toggleTimer = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const willStart = !isRunning;
    setIsRunning(willStart);
    
    // Start or update Live Activity using OneSignal trigger-in-app
    if (willStart) {
      try {
        // Live Activity handles background timing natively, no need for background refresh alert

        // Request notification permissions first time
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Notification permission not granted');
        }

        console.log('🔍 [React Native] Checking if Live Activities are enabled...');
        // Check if Live Activities are enabled
        const areEnabled = await LiveActivityModule.areActivitiesEnabled();
        console.log('🔍 [React Native] Live Activities enabled:', areEnabled);
        
        if (!areEnabled) {
          console.warn('❌ [React Native] Live Activities are not enabled');
          Alert.alert(
            'Live Activities Disabled',
            'Please enable Live Activities in Settings to see your timer in the Dynamic Island.',
            [{ text: 'OK' }]
          );
          return; // Don't try to start if disabled
        }
        
        // Calculate session start time based on current timeLeft
        // For resumed sessions, we need to backdate the start time
        const now = new Date();
        const elapsedSeconds = POMODORO_SESSIONS[currentSession].duration - timeLeft;
        const sessionStartTime = new Date(now.getTime() - (elapsedSeconds * 1000));
        console.log('🔍 [React Native] Starting Live Activity with data:', {
          activityName: 'PomodoroTimer',
          timeRemaining: timeLeft,
          totalDuration: POMODORO_SESSIONS[currentSession].duration,
          sessionType: currentSession,
          isRunning: true,
          completedPomodoros,
          taskTitle: currentTask,
          sessionStartTime: sessionStartTime.toISOString(),
        });
        
        try {
          const activityId = await LiveActivityModule.startPomodoroActivity({
            activityName: 'PomodoroTimer',
            timeRemaining: timeLeft,
            totalDuration: POMODORO_SESSIONS[currentSession].duration,
            sessionType: currentSession,
            isRunning: true,
            completedPomodoros,
            taskTitle: currentTask,
            sessionStartTime: sessionStartTime.toISOString(), // Pass session start time
          });
          
          setLiveActivityId(activityId);
          console.log('✅ [React Native] Live Activity started successfully with ID:', activityId);
          console.log('🔍 [Live Activity Display] Live Activity should now be visible in:');
          console.log('  - Dynamic Island (immediate)');
          console.log('  - Notification Center (when backgrounded)');  
          console.log('  - Lock Screen (when locked)');
          console.log('🔍 [Live Activity Test] Please check:');
          console.log('  1. Look at Dynamic Island NOW');
          console.log('  2. Background app and check Notification Center');
          console.log('  3. Lock phone and check Lock Screen');
        } catch (error) {
          console.error('❌ [React Native] Failed to start Live Activity:', error);
          Alert.alert(
            'Live Activity Error',
            `Failed to start Live Activity: ${error}`,
            [{ text: 'OK' }]
          );
        }

        // Cancel any existing notifications before scheduling new ones
        await Notifications.cancelAllScheduledNotificationsAsync();
        
        // Schedule local notification for timer completion
        const sessionInfo = POMODORO_SESSIONS[currentSession];
        const notificationMessage = currentSession === 'work' 
          ? `${sessionInfo.label} complete! Time for a break! 🎉`
          : `Break time over! Ready for another focus session? 💪`;

        await Notifications.scheduleNotificationAsync({
          content: {
            title: '🍅 Pomodoro Timer',
            body: notificationMessage,
            sound: 'default',
            priority: Notifications.AndroidNotificationPriority.HIGH,
          },
          trigger: { seconds: timeLeft },
        });

        console.log('Live Activity and notification scheduled successfully');
      } catch (error) {
        console.error('Failed to start Live Activity or schedule notification:', error);
      }
    } else {
      // Cancel scheduled notifications when pausing
      console.log('⏸️ Pausing timer - cancelling notifications and updating Live Activity to paused state');
      await Notifications.cancelAllScheduledNotificationsAsync();
      
      // Update Live Activity to paused state (DON'T END IT)
      if (liveActivityId) {
        try {
          await LiveActivityModule.updatePomodoroActivity(liveActivityId, {
            timeRemaining: timeLeft,
            totalDuration: POMODORO_SESSIONS[currentSession].duration,
            sessionType: currentSession,
            isRunning: false, // PAUSED STATE
            completedPomodoros,
            taskTitle: currentTask
          });
          console.log('✅ Live Activity updated to paused state - STAYS VISIBLE');
        } catch (error) {
          console.error('Failed to update Live Activity on pause:', error);
        }
      }
    }
  };

  const resetTimer = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRunning(false);
    setTimeLeft(POMODORO_SESSIONS[currentSession].duration);
    
    
    // Cancel any scheduled notifications on reset
    console.log('🚫 Reset - cancelling all notifications and Live Activity');
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    // End Live Activity when resetting
    if (liveActivityId) {
      try {
        await LiveActivityModule.endPomodoroActivity(liveActivityId);
        setLiveActivityId(null);
      } catch (error) {
        console.error('Failed to end Live Activity:', error);
      }
    }
  };

  const skipSession = () => {
    Alert.alert(
      'Skip Session?',
      'Are you sure you want to skip this session?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Skip', onPress: () => handleSessionComplete(false) } // false = manual completion
      ]
    );
  };

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get session info
  const sessionInfo = POMODORO_SESSIONS[currentSession];
  const progress = 1 - (timeLeft / sessionInfo.duration);

  return (
    <SafeAreaView style={styles.container}>
      {/* Main Content */}
      <View style={styles.content}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.titleContainer}>
            <TouchableOpacity
              style={styles.chevronButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={24} color="#4a5568" />
            </TouchableOpacity>
            <Text style={styles.title}>Pomodoro</Text>
            <View style={styles.headerSpacer} />
          </View>
          <View style={styles.descriptionContainer}>
            <Text style={styles.description}>
              You're getting one step closer towards your goals.
            </Text>
          </View>
        </View>

        {/* Centered Pomodoro Section */}
        <View style={styles.centeredContainer}>
          <View style={styles.pomodoroSection}>
            <Text style={styles.sectionTitleLeft}>Time to Focus</Text>
            <Text style={styles.pomodoroDescription}>
              <Text style={styles.taskLabel}>Your Task: </Text>
              <Text style={styles.taskTitle}>{currentTask}</Text>
            </Text>

            {/* Session Indicators */}
            <View style={styles.sessionIndicatorSection}>
              <Text style={styles.sessionIndicatorLabel}>Session Progress</Text>
              <View style={styles.sessionIndicators}>
                {[...Array(4)].map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.sessionIndicator,
                      index < completedPomodoros % 4 ? styles.completedIndicator : null
                    ]}
                  />
                ))}
              </View>
            </View>

            {/* Timer Display */}
            <View style={styles.timerContainer}>
              <LinearGradient
                colors={currentSession === 'work' ? ['#fed0bb', '#f4a6a6', '#e89999'] : ['#364958', '#4a5568', '#2d3748']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.timerGradient}
              >
                {/* Glass highlight effect */}
                <View style={styles.glassHighlight} />
                
                {/* Timer text with glow effect */}
                <View style={styles.timerTextContainer}>
                  <Text style={styles.timerText}>
                    {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:
                    {(timeLeft % 60).toString().padStart(2, '0')}
                  </Text>
                </View>
                
                {/* Bottom reflection */}
                <View style={styles.bottomReflection} />
              </LinearGradient>
            </View>

            {/* Control Buttons */}
            <View style={styles.buttonContainer}>
              {timeLeft === POMODORO_SESSIONS[currentSession].duration ? (
                <TouchableOpacity
                  style={styles.startButton}
                  onPress={toggleTimer}
                >
                  <Text style={styles.startButtonText}>START</Text>
                </TouchableOpacity>
              ) : !isRunning ? (
                <View style={styles.runningButtons}>
                  <TouchableOpacity
                    style={styles.resetButton}
                    onPress={resetTimer}
                  >
                    <Text style={styles.resetButtonText}>RESET</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.continueButton}
                    onPress={toggleTimer}
                  >
                    <Text style={styles.continueButtonText}>CONTINUE</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.runningButtons}>
                  <TouchableOpacity
                    style={styles.completeButton}
                    onPress={() => handleSessionComplete(false)} // false = manual completion
                  >
                    <Text style={styles.completeButtonText}>COMPLETE</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.pauseButton}
                    onPress={toggleTimer}
                  >
                    <Text style={styles.pauseButtonText}>PAUSE</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5ebe0',
  },
  content: {
    flex: 1,
    paddingHorizontal: 36,
    paddingTop: 20,
  },
  headerSection: {
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chevronButton: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -12,
  },
  descriptionContainer: {
    alignItems: 'flex-start',
    width: '100%',
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#364958',
  },
  headerSpacer: {
    width: 44,
    height: 44,
  },
  description: {
    fontSize: 15,
    fontWeight: '300',
    color: '#364958',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#364958',
    marginBottom: 8,
  },
  taskLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#364958',
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '300',
    color: '#364958',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -50,
  },
  pomodoroSection: {
    alignItems: 'stretch',
    marginBottom: 20,
    width: '100%',
  },
  sectionTitleLeft: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#364958',
    marginBottom: 8,
    textAlign: 'left',
  },
  pomodoroDescription: {
    fontSize: 15,
    fontWeight: '300',
    color: '#364958',
    marginBottom: 50,
  },
  timerContainer: {
    borderRadius: 25,
    marginBottom: 50,
    shadowColor: '#bc4b51',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
    width: '100%',
    alignSelf: 'center',
  },
  timerGradient: {
    borderRadius: 25,
    padding: 25,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(188, 75, 81, 0.2)',
    minHeight: 150,
    justifyContent: 'center',
  },
  glassHighlight: {
    position: 'absolute',
    top: 8,
    left: 15,
    right: 15,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 20,
    opacity: 0.6,
  },
  timerTextContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 80,
    fontFamily: 'Digital-7',
    fontWeight: 'normal',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 4,
    textShadowColor: 'rgba(188, 75, 81, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  bottomReflection: {
    position: 'absolute',
    bottom: 8,
    left: 15,
    right: 15,
    height: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15,
    opacity: 0.4,
  },
  buttonContainer: {
    alignItems: 'center',
    minHeight: 60,
    justifyContent: 'center',
  },
  startButton: {
    backgroundColor: '#e9edc9',
    borderWidth: 0.5,
    borderColor: '#a3b18a',
    borderRadius: 15,
    paddingHorizontal: 32,
    paddingVertical: 12,
    minHeight: 44,
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7c7c7c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  startButtonText: {
    fontSize: 30,
    fontFamily: 'Courier New',
    fontWeight: 'bold',
    color: '#364958',
  },
  progressSection: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#a3b18a',
    borderRadius: 4,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  counterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#364958',
    marginRight: 8,
  },
  dotsContainer: {
    flexDirection: 'row',
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#bc4b51',
  },
  dotInactive: {
    backgroundColor: '#d0d0d0',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    backgroundColor: '#fed0bb',
    borderWidth: 0.5,
    borderColor: '#bc4b51',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#bc4b51',
  },
  sessionIndicatorSection: {
    alignSelf: 'stretch',
    marginBottom: 20,
  },
  sessionIndicatorLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4a5568',
    marginBottom: 8,
    textAlign: 'left',
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
  runningButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  pauseButton: {
    backgroundColor: '#457b9d',
    borderWidth: 0.5,
    borderColor: '#457b9d',
    borderRadius: 15,
    paddingHorizontal: 32,
    paddingVertical: 15,
    minHeight: 44,
    minWidth: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7c7c7c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  pauseButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  completeButton: {
    backgroundColor: '#e9edc9',
    borderWidth: 0.5,
    borderColor: '#a3b18a',
    borderRadius: 15,
    paddingHorizontal: 32,
    paddingVertical: 15,
    minHeight: 44,
    minWidth: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7c7c7c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  completeButtonText: {
    color: '#4a5568',
    fontSize: 16,
    fontWeight: 'bold',
  },
  continueButton: {
    backgroundColor: '#e9edc9',
    borderWidth: 0.5,
    borderColor: '#a3b18a',
    borderRadius: 15,
    paddingHorizontal: 32,
    paddingVertical: 15,
    minHeight: 44,
    minWidth: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7c7c7c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  continueButtonText: {
    color: '#4a5568',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resetButton: {
    backgroundColor: '#bc4b51',
    borderRadius: 15,
    paddingHorizontal: 32,
    paddingVertical: 15,
    minHeight: 44,
    minWidth: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7c7c7c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  resetButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
