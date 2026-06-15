import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import SceneScreen from '../screens/SceneScreen';
import VoiceScreen from '../screens/VoiceScreen';
import EnergyScreen from '../screens/EnergyScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const AppTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Scene':
              iconName = focused ? 'grid' : 'grid-outline';
              break;
            case 'Voice':
              iconName = focused ? 'mic' : 'mic-outline';
              break;
            case 'Energy':
              iconName = focused ? 'stats-chart' : 'stats-chart-outline';
              break;
            default:
              iconName = 'help-circle';
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3182ce',
        tabBarInactiveTintColor: '#a0aec0',
        tabBarLabelStyle: {
          fontSize: 12,
        },
        tabBarStyle: {
          paddingVertical: 5,
          height: 60,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: '首页' }}
      />
      <Tab.Screen
        name="Scene"
        component={SceneScreen}
        options={{ tabBarLabel: '场景' }}
      />
      <Tab.Screen
        name="Voice"
        component={VoiceScreen}
        options={{ tabBarLabel: '语音' }}
      />
      <Tab.Screen
        name="Energy"
        component={EnergyScreen}
        options={{ tabBarLabel: '能耗' }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator: React.FC = () => {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={AppTabs} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
