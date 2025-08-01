import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, Image, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useXP } from '../context/XPContext';
import Menu from '../utils/menu'

type Props = {
  goToHome: () => void;
  goToCharacter: () => void;
  goToGoal: () => void;
  goToDungeon: () => void;
};

type dungeon = {
  id: number
  completed: boolean
};

const DUNGEON_KEY = 'levelup_dungeonLevels';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function DungeonScreen({ goToHome, goToCharacter, goToGoal, goToDungeon }:Props) {
  const { xp, level, dungeonLevel, changeDungeon } = useXP();
  const [dungeonLevels, setDungeonLevels] = useState<dungeon[]>([]);

  useEffect(() => {
    const loadProgress = async () => {
    try {
        const storedLevels = await AsyncStorage.getItem(DUNGEON_KEY);
        if(storedLevels){
          const parsedLevels = JSON.parse(storedLevels);
          if (Array.isArray(parsedLevels)) setDungeonLevels(parsedLevels);
        }else{
          let levels: dungeon[] = [];
          for(let i = 0; i < 50; i++){
            levels.push({
              id: i,
              completed: false
            });
          }
          setDungeonLevels(levels);
          await AsyncStorage.setItem(DUNGEON_KEY, JSON.stringify(levels));
        }

      } catch (err) {
        console.error('Failed to load XP or level from storage:', err);
      }}
    loadProgress();
  }, []);

  const advanceDungeon = () => {
    if(canEnterDungeonLevel()){ 
      dungeonLevels[dungeonLevel].completed = true;
      changeDungeon(dungeonLevel + 1);
    }
  };

  const canEnterDungeonLevel = () => {
    const requiredLevel = 2 * (dungeonLevel + 1);
    return (
      level[0] >= requiredLevel &&
      level[1] >= requiredLevel &&
      level[2] >= requiredLevel &&
      level[3] >= requiredLevel
    );
  }

  const renderLevels = (level: dungeon) => {
    const verticalSpacing = screenHeight * 0.12;
    const topOffset = screenHeight * 0.1 + verticalSpacing * level.id;

    // Use sine wave: vary left position smoothly
    const waveAmplitude = screenWidth * 0.1;
    const waveCenter = screenWidth * 0.4;
    const waveFrequency = 0.5; // Lower = more stretched waves

    const leftOffset = waveCenter + waveAmplitude * Math.sin(waveFrequency * level.id);

    if(level.id === dungeonLevel + 1){ 
      return <TouchableOpacity onPress={advanceDungeon} style={[styles.level, {top: topOffset, left: leftOffset, backgroundColor: level.completed? 'rgb(8, 159, 46)': level.id===dungeonLevel? 'rgb(231, 240, 165)' :'rgb(40, 114, 234)'}]}/>
    }else{
      return <View style={[styles.level, {top: topOffset, left: leftOffset, backgroundColor: level.completed? 'rgb(8, 159, 46)': level.id===dungeonLevel? 'rgb(231, 240, 165)' :'rgb(40, 114, 234)'}]}/>
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Dungeon Level {dungeonLevel}</Text>
        <Button title="Reset Dungeon" onPress={() => changeDungeon(0)}/>

        <Text style={styles.levelInfo}>
          Required Level: {(dungeonLevel + 1) * 2}
        </Text>

        <View style={{ position: 'relative', height: screenHeight * 2, width: screenWidth }}>
          {dungeonLevels.map((level) => ( 
            <React.Fragment key={level.id}>
              {renderLevels(level)}
            </React.Fragment>
          ))}
        </View>
      </ScrollView>
      <Menu goToHome={goToHome} goToGoal={goToGoal} goToDungeon={goToDungeon} goToCharacter={goToCharacter} screen={"Dungeon"}/>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: 'rgb(13, 17, 23)', alignItems: 'center', height: screenHeight * 3},
  title: { fontSize: 28, color: '#fff', marginBottom: 20 },
  image: { width: 150, height: 150, marginBottom: 20 },
  levelInfo: { fontSize: 16, color: '#aaa' },
  playerInfo: { fontSize: 16, color: '#0f0', marginBottom: 20 },
  locked: { marginTop: 10, color: '#f33', fontWeight: 'bold' },
  level: {
    position: 'absolute',
    left: screenWidth * 0.48,
    width: screenHeight * 0.1,              
    height: screenHeight * 0.1,             
    borderRadius: screenHeight * 0.05,        
  },
  scrollContent: {
    alignItems: 'center',
    height: screenHeight * 3
  },
});
