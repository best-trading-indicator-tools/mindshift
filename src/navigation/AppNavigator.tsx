import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Screen imports
import HomeScreen from '../screens/home-screens/HomeScreen';
import AiCoachScreen from '../screens/home-screens/AiCoachScreen';
import ChallengesScreen from '../screens/challenges-screens/ChallengesScreen';
import ProfileScreen from '../screens/profile-page-screens/ProfileScreen';
import NotificationsScreen from '../screens/home-screens/NotificationsScreen';
import SupportScreen from '../screens/profile-page-screens/SupportScreen';
import LoginScreen from '../screens/onboarding-screens/LoginScreen';
import DeepBreathingScreen from '../screens/daily-missions-screens/deep-breathe/DeepBreathingScreen';
import PassiveIncantationsScreen from '../screens/daily-missions-screens/passive-incantations/PassiveIncantationsScreen';
import GoldenChecklistScreen from '../screens/daily-missions-screens/golden-checklist/GoldenChecklistScreen';
import VisionBoardScreen from '../screens/caroussel-challenges-screens/VisionBoardScreen';
import VisionBoardSectionsScreen from '../screens/caroussel-challenges-screens/VisionBoardSectionsScreen';
import VisionBoardSectionPhotosScreen from '../screens/caroussel-challenges-screens/VisionBoardSectionPhotosScreen';
import MusicSelectionScreen from '../screens/daily-missions-screens/passive-incantations/MusicSelectionScreen';
import NewVisionBoardSection from '../screens/caroussel-challenges-screens/NewVisionBoardSection';
import { default as VisionBoardEditSectionNameScreen } from '../screens/caroussel-challenges-screens/VisionBoardEditSectionNameScreen';
import MentorBoardScreen from '../screens/caroussel-challenges-screens/MentorBoardScreen';
import MentorBoardDetailsScreen from '../screens/caroussel-challenges-screens/MentorBoardDetailsScreen';
import MentorBoardIntroScreen from '../screens/caroussel-challenges-screens/MentorBoardIntroScreen';
import VisionBoardIntroScreen from '../screens/caroussel-challenges-screens/VisionBoardIntroScreen';
import DailyGratitudeIntroScreen from '../screens/daily-missions-screens/daily-gratitudes/DailyGratitudeIntroScreen';
import DeepBreathingIntroScreen from '../screens/daily-missions-screens/deep-breathe/DeepBreathingIntroScreen';
import PassiveIncantationsIntroScreen from '../screens/daily-missions-screens/passive-incantations/PassiveIncantationsIntroScreen';
import GoldenChecklistIntroScreen from '../screens/daily-missions-screens/golden-checklist/GoldenChecklistIntroScreen';
import QuestionnaireScreen from '../screens/onboarding-screens/QuestionnaireScreen';
import TrialScreen from '../screens/onboarding-screens/TrialScreen';
import PostQuestionnaireScreen from '../screens/onboarding-screens/PostQuestionnaireScreen';
import PreQuestionnaireScreen from '../screens/onboarding-screens/PreQuestionnaireScreen';
import DailyGratitudeScreen from '../screens/daily-missions-screens/daily-gratitudes/DailyGratitudeScreen';
import GratitudeBeadsScreen from '../screens/daily-missions-screens/gratitude-beads/GratitudeBeadsScreen';
import GratitudeBeadsIntroScreen from '../screens/daily-missions-screens/gratitude-beads/GratitudeBeadsIntroScreen';
import SunBreathTutorialScreen from '../screens/daily-missions-screens/sun-breath/SunBreathTutorialScreen';
import SunBreathExerciseScreen from '../screens/daily-missions-screens/sun-breath/SunBreathExerciseScreen';
import SunBreathCompleteScreen from '../screens/daily-missions-screens/sun-breath/SunBreathCompleteScreen';
import SunBreathSettingsScreen from '../screens/daily-missions-screens/sun-breath/SunBreathSettingsScreen';
import ManageActiveIncantationsScreen from '../screens/daily-missions-screens/active-incantations/ManageActiveIncantationsScreen';
import ActiveIncantationsExerciseScreen from '../screens/daily-missions-screens/active-incantations/ActiveIncantationsExerciseScreen';
import ActiveIncantationsIntroScreen from '../screens/daily-missions-screens/active-incantations/ActiveIncantationsIntroScreen';
import ChallengeDetailScreen from '../screens/challenges-screens/ChallengeDetailScreen';
import DeepBreathingCompleteScreen from '../screens/daily-missions-screens/deep-breathe/DeepBreathingCompleteScreen';

