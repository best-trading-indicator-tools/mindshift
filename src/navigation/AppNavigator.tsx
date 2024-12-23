import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import AiCoachScreen from '../screens/AiCoachScreen';
import { CourseTabScreen, CourseStackScreen } from '../screens/CourseScreen';
import ChallengesScreen from '../screens/ChallengesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import { Icon } from '@rneui/themed';

export type RootTabParamList = {
  Home: undefined;
  Courses: undefined;
  Challenges: undefined;
  Profile: undefined;
  AiCoach: undefined;
};

export type RootStackParamList = {
  Main: undefined;
  AiCoach: undefined;
  Course: undefined;
  Notifications: undefined;
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
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Icon
              type="material-community"
              name="home"
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Courses"
        component={CourseTabScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon
              type="material-community"
              name="book-open-variant"
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Challenges"
        component={ChallengesScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon
              type="material-community"
              name="trophy"
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon
              type="material-community"
              name="account"
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tab.Screen
        name="AiCoach"
        component={AiCoachScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon
              type="material-community"
              name="robot"
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#121212',
          },
          headerTintColor: '#FFFFFF',
        }}
      >
        <Stack.Screen
          name="Main"
          component={TabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="AiCoach" component={AiCoachScreen} />
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigator;
