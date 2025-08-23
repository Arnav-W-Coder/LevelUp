import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Button, TouchableOpacity, TextInput, Alert, Animated, Modal, Pressable, Dimensions, ScrollView, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useXP } from '../context/XPContext';
import { useFocusEffect } from 'expo-router';
import { getYesterday, getToday } from '../utils/Date';
import Menu from '../utils/menu'
import { BlurView } from 'expo-blur';
import { Portal } from 'react-native-paper'
import GoalDropdown from '../utils/goalsAccordian';
import TopImage from '../utils/goalTopImage'

type Props = {
  goToCharacter: () => void;
  goToDungeon: () => void;
  goToHome: () => void;
  goToGoal: () => void; 
};

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const boxSpacing = screenWidth * 0.1;
const sideMargin = screenWidth * 0.1;
const usableWidth = screenWidth - (sideMargin * 2);
const usableHeight = screenHeight - (screenHeight * 0.5);
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

export default function GoalScreen({goToCharacter, goToDungeon, goToHome, goToGoal}: Props) {
  const { todayMode, savedGoals, addXp, changeGoals, changeStreak, changeYesterdayGoals} = useXP();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loadGoal, setLoadGoals] = useState<Goal[]>([]);
  const [goalsVisible, setGoalsVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [activeGoal, setActiveGoal] = useState<string | null>(null);
  const [lastToggled, setLastToggled] = useState("");
  

  useEffect(() => {
    setGoals(savedGoals);
  }, [savedGoals]);

  useEffect(() => {
    const loadGoals = async () => {
      const YESTERDAY = getYesterday();
      let stored;
      if(todayMode){
        stored = await AsyncStorage.getItem(getToday());
      }else{
        stored = await AsyncStorage.getItem(YESTERDAY);
      }
      if (stored) {
        const parsed: Goal[] = JSON.parse(stored);
        const updated = parsed.map((goal: Goal) => ({
          ...goal,
          fadeAnim: new Animated.Value(1),
          scaleAnim: new Animated.Value(1),
        }));

        setGoals(updated);
      } else {
        setGoals([]);
      }
    };

    loadGoals();
  }, []);

  useEffect(() => {
    if (lastToggled) {
      const place = lastToggled;
      if (place === "Mind") addXp(10, 0);
      if (place === "Body") addXp(10, 1);
      if (place === "Spirit") addXp(10, 2);
      if (place === "Accountability") addXp(10, 3);
      setLastToggled(""); // reset
    }
    }, [lastToggled]);
  

  const removeGoal = (id: string) => {
    setGoals((prevGoals) => {
      const updatedGoals = prevGoals.filter(goal => goal.id !== id);
      if(todayMode){
        changeGoals(updatedGoals);
      }else{
        changeYesterdayGoals(updatedGoals);
      }
      setLastToggled(selectedCategory);
      return updatedGoals;
    });
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

  const getGoalsByCategory = (category: string) => {
    return goals.filter((goal) => goal.category === category);
  }

  const activateGoals = (title: string) => {
    setGoalsVisible(true);
    if(title === 'Mind'){setSelectedCategory("Mind")}
    if(title === 'Body'){setSelectedCategory("Body")}
    if(title === 'Spirit'){setSelectedCategory("Spirit")}
    if(title === 'Accountability'){setSelectedCategory("Accountability")}
  }

  const resetGoalsModal = () => {
    setSelectedCategory("");
    setGoalsVisible(false);
  }

  const goalsModal = () => ( 
      <Modal
        visible={goalsVisible}
        transparent
        animationType="fade"
        onRequestClose={resetGoalsModal}
      >
        {/* Fullscreen container */}
        <View style={{height: screenHeight - (screenHeight*0.11)}}>
          <BlurView intensity={80} tint={'dark'} style={StyleSheet.absoluteFill} />
  
          {/* Background pressable (closes modal) */}
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={resetGoalsModal}
          />
  
          <Portal.Host>
          {/* Foreground content (ignores background press) */}
          <View style={{position: 'absolute', alignItems: 'center', right: screenWidth*0.25, width: screenWidth*0.55, overflow: 'visible'}}>
            <View style={{top: screenHeight * 0.2, left: screenWidth*0.05}}>
            <FlatList
              data={getGoalsByCategory(selectedCategory)}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <GoalDropdown
                  goal={item}
                  activeGoal={activeGoal}
                  setActiveGoal={setActiveGoal}
                  removeGoal={() => removeGoal(item.id)}
                  isGoal={true}
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

  const renderCategoryBox = (title: string) => ( 
    <Pressable onPress={() => {activateGoals(title)}} style={({pressed}) => [
              styles.box,
              {
                width: boxWidth,
                height: boxHeight,
                marginRight: categories.indexOf(title) % 2 === 0 ? boxSpacing : 0,
                marginBottom: boxSpacing,
              }, pressed && styles.buttonPressed
            ]}>
      {title==="Mind" ? <Image source={require('../assets/images/MindButton2.png')} style={styles.categoryImage} />
              : title==="Body" ? <Image source={require('../assets/images/BodyButton.png')} style={styles.categoryImage} />
              : title==="Spirit" ? <Image source={require('../assets/images/SpiritButton.png')} style={styles.categoryImage} />
              : <Image source={require('../assets/images/AccountabilityButton.png')} style={styles.categoryImage} />
            } 
      {title==="Accountability" ? <Text style={[styles.categoryTitle, {fontSize: screenHeight * 0.02}]}>{title}</Text> : <Text style={styles.categoryTitle}>{title}</Text>}
    </Pressable>
  );

  const completedCount = goals.filter((g) => g.isCompleted).length;
  const totalGoals = goals.length;

  return (
    <View style={styles.container}>
      <TopImage/>
      <Text style={styles.header}>Today's Goals</Text>
      <Button
      title="Reset Goals (Dev Only)"
      onPress={async () => {
        setGoals([]);
        changeGoals([]);
        await AsyncStorage.removeItem('levelup_goals');
        console.log('Goals reset');
        }}/>
      <View style={styles.grid}>
        {renderCategoryBox('Mind')}
        {renderCategoryBox('Body')}
        {renderCategoryBox('Spirit')}
        {renderCategoryBox('Accountability')}
        {goalsModal()}
      </View>
      <Menu goToHome={goToHome} goToGoal={goToGoal} goToDungeon={goToDungeon} goToCharacter={goToCharacter} screen={"Goal"}/>
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
  title: { fontSize: screenWidth * 0.06, fontWeight: 'bold', color: '#fff', paddingTop: screenHeight * 0.2 },
  goalItem: { height: screenHeight * 0.1, padding: screenWidth * 0.03, marginVertical: screenHeight * 0.0025, backgroundColor: '#333', borderRadius: 8 },
  completedGoal: { backgroundColor: '#28a745' },
  container: {
    flex: 1,
    backgroundColor: 'rgb(13, 17, 23)', // Full gray background
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 60, // Top padding for visual space
  },
  header: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: screenHeight*0.3,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: screenWidth * 0.1, // Matches sideMargin
    paddingBottom: screenHeight * 0.2,
    paddingTop: screenHeight * 0.1
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
  categoryTitle: { position: 'absolute', fontSize: screenHeight * 0.03, fontWeight: '500', color: '#000000ff', marginBottom: screenHeight * 0.01 },
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
  buttonPressed: {transform: [{ scale: 0.9 }],},
  categoryImage: {
    width: 170,
    height: 100,
    //resizeMode: 'cover'
  },
});
