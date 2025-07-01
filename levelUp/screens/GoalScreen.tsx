import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Button, TouchableOpacity, TextInput, Alert, Animated, Modal, Pressable, Dimensions, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useXP } from '../context/XPContext';
import { useFocusEffect } from 'expo-router';
import { getYesterday, getToday } from '../utils/Date';

type Props = {
  goToCharacter: () => void;
  goToDungeon: () => void;
  goToHome: () => void;
};

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const boxSpacing = 40;
const sideMargin = screenWidth * 0.2;
const usableWidth = screenWidth - (sideMargin * 2);
const usableHeight = screenHeight - sideMargin;
const boxWidth = (usableWidth - boxSpacing) / 2; // Two boxes per row + spacing
const boxHeight = (usableHeight - boxSpacing)/2;

const categories = ['Mind', 'Body', 'Spirit', 'Accountability'];

type Goal = {
  id: string;
  title: string;
  isCompleted: boolean;
  fadeAnim: Animated.Value;
  scaleAnim: Animated.Value;
  category: string;
};

export default function GoalScreen({goToCharacter, goToDungeon, goToHome}: Props) {
  const { savedGoals, changeGoals} = useXP();
  const [goals, setGoals] = useState<Goal[]>([]);
  const { xp, addXp } = useXP();
  const [loadGoal, setLoadGoals] = useState<Goal[]>([]);
  const [goalsByCategory, setGoalsByCategory] = useState<Record<string, Goal[]>>({});


  useEffect(() => {
    setGoals(savedGoals);
  }, [savedGoals]);

  useEffect(() => {
    const loadGoals = async () => {
      const YESTERDAY = getYesterday();
      const stored = await AsyncStorage.getItem(YESTERDAY);
      if (stored) {
        const parsed: Goal[] = JSON.parse(stored);
        const updated = parsed.map((goal: Goal) => ({
          ...goal,
          fadeAnim: new Animated.Value(1),
          scaleAnim: new Animated.Value(1),
        }));

        // categorize
        const byCategory: Record<string, Goal[]> = {};
        categories.forEach((cat) => {
          byCategory[cat] = updated.filter((goal) => goal.category === cat);
        });

        setGoalsByCategory(byCategory);
      } else {
        setGoalsByCategory({});
      }
    };

    loadGoals();
  }, []);

  const toggleGoalCompleted = (id: string, place: string) => {
    setGoals((prevGoals) =>
      prevGoals.map((goal) => {
        if (goal.id === id) {
          const toggled = !goal.isCompleted
          const updatedGoal = { ...goal, isCompleted: toggled };
          if (toggled){
            if(place === "Mind"){addXp(50, 0)}
            if(place === "Body"){addXp(50, 1)}
            if(place === "Spirit"){addXp(50, 2)}
            if(place === "Accountability"){addXp(50, 3)}
          } 
          return updatedGoal;
        }
        return goal;
      })
    );

    changeGoals(goals);
  };

  const removeGoal = (id: String) => {
    setGoals((prevGoals) => prevGoals.filter(goal => goal.id !== id));
  }

  const fadeAndRemoveGoal = (id: string) => {
    const goal = goals.find((g) => g.id === id);
    if (!goal) return;

    Animated.parallel([
      Animated.timing(goal.fadeAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(goal.scaleAnim, {
        toValue: 0.8,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start(() => {
      removeGoal(id);
    });
  };

  // const getGoalByCategory = (category: string) => {
  //   loadGoals();
  //   return loadGoal?.filter((goal) => goal.category === category) || [];
  // }

  // const loadGoals = async () => {
  //   const YESTERDAY = getYesterday();
  //   const stored = await AsyncStorage.getItem(YESTERDAY);
  //   if (stored) {
  //     const parsed = JSON.parse(stored);
  //     const updatedGoals = parsed.map((goal: Goal) => ({
  //         ...goal,
  //         fadeAnim: new Animated.Value(1),
  //         scaleAnim: new Animated.Value(1),
  //       }));
  //     setLoadGoals(updatedGoals);
  //   }
  //   setLoadGoals([]);
  // }

  const renderCategoryBox = (title: string, color: string) => ( 
    <View style={[
              styles.box,
              {
                width: boxWidth,
                height: boxHeight,
                marginRight: categories.indexOf(title) % 2 === 0 ? boxSpacing : 0,
                marginBottom: boxSpacing,
              },
            ]}>
      <Text style={styles.categoryTitle}>{title}</Text>
        <FlatList
          data={goalsByCategory[title] || []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Animated.View style={[{ opacity: item.fadeAnim, transform: [{ scale: item.scaleAnim }] }]}>
              <TouchableOpacity
                onPress={() => {toggleGoalCompleted(item.id, title); fadeAndRemoveGoal(item.id)}}
                style={[
                  styles.goalItem,
                  item.isCompleted && styles.completedGoal,
                ]}
              >
                <Text style={item.isCompleted ? styles.completedText : styles.goalText}>
                  {item.title}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        />
    </View>
  );

  const completedCount = goals.filter((g) => g.isCompleted).length;
  const totalGoals = goals.length;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Tomorrow's Goals</Text>
      <Button title="Go to Character Screen" onPress={goToCharacter} />
      <Button title="Go to Dungeon Screen" onPress={goToDungeon} />
      <Button title="Go to Home Screen" onPress={goToHome} />
      <Button
      title="Reset Goals (Dev Only)"
      onPress={async () => {
        setGoals([]);
        changeGoals([]);
        await AsyncStorage.removeItem('levelup_goals');
        console.log('Goals reset');
        }}/>
      <View style={styles.grid}>
        {renderCategoryBox('Mind', '#6a0dad')}
        {renderCategoryBox('Body', '#228B22')}
        {renderCategoryBox('Spirit', '#1e90ff')}
        {renderCategoryBox('Accountability', '#ff8c00')}
      </View>
    </View>
  );
}

// 'flex-start': Left
// justifyContent: 'center': Center
// justifyContent: 'flex-end': Right
// alignItems: 'flex-start': Top
// alignItems: 'center': Center
// alignItems: 'flex-end': Bottom
//  marginTop: height * 0.1, // 10% from top
//  marginLeft: width * 0.05,

const styles = StyleSheet.create({
  topSpace: {
    height: '20%', // Leave this space open for visuals
  },
  title: { fontSize: screenWidth * 0.06, fontWeight: 'bold', color: '#fff', marginBottom: screenHeight * 0.01 },
  goalItem: { height: screenHeight * 0.1, padding: screenWidth * 0.03, marginVertical: screenHeight * 0.0025, backgroundColor: '#333', borderRadius: 8 },
  completedGoal: { backgroundColor: '#28a745' },
  container: {
    flex: 1,
    backgroundColor: '#1c1c1c', // Full gray background
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 60, // Top padding for visual space
  },
  header: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: screenWidth * 0.2, // Matches sideMargin
    paddingBottom: screenHeight * 0.2
  },
  box: {
    backgroundColor: '#222',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  boxText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '400',
  },
  categoryTitle: { fontSize: screenHeight * 0.03, fontWeight: '200', color: '#fff', marginBottom: screenHeight * 0.01 },
  goalText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  completedText: { color: '#ccc', fontSize: 16, textDecorationLine: 'line-through' },
  progress: { color: '#aaa', marginTop: screenHeight * 0.01, fontSize: screenWidth * 0.04 },
  xpBarBackground: { marginTop: screenHeight * 0.02, height: screenHeight * 0.02, width: '100%', backgroundColor: '#555', borderRadius: 10 },
  xpBarFill: { height: '100%', backgroundColor: '#0f0', borderRadius: 10 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: screenHeight * 0.015 },
  input: { flex: 1, backgroundColor: '#333', color: '#fff', padding: screenHeight * 0.015, borderRadius: 8, marginRight: screenWidth * 0.02 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: '#333', padding: screenWidth * 0.05, borderRadius: 10, width: '90%' },
  modalTitle: { fontSize: screenWidth * 0.05, color: '#fff', marginBottom: screenHeight * 0.01 },
  templateRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: screenHeight * 0.015 },
  templateButton: { backgroundColor: '#444', padding: screenHeight * 0.015, margin: screenWidth * 0.01, borderRadius: 6 },
  selected: { backgroundColor: '#28a745' },
  templateText: { color: '#fff' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: screenHeight * 0.02 },
});
