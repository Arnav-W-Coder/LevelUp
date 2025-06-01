import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type XPContextType = {
  xp: number;
  level: number;
  addXp: (amount: number) => void;
  changeLevel: (newLevel: number) => void;
};

const XPContext = createContext<XPContextType>({
  xp: 0,
  level: 0,
  addXp: () => {},
  changeLevel: () => {},
});

const XP_KEY = 'levelup_xp';
const LEVEL_KEY = 'levelup_level';

export const XPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(0);

  useEffect(() => {
    const loadProgress = async () => {
      const storedXp = await AsyncStorage.getItem(XP_KEY);
      const storedLevel = await AsyncStorage.getItem(LEVEL_KEY);
      if (storedXp) setXp(Number(storedXp));
      if (storedLevel) setLevel(Number(storedLevel));
    };
    loadProgress();
  }, []);

  const addXp = async (amount: number) => {
    let newXp = xp + amount;
    let newLevel = level;

    // Assume: every 100 XP = level up
    while (newXp >= 100) {
      newXp -= 100;
      newLevel += 1;
    }

    setXp(newXp);
    setLevel(newLevel);

    await AsyncStorage.setItem(XP_KEY, newXp.toString());
    await AsyncStorage.setItem(LEVEL_KEY, newLevel.toString());
  };

  const changeLevel = async (l: number) => {
    setLevel(l);
    await AsyncStorage.setItem(LEVEL_KEY, l.toString());
  }

  return (
    <XPContext.Provider value={{ xp, level, addXp, changeLevel }}>
      {children}
    </XPContext.Provider>
  );
};

export const useXP = () => useContext(XPContext);

