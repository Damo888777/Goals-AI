import { View, Text, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileTab() {
  const insets = useSafeAreaInsets();

  const stats = {
    eatTheFrogStreak: 0,
    goalsAchieved: 0,
    totalFocusSessions: 0,
  };

  return (
    <View className="flex-1 bg-bg-primary">
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
        {/* Profile Header */}
        <View className="gap-2">
          <Text className="text-[20px] font-helvetica-bold text-text-primary">
            Your Journey
          </Text>
          <Text className="text-[15px] font-helvetica-light text-text-primary">
            Track your progress and celebrate your achievements.
          </Text>
        </View>

        {/* Stats Cards */}
        <View className="gap-4">
          {/* Eat the Frog Streak */}
          <View className="bg-bg-secondary border-[0.5px] border-border-primary rounded-card p-5">
            <Text className="text-[15px] font-helvetica-bold text-text-primary">
              Eat the Frog Streak
            </Text>
            <Text className="text-[32px] font-helvetica-bold text-text-primary mt-2">
              {stats.eatTheFrogStreak} days
            </Text>
          </View>

          {/* Goals Achieved */}
          <View className="bg-bg-secondary border-[0.5px] border-border-primary rounded-card p-5">
            <Text className="text-[15px] font-helvetica-bold text-text-primary">
              Goals Achieved
            </Text>
            <Text className="text-[32px] font-helvetica-bold text-text-primary mt-2">
              {stats.goalsAchieved}
            </Text>
          </View>

          {/* Total Focus Sessions */}
          <View className="bg-bg-secondary border-[0.5px] border-border-primary rounded-card p-5">
            <Text className="text-[15px] font-helvetica-bold text-text-primary">
              Total Focus Sessions
            </Text>
            <Text className="text-[32px] font-helvetica-bold text-text-primary mt-2">
              {stats.totalFocusSessions}
            </Text>
          </View>
        </View>

        {/* Sign In Section */}
        <View className="bg-bg-secondary border-[0.5px] border-border-primary rounded-card p-5 gap-4">
          <View className="gap-2">
            <Text className="text-[15px] font-helvetica-bold text-text-primary">
              Create Permanent Account
            </Text>
            <Text className="text-[13px] font-helvetica-light text-text-primary">
              Sign in with Apple to save your data permanently and sync across devices.
            </Text>
          </View>

          <Pressable className="bg-accent-fab h-[44px] rounded-button items-center justify-center active:opacity-80">
            <Text className="text-[16px] font-helvetica-bold text-bg-secondary">
              Sign In with Apple
            </Text>
          </Pressable>
        </View>

        {/* Settings Section */}
        <View className="gap-4">
          <Text className="text-[20px] font-helvetica-bold text-text-primary">
            Settings
          </Text>

          <Pressable className="bg-bg-secondary border-[0.5px] border-border-primary rounded-card p-5 active:opacity-80">
            <Text className="text-[15px] font-helvetica text-text-primary">
              Pomodoro Durations
            </Text>
          </Pressable>

          <Pressable className="bg-bg-secondary border-[0.5px] border-border-primary rounded-card p-5 active:opacity-80">
            <Text className="text-[15px] font-helvetica text-text-primary">
              Notifications
            </Text>
          </Pressable>

          <Pressable className="bg-bg-secondary border-[0.5px] border-border-primary rounded-card p-5 active:opacity-80">
            <Text className="text-[15px] font-helvetica text-text-primary">
              Help & Support
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
