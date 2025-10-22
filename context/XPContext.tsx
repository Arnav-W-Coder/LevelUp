import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Animated } from 'react-native';
import { getToday, getYesterday } from '../utils/Date';

type XPContextType = {
  xp: number[];
  level: number[];
  savedGoals: Goal[];
  dungeonLevel: number;
  streak: number;
  action: boolean;
  todayMode: boolean;
  tomorrowSaved: boolean;
  tomorrowGoals: Goal[];
  changeTomorrowGoals: (newGoals: Goal[]) => void;
  changeTomorrowSaved: (val: boolean) => void;
  changeTodayMode: (val: boolean) => void;
  changeAction: (val: boolean) => void;
  changeStreak: (amount: number) => void;
  addXp: (amount: number, i: number) => void;
  changeLevel: (newLevel: number[]) => void;
  changeXp: (newXp: number[]) => void;
  changeGoals: (newGoals: Goal[]) => void;
  changeYesterdayGoals: (newGoals: Goal[]) => void;
  changeDungeon: (newLevel: number) => void;
};

type Goal = {
  id: string;
  title: string;
  isCompleted: boolean;
  fadeAnim: Animated.Value;
  scaleAnim: Animated.Value;
  category: string;
  description: string;
  time: string;
};

const XPContext = createContext<XPContextType>({
  //Mind, Body, Spirit, Accountability
  xp: [0, 0, 0, 0],
  level: [0, 0, 0, 0],
  savedGoals: [],
  dungeonLevel: 0,
  streak: 0,
  action: false,
  todayMode: false,
  tomorrowSaved: false,
  tomorrowGoals: [],
  changeTomorrowGoals: () => {},
  changeTomorrowSaved: () => {},
  changeTodayMode: () => {},
  changeAction: () => {},
  changeStreak: () => {},
  addXp: () => {},
  changeLevel: () => {},
  changeXp: () => {},
  changeGoals: () => {},
  changeYesterdayGoals: () => {},
  changeDungeon: () => {}
});

const XP_KEY = 'levelup_xp';
const LEVEL_KEY = 'levelup_level';
const GOALS_KEY = 'levelup_savedGoals';
const DUNGEON_KEY = 'levelup_dungeon';
const STREAK_KEY = 'levelup_streak';
const ACTION_KEY = 'levelup_action';

