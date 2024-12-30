import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Screen imports
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
import GratitudeScreen from '../screens/GratitudeScreen';
import GoldenChecklistScreen from '../screens/GoldenChecklistScreen';
import VisionBoardScreen from '../screens/VisionBoardScreen';
import VisionBoardSectionsScreen from '../screens/VisionBoardSectionsScreen';
import VisionBoardSectionScreen from '../screens/VisionBoardSectionScreen';
import VisionBoardSectionPhotosScreen from '../screens/VisionBoardSectionPhotosScreen';
import MusicSelectionScreen from '../screens/MusicSelectionScreen';
import NewVisionBoardSection from '../screens/NewVisionBoardSection';
import { default as EditSectionNameScreen } from '../screens/EditSectionNameScreen';
import MentorBoardScreen from '../screens/MentorBoardScreen';

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
  Gratitude: undefined;
  GoldenChecklist: undefined;
  VisionBoard: undefined;
  MentorBoard: undefined;
  VisionBoardSections: {
    boardId: string;
    refresh?: number;
  };
  VisionBoardSection: { boardId: string; sectionId: string; sectionName: string };
  VisionBoardSectionPhotos: { boardId: string; sectionId: string; sectionName: string };
  NewVisionBoardSection: { boardId: string };
  EditSectionName: { boardId: string; sectionId: string; currentName: string };
  MusicSelection: {
    exerciseName: string;
  };
  Lesson: {
    lessonId: number;
  };
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#18181b',
          borderTopColor: '#27272a',
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Courses"
        component={CourseTabScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="book-open-variant" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Challenges"
        component={ChallengesScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="trophy" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

interface AppNavigatorProps {
  initialRoute?: 'Login' | 'MainTabs';
}

const AppNavigator: React.FC<AppNavigatorProps> = ({ initialRoute = 'Login' }) => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
        initialRouteName={initialRoute}
      >
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{
            gestureEnabled: false,
          }}
        />
        <Stack.Screen 
          name="MainTabs" 
          component={MainTabNavigator}
          options={{
            gestureEnabled: false,
          }}
        />
        <Stack.Screen name="AiCoach" component={AiCoachScreen} />
        <Stack.Screen name="Support" component={SupportScreen} />
        <Stack.Screen name="Course" component={CourseStackScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="DeepBreathing" component={DeepBreathingScreen} />
        <Stack.Screen name="ActiveIncantations" component={ActiveIncantationsScreen} />
        <Stack.Screen name="PassiveIncantations" component={PassiveIncantationsScreen} />
        <Stack.Screen name="Gratitude" component={GratitudeScreen} />
        <Stack.Screen name="GoldenChecklist" component={GoldenChecklistScreen} />
        <Stack.Screen name="VisionBoard" component={VisionBoardScreen} />
        <Stack.Screen name="MentorBoard" component={MentorBoardScreen} />
        <Stack.Screen name="VisionBoardSections" component={VisionBoardSectionsScreen} />
        <Stack.Screen name="VisionBoardSection" component={VisionBoardSectionScreen} />
        <Stack.Screen name="VisionBoardSectionPhotos" component={VisionBoardSectionPhotosScreen} />
        <Stack.Screen name="NewVisionBoardSection" component={NewVisionBoardSection} />
        <Stack.Screen name="EditSectionName" component={EditSectionNameScreen} />
        <Stack.Screen name="MusicSelection" component={MusicSelectionScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
