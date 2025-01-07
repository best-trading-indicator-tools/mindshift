export interface Challenge {
  id: string;
  title: string;
  duration: number;
  description: string;
  image: any;
}

export type RootTabParamList = {
  Home: undefined;
  Challenges: undefined;
  // ... other tab routes
};

export type RootStackParamList = {
  Home: undefined;
  Notifications: undefined;
  DeepBreathing: undefined;
  ActiveIncantations: undefined;
  PassiveIncantations: undefined;
  VoixNasale: undefined;
  FryVocal: undefined;
  Gratitude: undefined;
  ChallengeDetail: {
    challenge: Challenge;
    source: 'challenges' | 'home';
  };
  Exercise: {
    source: 'challenges' | 'home';
  };
  Challenges: undefined;
  VisionBoard: {
    source: 'challenges' | 'home';
  };
}; 