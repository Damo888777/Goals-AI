import { Tabs } from 'expo-router';
import { View, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import '../../global.css';

// Tab icons will be replaced with actual assets later
const TabIcon = ({ focused, source }: { focused: boolean; source: any }) => (
  <View style={{ width: 25, height: 26 }}>
    <Image 
      source={source} 
      style={{ width: '100%', height: '100%', opacity: focused ? 1 : 0.85 }}
      resizeMode="contain"
    />
  </View>
);

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#EAE0D5',
          borderTopWidth: 0,
          height: 85 + insets.bottom,
          paddingTop: 41,
          paddingBottom: insets.bottom,
          paddingHorizontal: 35,
        },
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#364958',
        tabBarInactiveTintColor: '#364958',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ focused }) => (
            <View style={{ width: 25, height: 26, opacity: 0.85 }}>
              {/* Today tab icon placeholder */}
              <View style={{ width: '100%', height: '100%', backgroundColor: '#364958', borderRadius: 4 }} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: 'Goals',
          tabBarIcon: ({ focused }) => (
            <View style={{ width: 25, height: 25, opacity: 0.85 }}>
              {/* Goals tab icon placeholder */}
              <View style={{ width: '100%', height: '100%', backgroundColor: '#364958', borderRadius: 12.5 }} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: 'Plan',
          tabBarIcon: ({ focused }) => (
            <View style={{ width: 25, height: 25, opacity: 0.85 }}>
              {/* Plan tab icon placeholder */}
              <View style={{ width: '100%', height: '100%', backgroundColor: '#364958', borderRadius: 4 }} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <View style={{ width: 25, height: 25, opacity: 0.85 }}>
              {/* Profile tab icon placeholder */}
              <View style={{ width: '100%', height: '100%', backgroundColor: '#364958', borderRadius: 12.5 }} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
