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
  category: string;
};

type Props = {
  goToCharacter: () => void;
  goToDungeon: () => void;
};

const GOALS_KEY = 'levelup_goals';
//const XP_KEY = 'levelup_xp';

export default function HomeScreen({goToCharacter, goToDungeon}: Props) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const { xp, addXp } = useXP();
  const [newGoalTitle, setNewGoalTitle] = useState<{[key: string] : string}>({"Mind": "", "Body": "", "Productivity": "", "Fun": ""});

  useFocusEffect(
    React.useCallback(() => {
      setNewGoalTitle({});
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
            { id: '1', title: 'Finish React Native tutorial', isCompleted: false, fadeAnim: new Animated.Value(1), scaleAnim: new Animated.Value(1), category: "Mind"},
            { id: '2', title: 'Meditate for 10 minutes', isCompleted: false, fadeAnim: new Animated.Value(1), scaleAnim: new Animated.Value(1), category: "Spirit"},
            { id: '3', title: 'Read a chapter of a book', isCompleted: false, fadeAnim: new Animated.Value(1), scaleAnim: new Animated.Value(1), category: "Mind"},
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

  const addNewGoal = (place : string) => {
    if (newGoalTitle[place].trim() === '') {
    Alert.alert('Please enter a goal title.');
    return;
    }

    const newGoal: Goal = {
      id: generateId(),
      title: newGoalTitle[place].trim(),
      isCompleted: false,
      fadeAnim: new Animated.Value(1),
      scaleAnim: new Animated.Value(1),
      category: place
    }

    setGoals((prev) => [...prev, newGoal]);
    setNewGoalTitle(prev => ({...prev, [place]: ""}));
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

  const getGoalByCategory = (category: string) => {
    return goals.filter((goal) => goal.category === category);
  }

  const changeGoalTitle = (place: string, value: string) => {
    setNewGoalTitle(prev => ({...prev, [place]: value}));
  }

  const renderCategoryBox = (title: string, color: string) => ( 
    <View style={[styles.categoryBox, {backgroundColor: color}]}>
      <Text style={styles.categoryTitle}>{title}</Text>
      <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="New goal..."
            placeholderTextColor="#aaa"
            value={newGoalTitle[title] || ""}
            onChangeText={(text) => changeGoalTitle(title, text)}
          />
          <Button title="Add Goal" onPress={() => addNewGoal(title)} />
      </View>
        <FlatList
          data={getGoalByCategory(title)}
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
                  {item.title + " : " + item.category}
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
      <Text style={styles.title}>Today's Goals</Text>
      <Button title="Go to Character Screen" onPress={goToCharacter} />
      <Button
      title="Reset Goals (Dev Only)"
      onPress={async () => {
        setGoals([]);
        await AsyncStorage.removeItem('levelup_goals');
        console.log('Goals reset');
        }}/>
      <View style={styles.grid}>
        {renderCategoryBox('Mind', '#6a0dad')}
        {renderCategoryBox('Body', '#228B22')}
        {renderCategoryBox('Productivity', '#1e90ff')}
        {renderCategoryBox('Fun', '#ff8c00')}
      </View>
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
    padding: 10,
    marginVertical: 5,
    backgroundColor: '#333',
    borderRadius: 8,
  },
  completedGoal: {
    backgroundColor: '#28a745',
  },
  grid: {
    flex: 1,
    flexDirection: 'row',
    gap: 15,
  },
  categoryBox: {
    padding: 15,
    borderRadius: 10,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  goalText: { color: '#fff', fontSize: 16 },
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
