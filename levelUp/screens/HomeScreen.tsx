// screens/HomeScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Button, TouchableOpacity, TextInput, Alert, Animated, Modal, Pressable, Dimensions, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useXP } from '../context/XPContext';
import { useFocusEffect } from 'expo-router';
import { getDateKey } from '../utils/Date';
import Menu from '../utils/menu';

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

type Props = {
  goToCharacter: () => void;
  goToDungeon: () => void;
  goToGoal: () => void;
  goToHome: () => void;
};

const GOALS_KEY = 'levelup_goals';

export default function HomeScreen({goToCharacter, goToDungeon, goToGoal, goToHome}: Props) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const { xp, savedGoals, addXp, changeGoals } = useXP();
  const [modalVisible, setModalVisible] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customAM, setCustomAM] = useState('');
  const [customPM, setCustomPM] = useState("");
  const [time, setTime] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [ defaultTemplates, setDefaultTemplates] = useState<string[]>([]);

  const defaultMGoals = ['Read a Nonfication Book', 'Learn a New Skill', 'Improve in School/College', 'Improve in Job', 'Other'];
  const defaultBGoals = ['Exercise', 'Diet', 'Sports', 'Drink Water', 'Other'];
  const defaultSGoals = ['Meditate', 'Read a Book', 'Time with Friends', 'Time with Family', 'Religion', 'Non-VideoGame/TV Hobby'];
  const defaultAGoals = ['Journal', 'Self Reflection', 'Plan Improvement', 'Other'];
  const defaultGoals = [defaultMGoals, defaultBGoals, defaultSGoals, defaultAGoals];


  useEffect(() => {
    const loadData = async () => {
      try {
        const storedGoals = await AsyncStorage.getItem(GOALS_KEY);

        if (storedGoals) {
          const parsed = JSON.parse(storedGoals);

          // Reconstruct animation values
          const updatedGoals = parsed.map((goal: Goal) => ({
            ...goal,
            fadeAnim: new Animated.Value(1),
            scaleAnim: new Animated.Value(1),
          }));
          setGoals(updatedGoals);
        } else {
          // Default goals
          setGoals([]);
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

  useEffect(() => {
      const now = new Date();
      const millisTillMidnight =
        new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() -
        now.getTime();
  
      const timeout = setTimeout(() => {
        setGoals([]);
      }, millisTillMidnight + 1000); // add buffer to make sure we're past midnight
  
      return () => clearTimeout(timeout);
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
  };

  const generateId = () => {
    return `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
  };

  const addNewGoal = async (place : string) => {
    let value = selectedTemplate;
    if(customAM.substring(0, 1) === "0"){setCustomAM(customAM.substring(1))}
    const customTime = customAM + ":" + customPM + " " + time;
    if(customTitle != ""){value += " - " + customTitle}
    if(customAM != ""){value += " - " + customTime}

    const newGoal: Goal = {
      id: generateId(),
      title: value,
      isCompleted: false,
      fadeAnim: new Animated.Value(1),
      scaleAnim: new Animated.Value(1),
      category: place
    }

    setGoals((prev) => [...prev, newGoal]);
    await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(goals));
  }

  const saveGoals = () => {
    changeGoals(goals);
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
    if(selectedTemplate === ""){
      return;
    }
    if((customAM !== "" && customPM === "") || (customAM === "" && customPM !== "")){
      return;
    }
    if(time !== "" && (customAM === "" || customPM === "")){
      return;
    }
    if(time === "" && (customAM !== "" || customPM !== "")){
      return;
    }
    if(customPM.length === 1 || (customPM.length > 2 || customAM.length > 2)){
      return;
    }

    addNewGoal(selectedCategory);
    resetModal();
  };

  const activateModal = (title: string) => {
    setModalVisible(true);
    if(title === 'Mind'){setDefaultTemplates(defaultGoals[0])}
    if(title === 'Body'){setDefaultTemplates(defaultGoals[1])}
    if(title === 'Spirit'){setDefaultTemplates(defaultGoals[2])}
    if(title === 'Accountability'){setDefaultTemplates(defaultGoals[3])}
  }

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
              <View style={{ 
                position: 'absolute',
                top: 10,
                right: 10,
                zIndex: 1,
                padding: 10,
              }
              }>
                <Button title="X" onPress={() => resetModal()}/>
              </View>
              {/* Template selection */}
              <View style={styles.templateRow}>
                {defaultTemplates.map((goal) => (
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
                <Button title="Confirm" onPress={() => handleConfirm()} />
              </View>
            </View>
          </View>
        </Modal>
    </View>
  );

  const renderCategoryBox = (title: string, color: string) => ( 
    <TouchableOpacity onPress={() => {activateModal(title); setSelectedCategory(title)}} style={[
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
          data={getGoalByCategory(title)}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Animated.View style={[{ opacity: item.fadeAnim, transform: [{ scale: item.scaleAnim }] }]}>
              <View
                style={[
                  styles.goalItem,
                  item.isCompleted && styles.completedGoal,
                ]}
              >
                <Text style={item.isCompleted ? styles.completedText : styles.goalText}>
                  {item.title}
                </Text>
              </View>
            </Animated.View>
          )}
        />
    </TouchableOpacity>
  );

  const completedCount = goals.filter((g) => g.isCompleted).length;
  const totalGoals = goals.length;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Tomorrow's Goals</Text>
      <Button title="Save Goals" onPress={() => saveGoals()} />
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
      <Menu goToHome={goToHome} goToGoal={goToGoal} goToDungeon={goToDungeon} goToCharacter={goToCharacter} />
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
