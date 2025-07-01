import React, { createContext, useContext, useEffect, useState } from 'react';
import { Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getToday, getYesterday } from '../utils/Date';

type XPContextType = {
  xp: number[];
  level: number[];
  savedGoals: Goal[];
  addXp: (amount: number, i: number) => void;
  changeLevel: (newLevel: number[]) => void;
  changeXp: (newXp: number[]) => void;
  changeGoals: (newGoals: Goal[]) => void;
};

type Goal = {
  id: string;
  title: string;
  isCompleted: boolean;
  fadeAnim: Animated.Value;
  scaleAnim: Animated.Value;
  category: string;
};

const XPContext = createContext<XPContextType>({
  //Mind, Body, Spirit, Accountability
  xp: [0, 0, 0, 0],
  level: [0, 0, 0, 0],
  savedGoals: [],
  addXp: () => {},
  changeLevel: () => {},
  changeXp: () => {},
  changeGoals: () => {}
});

const XP_KEY = 'levelup_xp';
const LEVEL_KEY = 'levelup_level';
const GOALS_KEY = 'levelup_savedGoals';

export const XPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [xp, setXp] = useState([0, 0, 0, 0]);
  const [level, setLevel] = useState([0, 0, 0, 0]);
  const [savedGoals, setSavedGoals] = useState<Goal[]>([]);
  const [currentDate, setCurrentDate] = useState<string>(getToday());
  
  useEffect(() => {
    const now = new Date();
    const millisTillMidnight =
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() -
      now.getTime();

    const timeout = setTimeout(() => {
      const today = getToday();
      setCurrentDate(today);
    }, millisTillMidnight + 1000); // add buffer to make sure we're past midnight

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const loadProgress = async () => {
      try {
        const storedXp = await AsyncStorage.getItem(XP_KEY);
        const storedLevel = await AsyncStorage.getItem(LEVEL_KEY);
        const storedGoals = await AsyncStorage.getItem(GOALS_KEY);

        if (storedXp) {
          const parsedXp = JSON.parse(storedXp);
          if (Array.isArray(parsedXp)) setXp(parsedXp);
        }

        if (storedLevel) {
          const parsedLevel = JSON.parse(storedLevel);
          if (Array.isArray(parsedLevel)) setLevel(parsedLevel);
        }

        if (storedGoals) {
          const parsedGoals = JSON.parse(storedGoals);
          const updatedGoals = parsedGoals.map((goal: Goal) => ({
            ...goal,
            fadeAnim: new Animated.Value(1),
            scaleAnim: new Animated.Value(1),
          }));
          if (Array.isArray(parsedGoals)) setSavedGoals(updatedGoals);
        }else{
          setSavedGoals([]);
        }
      } catch (err) {
        console.error('Failed to load XP or level from storage:', err);
      }
    };

    loadProgress();
  }, []);

  const addXp = async (amount: number, i: number) => {
    let newXp = [...xp];
    let newLevel = [...level];

    newXp[i] += amount;

    // Assume: every 100 XP = level up
    while (newXp[i] >= 100) {
      newXp[i] -= 100;
      newLevel[i] += 1;
    }

    setXp(newXp);
    setLevel(newLevel);

    await AsyncStorage.setItem(XP_KEY, JSON.stringify(newXp));
    await AsyncStorage.setItem(LEVEL_KEY, JSON.stringify(newLevel));
  };

  const changeLevel = async (l: number[]) => {
    setLevel(l);
    await AsyncStorage.setItem(LEVEL_KEY, JSON.stringify(l));
  }

  const changeXp = async (newXp: number[]) => {
    setXp(newXp);
    await AsyncStorage.setItem(XP_KEY, JSON.stringify(newXp));
  }

  const changeGoals = async (newGoals: Goal[]) => {
    setSavedGoals(newGoals);
    await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(newGoals));
    await AsyncStorage.setItem(currentDate, JSON.stringify(newGoals));
  }

  return (
    <XPContext.Provider value={{ xp, level, savedGoals, addXp, changeLevel, changeXp, changeGoals }}>
      {children}
    </XPContext.Provider>
  );
};

export const useXP = () => useContext(XPContext);