export const XPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [xp, setXp] = useState([0, 0, 0, 0]);
  const [level, setLevel] = useState([0, 0, 0, 0]);
  const [savedGoals, setSavedGoals] = useState<Goal[]>([]);
  const [currentDate, setCurrentDate] = useState<string>(getToday());
  const [dungeonLevel, setDungeonLevel] = useState(0);
  const [streak, setStreak] = useState(0);
  const [action, setAction] = useState(false);
  const [todayMode, setTodayMode] = useState(false);
  const [tomorrowSaved, setTomorrowSaved] = useState(false);
  const [tomorrowGoals, setTomorrowGoals] = useState<Goal[]>([]);
  
  useEffect(() => {
    const now = new Date();
    const millisTillMidnight =
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() -
      now.getTime();

    const timeout = setTimeout(async () => {
      const today = getToday();
      setCurrentDate(today);
      setTomorrowSaved(false);
      await AsyncStorage.setItem('levelup_tomorrowSaved', JSON.stringify(false));
    }, millisTillMidnight + 1000); // add buffer to make sure we're past midnight

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const loadProgress = async () => {
      try {
        const storedXp = await AsyncStorage.getItem(XP_KEY);
        const storedLevel = await AsyncStorage.getItem(LEVEL_KEY);
        const storedGoals = await AsyncStorage.getItem(getYesterday());
        const storedDungeon = await AsyncStorage.getItem(DUNGEON_KEY);
        const storedStreak = await AsyncStorage.getItem(STREAK_KEY);
        const storedAction = await AsyncStorage.getItem(ACTION_KEY);
        const lastActionDate = await AsyncStorage.getItem('levelup_lastActiveDate');
        const storedTodayMode = await AsyncStorage.getItem('levelup_todaymode');
        const storedTomorrowSaved = await AsyncStorage.getItem('levelup_tomorrowSaved');
        const storedTomorrowGoals = await AsyncStorage.getItem('levelup_tomorrowGoals');
        
        if(storedTomorrowSaved){
          setTomorrowSaved(Boolean(storedTomorrowSaved));
        }
        
        if (storedTomorrowGoals) {
          const parsedGoals = JSON.parse(storedTomorrowGoals);
          const updatedGoals = parsedGoals.map((goal: Goal) => ({
            ...goal,
            fadeAnim: new Animated.Value(1),
            scaleAnim: new Animated.Value(1),
          }));
          if (Array.isArray(parsedGoals)) setTomorrowGoals(updatedGoals);
        }else{
          setTomorrowGoals([]);
        }

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

        if(storedDungeon){
          setDungeonLevel(Number(storedDungeon));
        }

        if(storedAction){
          setAction(Boolean(storedAction));
        }

        if(storedStreak){
          setStreak(Number(storedStreak));
          if(lastActionDate){
            const lastAction = Number(lastActionDate)
            if(lastAction !== Number(getYesterday()) || lastAction !== Number(getToday())){
              if(!action){ 
                setStreak(0);
                await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(0));
              }
              setAction(false);
              await AsyncStorage.setItem(ACTION_KEY, JSON.stringify(false));
            }

          }else{
            if(!action){ 
              setStreak(0);
              await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(0));
            }
            setAction(false);
            await AsyncStorage.setItem(ACTION_KEY, JSON.stringify(false));
          }
        }

        if(storedTodayMode){
          setTodayMode(Boolean(storedTodayMode));
        }

      } catch (err) {
        console.error('Failed to load XP or level from storage:', err);
      }
    };

    loadProgress();
  }, []);

  const getRequiredXP = (place: number) => {
    if (level[place] <= 25) {
      return 10 + level[place] * 2;             // Fast early game
    } else if (level[place] <= 50) {
      return 60 + (level[place] - 25) * 4;      // Slower, rewarding
    } else {
      return 160 + (level[place] - 50) * 5;     // Flattened late game
    }
  }

  const addXp = async (amount: number, i: number) => {
    let newXp = [...xp];
    let newLevel = [...level];

    newXp[i] += amount;

    // Assume: every 100 XP = level up
    while (newXp[i] >= getRequiredXP(i)) {
      newXp[i] -= getRequiredXP(i);
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

  const changeTodayMode = async (val: boolean) => {
    setTodayMode(val);
    await AsyncStorage.setItem('levelup_todaymode', JSON.stringify(val));
  }

  const changeGoals = async (newGoals: Goal[]) => {
    await AsyncStorage.setItem(currentDate, JSON.stringify(newGoals));
  }

  const changeYesterdayGoals = async (newGoals: Goal[]) => {
    await AsyncStorage.setItem(getYesterday(), JSON.stringify(newGoals));
  }

  const changeDungeon = async (newLevel: number) => {
    setDungeonLevel(newLevel);
    await AsyncStorage.setItem(DUNGEON_KEY, JSON.stringify(newLevel));
  }

  const changeStreak = async (amount: number) => {
    console.log(action)
    if(!action){ 
      const newStreak = streak + amount;
      setStreak(newStreak);
      await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(newStreak));
      changeAction(true);
    }
  }

  const changeAction = async (val: boolean) => {
    setAction(val); 
    await AsyncStorage.setItem(ACTION_KEY, JSON.stringify(val));
    await AsyncStorage.setItem('levelup_lastActiveDate', JSON.stringify(getToday()));
  }

  const changeTomorrowSaved = async (val: boolean) => {
    setTomorrowSaved(val);
    await AsyncStorage.setItem('levelup_tomorrowSaved', JSON.stringify(val));
  }

  const changeTomorrowGoals = async (newGoals: Goal[]) => {
    setTomorrowGoals(newGoals);
    await AsyncStorage.setItem('levelup_tomorrowGoals', JSON.stringify(newGoals));
  }

  return (
    <XPContext.Provider value={{ xp, level, savedGoals, dungeonLevel, streak, action, todayMode, tomorrowSaved, tomorrowGoals, changeTomorrowGoals, changeTomorrowSaved, changeTodayMode, changeAction, changeStreak, addXp, changeLevel, changeXp, changeGoals, changeYesterdayGoals, changeDungeon }}>
      {children}
    </XPContext.Provider>
  );
};

export const useXP = () => useContext(XPContext);

