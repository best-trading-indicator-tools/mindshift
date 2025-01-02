import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface MissionsContextType {
  completedMissions: string[];
  completeMission: (missionTitle: string) => void;
  resetDailyMissions: () => void;
}

const MissionsContext = createContext<MissionsContextType | undefined>(undefined);

export const MissionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [completedMissions, setCompletedMissions] = useState<string[]>([]);

  useEffect(() => {
    loadCompletedMissions();
  }, []);

  const loadCompletedMissions = async () => {
    try {
      const saved = await AsyncStorage.getItem('completedMissions');
      if (saved) {
        setCompletedMissions(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading completed missions:', error);
    }
  };

  const completeMission = async (missionTitle: string) => {
    try {
      const newCompletedMissions = [...completedMissions, missionTitle];
      setCompletedMissions(newCompletedMissions);
      await AsyncStorage.setItem('completedMissions', JSON.stringify(newCompletedMissions));
    } catch (error) {
      console.error('Error saving completed mission:', error);
    }
  };

  const resetDailyMissions = async () => {
    try {
      setCompletedMissions([]);
      await AsyncStorage.removeItem('completedMissions');
    } catch (error) {
      console.error('Error resetting missions:', error);
    }
  };

  return (
    <MissionsContext.Provider value={{ completedMissions, completeMission, resetDailyMissions }}>
      {children}
    </MissionsContext.Provider>
  );
};

export const useMissionsContext = () => {
  const context = useContext(MissionsContext);
  if (context === undefined) {
    throw new Error('useMissionsContext must be used within a MissionsProvider');
  }
  return context;
}; 