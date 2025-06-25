import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type XPContextType = {
  xp: number[];
  level: number[];
  addXp: (amount: number, i: number) => void;
  changeLevel: (newLevel: number[]) => void;
  changeXp: (newXp: number[]) => void;
};

const XPContext = createContext<XPContextType>({
  //Mind, Body, Spirit, Accountability
  xp: [0, 0, 0, 0],
  level: [0, 0, 0, 0],
  addXp: () => {},
  changeLevel: () => {},
  changeXp: () => {},
});

const XP_KEY = 'levelup_xp';
const LEVEL_KEY = 'levelup_level';

export const XPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [xp, setXp] = useState([0, 0, 0, 0]);
  const [level, setLevel] = useState([0, 0, 0, 0]);

  useEffect(() => {
    const loadProgress = async () => {
      try {
        const storedXp = await AsyncStorage.getItem(XP_KEY);
        const storedLevel = await AsyncStorage.getItem(LEVEL_KEY);

        if (storedXp) {
          const parsedXp = JSON.parse(storedXp);
          if (Array.isArray(parsedXp)) setXp(parsedXp);
        }

        if (storedLevel) {
          const parsedLevel = JSON.parse(storedLevel);
          if (Array.isArray(parsedLevel)) setLevel(parsedLevel);
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
    await AsyncStorage.setItem(LEVEL_KEY, JSON.stringify(newXp));
  }

  return (
    <XPContext.Provider value={{ xp, level, addXp, changeLevel, changeXp }}>
      {children}
    </XPContext.Provider>
  );
};

export const useXP = () => useContext(XPContext);

