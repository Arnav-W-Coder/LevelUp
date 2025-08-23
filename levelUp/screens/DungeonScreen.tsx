import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Button, Image, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useXP } from '../context/XPContext';
import Menu from '../utils/menu'
import { Canvas, Image as SkiaImage, useImage, Paint, Fit, FilterMode } from "@shopify/react-native-skia";
import CurrentLevel from '../utils/currentLevel';
import TopImage from '../utils/topImage';
import NextLevel from '../utils/nextLevel';
import CompletedLevel from '../utils/completedLevel';
import {Portal} from 'react-native-paper'


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
  const [dungeonLevels, setDungeonLevels] = useState<dungeon[]>(Array.from({ length: 50 }, (_, i) => ({
    id: i,
    completed: false
  })));
  const nextBadge = useImage(require("../assets/images/NextLevel.png"));
  const currBadge = useImage(require("../assets/images/CurrentLevel.png"));
  const doneBadge = useImage(require("../assets/images/CompletedLevel.png"));

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

  const renderLevels = useMemo(() => {
    const items = [];
    for(let i = 0; i < dungeonLevels.length; i++){ 
      const level = dungeonLevels[i];

      const verticalSpacing = screenHeight * 0.12;
      const topOffset = screenHeight * 0.1 + verticalSpacing * level.id;

      // Use sine wave: vary left position smoothly
      const waveAmplitude = screenWidth * 0.1;
      const waveCenter = screenWidth * 0.4;
      const waveFrequency = 0.5; // Lower = more stretched waves

      const leftOffset = waveCenter + waveAmplitude * Math.sin(waveFrequency * level.id);

      if(level.id === dungeonLevel + 1){ 
        items.push( <TouchableOpacity key={level.id} onPress={advanceDungeon} style={[styles.level, {top: topOffset, left: leftOffset, backgroundColor: level.completed? 'rgb(8, 159, 46)': level.id===dungeonLevel? 'rgb(231, 240, 165)' :'rgb(40, 114, 234)'}]}>
            <NextLevel topOffset={-10} leftOffset={-10} image={nextBadge}/>
          </TouchableOpacity>);
      }else if(level.id < dungeonLevel){
        items.push( <View key={level.id} style={[styles.level, {top: topOffset, left: leftOffset, backgroundColor: level.completed? 'rgba(255, 255, 255, 1)': level.id===dungeonLevel? 'rgba(255, 255, 255, 1)' :'rgb(40, 114, 234)'}]}>
          <CompletedLevel topOffset={-10} leftOffset={-10} image={doneBadge} /> 
          </View>);
      }else{
        items.push( <View key={level.id} style={[styles.level, {top: topOffset, left: leftOffset, backgroundColor: level.completed? 'rgba(255, 255, 255, 1)': level.id===dungeonLevel? 'rgba(255, 255, 255, 1)' :'rgb(40, 114, 234)'}]}>
        {level.id === dungeonLevel ? <CurrentLevel topOffset={20} leftOffset={20} image={currBadge}/> : <NextLevel topOffset={-10} leftOffset={-10} image={nextBadge}/>}
          </View>);
      }
    }
    return items;
  }, [dungeonLevel, nextBadge, currBadge, doneBadge]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TopImage topOffset={20} leftOffset={0} />
        {/* <Button title="Reset Dungeon" onPress={() => changeDungeon(0)}/> */}
        <Text style={styles.title}>Dungeon Level {dungeonLevel}</Text>

        <Text style={styles.levelInfo}>
          Required Level: {(dungeonLevel + 1) * 2}
        </Text>

        <View style={{ position: 'relative', width: screenWidth, height: screenHeight * 0.1 + 
            screenHeight * 0.12 * dungeonLevels.length + 
            screenHeight * 0.1}}>
          {renderLevels}
        </View>
      </ScrollView>
      <Menu goToHome={goToHome} goToGoal={goToGoal} goToDungeon={goToDungeon} goToCharacter={goToCharacter} screen={"Dungeon"}/>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgb(13, 17, 23)', alignItems: 'center', height: screenHeight * 3, width: screenWidth},
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
    width: screenWidth,
    paddingTop: screenHeight * 0.4,
    alignItems: 'center',
    alignSelf: 'stretch'
  },
});
