import { NativeModules } from 'react-native';

interface LiveActivityModuleInterface {
  areActivitiesEnabled(): Promise<boolean>;
  startPomodoroActivity(state: {
    activityName: string;
    timeRemaining: number;
    totalDuration: number;
    sessionType: string;
    isRunning: boolean;
    completedPomodoros: number;
    taskTitle: string;
  }): Promise<string>;
  updatePomodoroActivity(activityId: string, state: {
    timeRemaining: number;
    totalDuration: number;
    sessionType: string;
    isRunning: boolean;
    completedPomodoros: number;
    taskTitle: string;
  }): Promise<void>;
  endPomodoroActivity(activityId: string): Promise<void>;
}

const { LiveActivityModule } = NativeModules;

export default LiveActivityModule as LiveActivityModuleInterface;