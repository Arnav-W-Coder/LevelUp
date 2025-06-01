// screens/HomeScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Button, TouchableOpacity, TextInput, Alert, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useXP } from '../context/XPContext';
import { useFocusEffect } from 'expo-router';


type Goal = {
  id: string;
  title: string;
  isCompleted: boolean;
  fadeAnim: Animated.Value;
  scaleAnim: Animated.Value;
};

type Props = {
  goToCharacter: () => void;
  goToDungeon: () => void;
};

const GOALS_KEY = 'levelup_goals';
//const XP_KEY = 'levelup_xp';

export default function HomeScreen({goToCharacter, goToDungeon}: Props) {
  const [goals, setGoals] = useState<Goal[]>([
    { id: '1', title: 'Finish React Native tutorial', isCompleted: false, fadeAnim: new Animated.Value(1), scaleAnim: new Animated.Value(1)},
    { id: '2', title: 'Meditate for 10 minutes', isCompleted: false, fadeAnim: new Animated.Value(1), scaleAnim: new Animated.Value(1)},
    { id: '3', title: 'Read a chapter of a book', isCompleted: false, fadeAnim: new Animated.Value(1), scaleAnim: new Animated.Value(1)},
  ]);

  const { xp, addXp } = useXP();
  const [newGoalTitle, setNewGoalTitle] = useState("");

  useFocusEffect(
    React.useCallback(() => {
      setNewGoalTitle('');
    }, [])
  );

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
            { id: '1', title: 'Finish React Native tutorial', isCompleted: false, fadeAnim: new Animated.Value(1), scaleAnim: new Animated.Value(1)},
            { id: '2', title: 'Meditate for 10 minutes', isCompleted: false, fadeAnim: new Animated.Value(1), scaleAnim: new Animated.Value(1)},
            { id: '3', title: 'Read a chapter of a book', isCompleted: false, fadeAnim: new Animated.Value(1), scaleAnim: new Animated.Value(1)},
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
            addXp(50);
            //console.log("Goal completed");
          } // +10 XP
          else{
            if(xp > 0){
              addXp(-50);
            }
            //console.log("Goal removed");
          } // -10 XP if unchecked
          return updatedGoal;
        }
        return goal;
      })
    );
  };

  const generateId = () => {
    return `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
  };

  const addNewGoal = () => {
    if (newGoalTitle.trim() === '') {
    Alert.alert('Please enter a goal title.');
    return;
    }

    const newGoal: Goal = {
      id: generateId(),
      title: newGoalTitle.trim(),
      isCompleted: false,
      fadeAnim: new Animated.Value(1),
      scaleAnim: new Animated.Value(1)
    }

    setGoals((prev) => [...prev, newGoal]);
    setNewGoalTitle('');
  }

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

  const completedCount = goals.filter((g) => g.isCompleted).length;
  const totalGoals = goals.length;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Today's Goals</Text>
      <Button title="Go to Character Screen" onPress={goToCharacter} />
      <Button
      title="Reset Goals (Dev Only)"
      onPress={async () => {
        setGoals([]);
        await AsyncStorage.removeItem('levelup_goals');
        console.log('Goals reset');
        }}/>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="New goal..."
          placeholderTextColor="#aaa"
          value={newGoalTitle}
          onChangeText={setNewGoalTitle}
        />
        <Button title="Add Goal" onPress={addNewGoal} />
      </View>
      <FlatList
        data={goals}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Animated.View style={[{ opacity: item.fadeAnim, transform: [{ scale: item.scaleAnim }] }]}>
            <TouchableOpacity
              onPress={() => {toggleGoalCompleted(item.id); fadeAndRemoveGoal(item.id)}}
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
  inputContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#333',
    color: '#fff',
    padding: 10,
    borderRadius: 8,
    marginRight: 10,
  },
});
