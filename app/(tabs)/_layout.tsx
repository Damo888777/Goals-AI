import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { images } from '../../src/constants/images';
import '../../global.css';

const TabIcon = ({ focused, source }: { focused: boolean; source: string }) => (
  <Image 
    source={{ uri: source }} 
    style={{ 
      width: 24, 
      height: 24, 
      opacity: focused ? 1 : 0.85 
    }}
    contentFit="contain"
  />
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
          height: 70 + insets.bottom,
          paddingTop: 15,
          paddingBottom: insets.bottom + 15,
          paddingHorizontal: 20,
        },
        tabBarItemStyle: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          height: 40,
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
            <TabIcon focused={focused} source={images.tabIcons.today} />
          ),
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: 'Goals',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} source={images.tabIcons.goals} />
          ),
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: 'Plan',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} source={images.tabIcons.plan} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} source={images.tabIcons.profile} />
          ),
        }}
      />
    </Tabs>
  );
}
