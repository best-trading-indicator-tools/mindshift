import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import HomeScreen from '../screens/HomeScreen';
import AiCoachScreen from '../screens/AiCoachScreen';
import { CourseTabScreen, CourseStackScreen } from '../screens/CourseScreen';
import ChallengesScreen from '../screens/ChallengesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SupportScreen from '../screens/SupportScreen';
import LoginScreen from '../screens/LoginScreen';
import DeepBreathingScreen from '../screens/DeepBreathingScreen';
import ActiveIncantationsScreen from '../screens/ActiveIncantationsScreen';
import PassiveIncantationsScreen from '../screens/PassiveIncantationsScreen';

export type RootTabParamList = {
  Home: undefined;
  Courses: undefined;
  Challenges: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
  AiCoach: undefined;
  Support: undefined;
  Course: undefined;
  Notifications: undefined;
  DeepBreathing: undefined;
  ActiveIncantations: undefined;
  PassiveIncantations: undefined;
  Lesson: {
    lessonId: number;
  };
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#121212',
          borderTopColor: '#2A2A2A',
        },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#666666',
        headerStyle: {
          backgroundColor: '#121212',
        },
        headerTintColor: '#FFFFFF',
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => {
            const Icon = MaterialCommunityIcons as any;
            return <Icon name="home" size={size} color={color} />;
          },
        }}
      />
      <Tab.Screen
        name="Courses"
        component={CourseTabScreen}
        options={{
          tabBarIcon: ({ color, size }) => {
            const Icon = MaterialCommunityIcons as any;
            return <Icon name="book-open-variant" size={size} color={color} />;
          },
        }}
      />
      <Tab.Screen
        name="Challenges"
        component={ChallengesScreen}
        options={{
          tabBarIcon: ({ color, size }) => {
            const Icon = MaterialCommunityIcons as any;
            return <Icon name="trophy" size={size} color={color} />;
          },
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => {
            const Icon = MaterialCommunityIcons as any;
            return <Icon name="account" size={size} color={color} />;
          },
        }}
      />
    </Tab.Navigator>
  );
}

interface AppNavigatorProps {
  initialRoute: keyof RootStackParamList;
}

function AppNavigator({ initialRoute }: AppNavigatorProps) {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerStyle: {
            backgroundColor: '#121212',
          },
          headerTintColor: '#FFFFFF',
        }}
      >
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MainTabs"
          component={TabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AiCoach"
          component={AiCoachScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Support"
          component={SupportScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Course"
          component={CourseStackScreen}
          options={{ title: 'Course Details' }}
        />
        <Stack.Screen
          name="Notifications"
          component={NotificationsScreen}
          options={{
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="DeepBreathing"
          component={DeepBreathingScreen}
          options={{ 
            headerShown: false,
            presentation: 'modal'
          }}
        />
        <Stack.Screen
          name="ActiveIncantations"
          component={ActiveIncantationsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="PassiveIncantations"
          component={PassiveIncantationsScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigator;
