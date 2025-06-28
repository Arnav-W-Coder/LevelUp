// screens/HomeScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Button, TouchableOpacity, TextInput, Alert, Animated, Modal, Pressable, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useXP } from '../context/XPContext';
import { useFocusEffect } from 'expo-router';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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
  const [modalVisible, setModalVisible] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customAM, setCustomAM] = useState('');
  const [customPM, setCustomPM] = useState("");
  const [time, setTime] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const defaultGoals = ['Drink Water', 'Meditate', 'Read a Book'];

  // useFocusEffect(
  //   React.useCallback(() => {
  //     setNewGoalTitle({});
  //   }, [])
  // );

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
            //console.log("Goal completed");
          } // +10 XP
          // else{
          //   if(xp > 0){
          //     addXp(-50);
          //   }
          //   //console.log("Goal removed");
          // } // -10 XP if unchecked
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
    let value = selectedTemplate;
    if(customAM.substring(0, 1) === "0"){setCustomAM(customAM.substring(1))}
    const customTime = customAM + ":" + customPM + " " + time;
    if(customTitle != ""){value += " - " + customTitle}
    if(customTime != ""){value += " - " + customTime}

    const newGoal: Goal = {
      id: generateId(),
      title: value,
      isCompleted: false,
      fadeAnim: new Animated.Value(1),
      scaleAnim: new Animated.Value(1),
      category: place
    }

    setGoals((prev) => [...prev, newGoal]);
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

  const handleConfirm = () => {
    if(selectedCategory === ""){
      return;
    }
    if( (customAM !== "" && customPM === "") || (customAM === "" && customPM !== "") || (time === "") || (customPM.length === 1) || (customPM.length > 2 || customAM.length > 2) ){
      return;
    }

    addNewGoal(selectedCategory);

    resetModal();
  };

  const resetModal = () => {
    setSelectedCategory("");
    setModalVisible(false);
    setCustomTitle('');
    setCustomAM('');
    setCustomPM("");
    setTime("");
    setSelectedTemplate('');
  }

  const renderModal = () => (
    <View>
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Add a Goal</Text>

              {/* Template selection */}
              <View style={styles.templateRow}>
                {defaultGoals.map((goal) => (
                  <Pressable
                    key={goal}
                    style={[
                      styles.templateButton,
                      selectedTemplate === goal && styles.selected,
                    ]}
                    onPress={() => setSelectedTemplate(goal)}
                  >
                    <Text style={styles.templateText}>{goal}</Text>
                  </Pressable>
                ))}
              </View>

              {/* Custom fields */}
              <TextInput
                placeholder="Description (optional)"
                style={styles.input}
                value={customTitle}
                onChangeText={setCustomTitle}
                placeholderTextColor="#aaa"
              />
                <View style={styles.templateRow}>
                  <Text style={styles.modalTitle}>Time</Text>
                  <TextInput
                    placeholder="00"
                    style={styles.input}
                    value={customAM}
                    onChangeText={setCustomAM}
                    placeholderTextColor="#aaa"
                  />
                  <Text style={styles.modalTitle}>:</Text>
                  <TextInput
                    placeholder="00"
                    style={styles.input}
                    value={customPM}
                    onChangeText={setCustomPM}
                    placeholderTextColor="#aaa"
                  />
                  <View style={styles.templateRow}>
                    <Pressable
                      key={"AM"}
                      style={[
                        styles.templateButton,
                        time === "AM" && styles.selected,
                      ]}
                      onPress={() => setTime("AM")}
                    >
                      <Text style={styles.templateText}>{"AM"}</Text>
                    </Pressable>
                    <Pressable
                      key={"PM"}
                      style={[
                        styles.templateButton,
                        time === "PM" && styles.selected,
                      ]}
                      onPress={() => setTime("PM")}
                    >
                      <Text style={styles.templateText}>{"PM"}</Text>
                    </Pressable>
                  </View>
                </View>
              <View style={styles.modalButtons}>
                <Button title="Cancel" onPress={() => resetModal()} />
                <Button title="Confirm" onPress={() => handleConfirm()} />
              </View>
            </View>
          </View>
        </Modal>
    </View>
  );

  const renderCategoryBox = (title: string, color: string) => ( 
    <View style={[styles.categoryBox, {backgroundColor: color}]}>
      <Text style={styles.categoryTitle}>{title}</Text>
      <View style={styles.inputContainer}>
          <Button title="Add Goal" onPress={() => {setModalVisible(true); setSelectedCategory(title)}} />
      </View>
        <FlatList
          data={getGoalByCategory(title)}
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
        {renderCategoryBox('Spirit', '#1e90ff')}
        {renderCategoryBox('Accountability', '#ff8c00')}
        {renderModal()}
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
  container: { flex: 1, padding: screenWidth * 0.05, backgroundColor: '#222' },
  title: { fontSize: screenWidth * 0.06, fontWeight: 'bold', color: '#fff', marginBottom: screenHeight * 0.01 },
  goalItem: { padding: screenWidth * 0.03, marginVertical: screenHeight * 0.005, backgroundColor: '#333', borderRadius: 8 },
  completedGoal: { backgroundColor: '#28a745' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', paddingHorizontal: screenWidth * 0.05, rowGap: screenHeight * 0.015, columnGap: screenWidth * 0.05, marginTop: screenHeight * 0.03 },
  categoryBox: { width: screenWidth * 0.4, height: screenHeight * 0.2, borderRadius: 12, padding: screenWidth * 0.03, alignItems: 'center', backgroundColor: '#444' },
  categoryTitle: { fontSize: screenWidth * 0.05, fontWeight: 'bold', color: '#fff', marginBottom: screenHeight * 0.01 },
  goalText: { color: '#fff', fontSize: screenWidth * 0.04 },
  completedText: { color: '#ccc', fontSize: screenWidth * 0.045, textDecorationLine: 'line-through' },
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
