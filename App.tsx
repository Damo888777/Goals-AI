import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View, Image } from 'react-native';
import { images } from './src/constants/images';
import './global.css';

// Import tab screens
import TodayTab from './app/(tabs)/index';
import GoalsTab from './app/(tabs)/goals';
import PlanTab from './app/(tabs)/plan';
import ProfileTab from './app/(tabs)/profile';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: '#EAE0D5',
              borderTopWidth: 0,
              height: 85,
              paddingHorizontal: 35,
              paddingTop: 25,
              paddingBottom: 15,
            },
            tabBarShowLabel: false,
            tabBarActiveTintColor: '#364958',
            tabBarInactiveTintColor: '#364958',
          }}
        >
          <Tab.Screen
            name="Today"
            component={TodayTab}
            options={{
              tabBarIcon: ({ focused }) => (
                <View style={{ 
                  width: 25, 
                  height: 26, 
                  opacity: 0.85,
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <Image 
                    source={{ uri: images.tabIcons.today }} 
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="contain"
                  />
                </View>
              ),
            }}
          />
          <Tab.Screen
            name="Goals"
            component={GoalsTab}
            options={{
              tabBarIcon: ({ focused }) => (
                <View style={{ 
                  width: 25, 
                  height: 25, 
                  opacity: 0.85,
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <Image 
                    source={{ uri: images.tabIcons.goals }} 
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="contain"
                  />
                </View>
              ),
            }}
          />
          <Tab.Screen
            name="Plan"
            component={PlanTab}
            options={{
              tabBarIcon: ({ focused }) => (
                <View style={{ 
                  width: 25, 
                  height: 25, 
                  opacity: 0.85,
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <Image 
                    source={{ uri: images.tabIcons.plan }} 
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="contain"
                  />
                </View>
              ),
            }}
          />
          <Tab.Screen
            name="Profile"
            component={ProfileTab}
            options={{
              tabBarIcon: ({ focused }) => (
                <View style={{ 
                  width: 25, 
                  height: 25, 
                  opacity: 0.85,
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <Image 
                    source={{ uri: images.tabIcons.profile }} 
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="contain"
                  />
                </View>
              ),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
