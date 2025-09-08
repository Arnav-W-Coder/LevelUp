// screens/HomeScreen.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import React, { useEffect, useState } from 'react';
import { Animated, Dimensions, FlatList, Image, Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Portal } from 'react-native-paper';
import { useXP } from '../context/XPContext';
import GoalDropdown from '../utils/goalsAccordian';
import TopImage from '../utils/homeTopImage';
import Menu from '../utils/menu';
import SaveButton from '../utils/saveButton';


const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const boxSpacing = screenWidth * 0.1;
const sideMargin = screenWidth * 0.1;
const usableWidth = screenWidth - (sideMargin * 2);
const boxWidth = (usableWidth - boxSpacing) / 2; // Two boxes per row + spacing
const boxHeight = boxWidth/2

const categories = ['Mind', 'Body', 'Spirit', 'Accountability'];

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

type Props = {
  goToCharacter: () => void;
  goToDungeon: () => void;
  goToGoal: () => void;
  goToHome: () => void;
};

const GOALS_KEY = 'levelup_goals';

export default function HomeScreen({goToCharacter, goToDungeon, goToGoal, goToHome}: Props) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const { todayMode, changeTodayMode, changeTomorrowSaved, changeStreak, addXp, changeGoals } = useXP();
  const [modalVisible, setModalVisible] = useState(false);
  const [goalsVisible, setGoalsVisible] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customAM, setCustomAM] = useState('');
  const [customPM, setCustomPM] = useState("");
  const [time, setTime] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [ defaultTemplates, setDefaultTemplates] = useState<string[]>([]);
  const [activeGoal, setActiveGoal] = useState<string | null>(null);

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
    let value = "";
    let writtenTime = ""
    if(customAM.substring(0, 1) === "0"){setCustomAM(customAM.substring(1))}
  
    if(customTitle != ""){value = customTitle}

    if(customAM != ""){writtenTime = customAM + ":" + customPM + " " + time;}

    const newGoal: Goal = {
      id: generateId(),
      title: selectedTemplate,
      isCompleted: false,
      fadeAnim: new Animated.Value(1),
      scaleAnim: new Animated.Value(1),
      category: place,
      description: value,
      time: writtenTime
    }

    setGoals((prev) => [...prev, newGoal]);
    await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(goals));
  }

  const saveGoals = () => {
    changeGoals(goals);
    if(!todayMode){
      changeTomorrowSaved(true);
    }
  }

  const removeGoal = (id: String) => {
    setGoals((prevGoals) => prevGoals.filter(goal => goal.id !== id));
  }

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
    changeStreak(1);
    resetModal();
  };

  const activateModal = (title: string) => {
    if(title === 'Mind'){setDefaultTemplates(defaultGoals[0])}
    if(title === 'Body'){setDefaultTemplates(defaultGoals[1])}
    if(title === 'Spirit'){setDefaultTemplates(defaultGoals[2])}
    if(title === 'Accountability'){setDefaultTemplates(defaultGoals[3])}
    // 1) close the first modal
    setGoalsVisible(false);

    // 2) open the second modal on next frame so they don't overlap
    requestAnimationFrame(() => setModalVisible(true));
  }

  const activateGoals = (title: string) => {
    setGoalsVisible(true);
    if(title === 'Mind'){setDefaultTemplates(defaultGoals[0])}
    if(title === 'Body'){setDefaultTemplates(defaultGoals[1])}
    if(title === 'Spirit'){setDefaultTemplates(defaultGoals[2])}
    if(title === 'Accountability'){setDefaultTemplates(defaultGoals[3])}
  }

  const resetGoalsModal = () => {
    if(activeGoal === null){ 
      setSelectedCategory("");
      setGoalsVisible(false);
    }
  }

  const resetModal = () => {
    setModalVisible(false);
    requestAnimationFrame(() => setGoalsVisible(true));
    setCustomTitle('');
    setCustomAM('');
    setCustomPM("");
    setTime("");
    setSelectedTemplate('');
  }

  const renderEmptyScreen = () => {
    <View>
      <Image style={{position: 'absolute', alignItems: 'center', top: screenHeight*0.4, right: screenWidth*0.5 - (140), overflow: 'visible', height: 140, width: 280}} source={require('../assets/images/HomeEmptyScreen.png')}/> 
          <TouchableOpacity onPress={() => activateModal(selectedCategory)} style={
            {position: 'absolute', left: screenWidth * 0.55, top: screenHeight * 0.05, width: 100, height: 100}}>
        <Image source={require('../assets/images/AddButton.png')} style={{width: 200, height: 200}}/>
      </TouchableOpacity>
    </View>
  };

  const goalsModal = () => ( 
    <Modal
      visible={goalsVisible}
      transparent
      animationType="fade"
      onRequestClose={resetGoalsModal}
    >
      {/* Fullscreen container */}
      <View style={{height: screenHeight}}>
        <BlurView intensity={80} tint={'dark'} style={StyleSheet.absoluteFill} />

        {/* Background pressable (closes modal) */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={resetGoalsModal}
        />
            
        <Portal.Host>
          {/* Foreground content (ignores background press) */}
          {/* <Text style={{top: screenHeight * 0.001, left: screenWidth * 0.1, color: 'white', fontSize: screenWidth * 0.15}}>{selectedCategory}</Text> */}
           <View style={{position: 'absolute', alignItems: 'center', right: screenWidth*0.25, width: screenWidth*0.55, overflow: 'visible'}}>
            <TouchableOpacity onPress={() => activateModal(selectedCategory)} style={
              {position: 'absolute', left: screenWidth * 0.4, top: screenHeight * 0.01, width: 100, height: 100}}>
                <Image source={require('../assets/images/AddButton.png')} style={{width: 200, height: 200}}/>
            </TouchableOpacity>
            { getGoalByCategory(selectedCategory).length === 0 ?
            <View style={{position: 'absolute', alignItems: 'center', top: screenHeight*0.4, left: screenWidth*0.08, height: screenHeight*0.5, width: screenWidth*0.5, overflow: 'visible' }}> 
              <Image style={{height: 140, width: 280}} source={require('../assets/images/HomeEmptyScreen.png')}
              /> 
            </View>
          :
        <View></View>}
            <View style={{top: screenHeight * 0.2, left: screenWidth*0.05}}>
            <FlatList
              data={getGoalByCategory(selectedCategory)}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <GoalDropdown
                  goal={item}
                  activeGoal={activeGoal}
                  setActiveGoal={setActiveGoal}
                  removeGoal={() => removeGoal(item.id)}
                  isGoal={false}
                />
              )}
              scrollEnabled={false}
              contentContainerStyle={{overflow: 'visible'}} 
            />
            </View>
          </View>
        </Portal.Host>
      </View>
    </Modal>
  ) 

  const renderModal = () => (
    <View>
      <Modal visible={modalVisible} transparent animationType="fade" presentationStyle="overFullScreen" onRequestClose={resetModal}>
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
                <Pressable onPress={() => resetModal()} style={({pressed}) => [{backgroundColor: 'rgba(73, 152, 237, 1)', 
                  width: screenWidth * 0.08, height: screenWidth * 0.08, alignItems: 'center', justifyContent: 'flex-start', borderRadius: 5}, 
                  pressed && styles.buttonPressed]}>
                  <Text style={{fontSize: screenWidth * 0.06, color: 'white', fontWeight: 'bold'}}>x</Text>
                </Pressable>
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
                <Pressable onPress={() => handleConfirm()} style={({pressed}) => [{backgroundColor: 'rgba(73, 152, 237, 1)', 
                  width: screenWidth * 0.24, height: screenWidth * 0.08, alignItems: 'center', justifyContent: 'flex-start', borderRadius: 5}, 
                  pressed && styles.buttonPressed]}>
                  <Text style={{fontSize: screenWidth * 0.06, color: 'white', fontWeight: '500'}}>Confirm</Text>
                </Pressable>
              </View>
            </View>
        </Modal>
    </View>
  );

  const renderCategoryBox = (title: string) => ( 
    <Pressable onPress={() => {activateGoals(title); setSelectedCategory(title)}} style={({pressed}) => [
              styles.box, pressed && styles.buttonPressed,
              {
                width: boxWidth,
                height: boxHeight,
                marginRight: categories.indexOf(title) % 2 === 0 ? boxSpacing/2 : 0,
                marginBottom: boxSpacing/2,
              },
            ]}>
      {title==="Mind" ? <Image source={require('../assets/images/MindButton2.png')} style={styles.categoryImage} />
        : title==="Body" ? <Image source={require('../assets/images/BodyButton.png')} style={styles.categoryImage} />
        : title==="Spirit" ? <Image source={require('../assets/images/SpiritButton.png')} style={styles.categoryImage} />
        : <Image source={require('../assets/images/AccountabilityButton.png')} style={styles.categoryImage} />
      } 
      {title==="Accountability" ? <Text style={[styles.categoryTitle, {fontSize: screenHeight * 0.015}]}>{title}</Text> : <Text style={styles.categoryTitle}>{title}</Text>}
    </Pressable>
  );

  const completedCount = goals.filter((g) => g.isCompleted).length;
  const totalGoals = goals.length;

  return (
    <View style={styles.container}>
      <TopImage/>    
      {todayMode?<Text style={styles.header}>Plan Today's Goals</Text> : <Text style={styles.header}>Plan Tomorrow's Goals</Text>}
      {/* <Button title="Save Goals" onPress={() => saveGoals()} /> */}
      <SaveButton saveGoals={() => saveGoals()}/>
      {/* <Button
      title="Reset Goals (Dev Only)"
      onPress={async () => {
        setGoals([]);
        await AsyncStorage.removeItem('levelup_goals');
        console.log('Goals reset');
        }}/> */}
      <View style={styles.grid}>
        {renderCategoryBox('Mind')}
        {renderCategoryBox('Body')}
        {renderCategoryBox('Spirit')}
        {renderCategoryBox('Accountability')}
      </View>
      {renderModal()}
      {goalsModal()}
      <Pressable onPress={() => changeTodayMode(!todayMode)} style={({pressed}) => [styles.todayButton, pressed && styles.buttonPressed]}>
        {/* <Image source={require('../assets/images/TodayButton.png')} style={styles.todayImage}/> */}
        {!todayMode? <Text style={{position: 'absolute', color: 'white'}}>Today</Text>: <Text style={{position: 'absolute', color: 'white'}}>Tomorrow</Text>}
      </Pressable>
      <Menu goToHome={goToHome} goToGoal={goToGoal} goToDungeon={goToDungeon} goToCharacter={goToCharacter} screen={"Home"}/>
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
    position: 'absolute',
    top: screenHeight * 0.04,
    left: 0,
    height: screenHeight * 0.2, // Leave this space open for visuals
    width: screenWidth
  },
  title: { fontSize: screenWidth * 0.06, fontWeight: 'bold', color: '#fff', marginBottom: screenHeight * 0.01 },
  goalItem: { height: screenHeight * 0.1, padding: screenWidth * 0.03, marginVertical: screenHeight * 0.0025, backgroundColor: '#333', borderRadius: 8 },
  completedGoal: { backgroundColor: '#28a745' },
  container: {
    flex: 1,
    backgroundColor: 'rgb(13, 17, 23)', // Full gray background
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: screenHeight * 0.2, // Top padding for visual space
  },
  header: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: screenHeight*0.15,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: screenWidth * 0.01, // Matches sideMargin
    paddingBottom: screenHeight * 0.1,
    paddingTop: screenHeight * 0.15
  },
  box: {
    //backgroundColor: '#222',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  boxText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '400',
  },
  todayButton: {
    position: 'absolute',
    width: screenWidth*0.25,
    height: screenWidth*0.125,
    borderRadius: 12,
    left: (screenWidth * 0.5) - (screenWidth*0.25)/2,
    top: screenHeight * 0.8,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTitle: { position: 'absolute', fontSize: screenHeight * 0.03, fontWeight: '500', color: 'black'},
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
  input: { backgroundColor: '#333', color: '#fff', padding: screenHeight * 0.015, borderRadius: 8, marginRight: screenWidth * 0.02, fontSize: screenHeight*0.02 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: screenWidth * 0.05, paddingVertical: screenHeight * 0.05},
  modalBox: { backgroundColor: '#333', padding: screenWidth * 0.02, borderRadius: 10, maxWidth: screenWidth * 0.9, maxHeight: screenHeight * 0.8},
  modalTitle: { fontSize: screenWidth * 0.05, color: '#fff', marginBottom: screenHeight * 0.01, marginTop: screenHeight * 0.02, fontWeight: 'bold' },
  templateRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: screenHeight * 0.015 },
  templateButton: { backgroundColor: '#444', padding: screenHeight * 0.015, margin: screenWidth * 0.01, borderRadius: 6 },
  selected: { backgroundColor: '#28a745' },
  templateText: { color: '#fff' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: screenHeight * 0.02 },
  buttonPressed: {transform: [{ scale: 0.9 }]},
  categoryImage: {
    width: 170 * (0.8),
    height: 100 * (0.8),
    //resizeMode: 'cover'
  },
  todayImage: {
    width: 100,
    height: 50
  },
  backgroundImage: {
    width: '100%',
  }
});
