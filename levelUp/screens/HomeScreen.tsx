// screens/HomeScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Button, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useXP } from '../context/XPContext';

type Goal = {
  id: string;
  title: string;
  isCompleted: boolean;
};

type Props = {
  goToCharacter: () => void;
  goToDungeon: () => void;
};

const GOALS_KEY = 'levelup_goals';
//const XP_KEY = 'levelup_xp';

export default function HomeScreen({goToCharacter, goToDungeon}: Props) {
  const [goals, setGoals] = useState<Goal[]>([
    { id: '1', title: 'Finish React Native tutorial', isCompleted: false },
    { id: '2', title: 'Meditate for 10 minutes', isCompleted: false },
    { id: '3', title: 'Read a chapter of a book', isCompleted: false },
  ]);

  const { addXp } = useXP();

  // Load goals from storage
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedGoals = await AsyncStorage.getItem(GOALS_KEY);

        if (storedGoals) {
          setGoals(JSON.parse(storedGoals));
        } else {
          // Default goals
          setGoals([
            { id: '1', title: 'Finish React Native tutorial', isCompleted: false },
            { id: '2', title: 'Meditate for 10 minutes', isCompleted: false },
            { id: '3', title: 'Read a chapter of a book', isCompleted: false },
          ]);
        }
      } catch (e) {
        console.error('Failed to load data', e);
      }
    };

    loadData();
  }, []);

  // Save goals and XP when changed
  useEffect(() => {
    AsyncStorage.setItem(GOALS_KEY, JSON.stringify(goals)).catch(console.error);
  }, [goals]);

  const toggleGoalCompleted = (id: string) => {
    setGoals((prevGoals) =>
      prevGoals.map((goal) => {
        if (goal.id === id) {
          const toggled = !goal.isCompleted
          const updatedGoal = { ...goal, isCompleted: toggled };
          if (toggled){
            addXp(10);
            console.log("Goal completed");
          } // +10 XP
          else{
            addXp(-10);
            console.log("Goal removed");
          } // -10 XP if unchecked
          return updatedGoal;
        }
        return goal;
      })
    );
  };

  const completedCount = goals.filter((g) => g.isCompleted).length;
  const totalGoals = goals.length;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Today's Goals</Text>
      <Button title="Go to Character Screen" onPress={goToCharacter} />
      <FlatList
        data={goals}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => toggleGoalCompleted(item.id)}
            style={[
              styles.goalItem,
              item.isCompleted && styles.completedGoal,
            ]}
          >
            <Text style={item.isCompleted ? styles.completedText : styles.goalText}>
              {item.title}
            </Text>
          </TouchableOpacity>
        )}
      />
      <Button title="Go to Dungeon Screen" onPress={goToDungeon} />
      <Text style={styles.progress}>
        Completed {completedCount} / {totalGoals}
      </Text>
      {/* Placeholder for XP bar */}
      <View style={styles.xpBarBackground}>
        <View style={[styles.xpBarFill, { width: `${(completedCount / totalGoals) * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#222' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  goalItem: {
    padding: 15,
    marginVertical: 5,
    backgroundColor: '#444',
    borderRadius: 8,
  },
  completedGoal: {
    backgroundColor: '#28a745',
  },
  goalText: { color: '#fff', fontSize: 18 },
  completedText: { color: '#ccc', fontSize: 18, textDecorationLine: 'line-through' },
  progress: { color: '#aaa', marginTop: 10, fontSize: 16 },
  xpBarBackground: {
    marginTop: 20,
    height: 20,
    width: '100%',
    backgroundColor: '#555',
    borderRadius: 10,
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: '#0f0',
    borderRadius: 10,
  },
});