export type RootTabParamList = {
  Home: undefined;
  Challenges: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
  AiCoach: undefined;
  Support: undefined;
  Notifications: undefined;
  DeepBreathing: {
    context: 'daily' | 'challenge';
    challengeId?: string;
    returnTo?: keyof RootStackParamList;
  } | undefined;
  ActiveIncantationsIntro: {
    returnTo?: keyof RootStackParamList;
    challengeId?: string;
  } | undefined;
  PassiveIncantations: {
    context?: 'daily' | 'challenge';
    challengeId?: string;
    returnTo?: keyof RootStackParamList;
    onComplete?: () => void;
  } | undefined;
  GoldenChecklist: {
    context?: 'daily' | 'challenge';
    challengeId?: string;
    returnTo?: keyof RootStackParamList;
    //onComplete?: () => void;
  } | undefined;
  GoldenChecklistIntro: {
    returnTo?: keyof RootStackParamList;
    challengeId?: string;
  } | undefined;
  VisionBoard: {
    context?: 'daily' | 'challenge';
    challengeId?: string;
    returnTo?: keyof RootStackParamList;
  } | undefined;
  VisionBoardIntro: {
    returnTo?: keyof RootStackParamList;
    challengeId?: string;
  } | undefined;
  MentorBoard: {
    context?: 'daily' | 'challenge';
    challengeId?: string;
    returnTo?: keyof RootStackParamList;
    onComplete?: () => void;
  } | undefined;
  MentorBoardIntro: {
    returnTo?: keyof RootStackParamList;
    challengeId?: string;
  } | undefined;
  VisionBoardSections: {
    boardId: string;
    refresh?: number;
    context?: 'daily' | 'challenge';
    challengeId?: string;
    returnTo?: keyof RootStackParamList;
  };
  VisionBoardSectionPhotos: { 
    boardId: string; 
    sectionId: string; 
    sectionName: string 
  };
  NewVisionBoardSection: { 
    boardId: string;
    context?: 'daily' | 'challenge';
    challengeId?: string;
    returnTo?: keyof RootStackParamList;
  };
  VisionBoardEditSectionName: { 
    boardId: string; 
    sectionId: string; 
    currentName: string 
  };
  MusicSelection: {
    exerciseName: string;
  };
  MentorBoardDetails: { 
    boardId: string 
  };
  DailyGratitudeIntro: {
    returnTo?: keyof RootStackParamList;
    challengeId?: string;
    context?: 'daily' | 'challenge';
  } | undefined;
  DailyGratitude: {
    context?: 'daily' | 'challenge';
    challengeId?: string;
    returnTo?: keyof RootStackParamList;
    onComplete?: () => void;
  } | undefined;
  DeepBreathingIntro: {
    returnTo?: keyof RootStackParamList;
    challengeId?: string;
    context?: 'daily' | 'challenge';
  } | undefined;
  PassiveIncantationsIntro: {
    returnTo?: keyof RootStackParamList;
    challengeId?: string;
  } | undefined;
  Questionnaire: undefined;
  Trial: undefined;
  PostQuestionnaire: undefined;
  PreQuestionnaire: undefined;
  GratitudeBeads: {
    context?: 'daily' | 'challenge';
    challengeId?: string;
    returnTo?: keyof RootStackParamList;
    onComplete?: () => void;
  } | undefined;
  GratitudeBeadsIntro: {
    returnTo?: keyof RootStackParamList;
    challengeId?: string;
  } | undefined;
  SunBreathTutorial: {
    returnTo?: keyof RootStackParamList;
    challengeId?: string;
  } | undefined;
  SunBreathExercise: {
    context?: 'daily' | 'challenge';
    challengeId?: string;
    returnTo?: keyof RootStackParamList;
    onComplete?: () => void;
  } | undefined;
  SunBreathComplete: {
    context?: 'daily' | 'challenge';
    challengeId?: string;
    returnTo?: keyof RootStackParamList;
  } | undefined;
  SunBreathSettings: undefined;
  ManageActiveIncantations: undefined;
  ActiveIncantationsExercise: {
    incantations: string[];
    context?: 'daily' | 'challenge';
    challengeId?: string;
    returnTo?: keyof RootStackParamList;
    onComplete?: () => void;
  };
  ChallengeDetail: {
    challenge: {
      id: string;
      title: string;
      duration: number;
      description: string;
      image: any;
    };
    pendingCompletion?: string;
    skipCompletion?: boolean;
  };
  DeepBreathingComplete: {
    context?: 'challenge' | 'daily';
    challengeId?: string;
    returnTo?: keyof RootStackParamList;
    onComplete?: () => void;
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
  initialRoute?: 'Login' | 'MainTabs' | 'PreQuestionnaire' | 'PostQuestionnaire';
}

const AppNavigator: React.FC<AppNavigatorProps> = ({ initialRoute = 'PreQuestionnaire' }) => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
        initialRouteName={initialRoute}
      >
        <Stack.Screen
          name="PreQuestionnaire"
          component={PreQuestionnaireScreen}
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{
            gestureEnabled: false,
          }}
        />
        <Stack.Screen 
          name="PostQuestionnaire" 
          component={PostQuestionnaireScreen}
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen 
          name="Questionnaire" 
          component={QuestionnaireScreen}
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
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen 
          name="DeepBreathing" 
          component={DeepBreathingScreen}
          options={{
            presentation: 'fullScreenModal',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen 
          name="PassiveIncantations" 
          component={PassiveIncantationsScreen}
          options={{
            presentation: 'fullScreenModal',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="DailyGratitude"
          component={DailyGratitudeScreen}
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
            animation: 'slide_from_right'
          }}
        />
        <Stack.Screen 
          name="GoldenChecklist" 
          component={GoldenChecklistScreen}
          options={{
            presentation: 'fullScreenModal',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen 
          name="GoldenChecklistIntro" 
          component={GoldenChecklistIntroScreen}
          options={{
            presentation: 'fullScreenModal',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen name="VisionBoard" component={VisionBoardScreen} />
        <Stack.Screen name="VisionBoardIntro" component={VisionBoardIntroScreen} />
        <Stack.Screen name="MentorBoardIntro" component={MentorBoardIntroScreen} />
        <Stack.Screen name="MentorBoard" component={MentorBoardScreen} />
        <Stack.Screen name="VisionBoardSections" component={VisionBoardSectionsScreen} />
        <Stack.Screen name="VisionBoardSectionPhotos" component={VisionBoardSectionPhotosScreen} />
        <Stack.Screen name="NewVisionBoardSection" component={NewVisionBoardSection} />
        <Stack.Screen name="VisionBoardEditSectionName" component={VisionBoardEditSectionNameScreen} />
        <Stack.Screen name="MusicSelection" component={MusicSelectionScreen} />
        <Stack.Screen name="MentorBoardDetails" component={MentorBoardDetailsScreen} />
        <Stack.Screen 
          name="DailyGratitudeIntro" 
          component={DailyGratitudeIntroScreen}
          options={{
            presentation: 'fullScreenModal',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen 
          name="DeepBreathingIntro" 
          component={DeepBreathingIntroScreen}
          options={{
            presentation: 'fullScreenModal',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen 
          name="PassiveIncantationsIntro" 
          component={PassiveIncantationsIntroScreen}
          options={{
            presentation: 'fullScreenModal',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen 
          name="Trial" 
          component={TrialScreen}
          options={{
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="GratitudeBeads"
          component={GratitudeBeadsScreen}
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="GratitudeBeadsIntro"
          component={GratitudeBeadsIntroScreen}
          options={{
            presentation: 'fullScreenModal',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen 
          name="SunBreathTutorial" 
          component={SunBreathTutorialScreen}
          options={{
            presentation: 'fullScreenModal',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen 
          name="SunBreathExercise" 
          component={SunBreathExerciseScreen}
          options={{
            presentation: 'fullScreenModal',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen 
          name="SunBreathComplete" 
          component={SunBreathCompleteScreen}
          options={{
            presentation: 'fullScreenModal',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen name="SunBreathSettings" component={SunBreathSettingsScreen} />

        <Stack.Screen 
          name="ManageActiveIncantations" 
          component={ManageActiveIncantationsScreen}
          options={{
            presentation: 'fullScreenModal',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen 
          name="ActiveIncantationsExercise" 
          component={ActiveIncantationsExerciseScreen}
          options={{
            presentation: 'fullScreenModal',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen 
          name="ActiveIncantationsIntro" 
          component={ActiveIncantationsIntroScreen}
          options={{
            presentation: 'fullScreenModal',
            animation: 'slide_from_right',
          }}
        />

        <Stack.Screen
          name="ChallengeDetail"
          component={ChallengeDetailScreen}
          options={{ headerShown: false }}
        />

        <Stack.Screen 
          name="DeepBreathingComplete" 
          component={DeepBreathingCompleteScreen}
          options={{
            presentation: 'fullScreenModal',
            animation: 'slide_from_right',
          }}
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
