import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, Button, Image, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useXP } from '../context/XPContext';
import Menu from '../utils/menu';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type Props = {
  goToHome: () => void;
  goToCharacter: () => void;
  goToDungeon: () => void;
  goToGoal: () => void;
};

export default function CharacterScreen({ goToHome, goToCharacter, goToGoal, goToDungeon }: Props) {
  const { xp, level, addXp, changeLevel, changeXp } = useXP();

  return (
    <View style={styles.screen}>
      <Image source={require('../assets/images/testCharacter.png')} style={styles.characterImage} />

      {/* Left XP Bars */}
      <View style={[styles.xpBar, styles.xpLeft1]}>
        <View style={[styles.xpBarFill, { width: `${(xp[0] / (10 + 2 * Math.pow(level[0] - 1, 2))) * 100}%` }]}/>
      </View>
      <Text style={[styles.label, styles.labelMind]}>Mind</Text>
      <Text style={[styles.label, styles.labelMindLevel]}>Level:{level[0]}</Text>

      <View style={[styles.xpBar, styles.xpLeft2]}>
        <View style={[styles.xpBarFill, { width: `${(xp[1] / (10 + 2 * Math.pow(level[1] - 1, 2))) * 100}%` }]}/>
      </View>
      <Text style={[styles.label, styles.labelSpirit]}>Spirit</Text>
      <Text style={[styles.label, styles.labelSpiritLevel]}>Level:{level[1]}</Text>

      {/* Right XP Bars */}
      <View style={[styles.xpBar, styles.xpRight1]}>
        <View style={[styles.xpBarFill, { width: `${(xp[2] / (10 + 2 * Math.pow(level[2] - 1, 2))) * 100}%` }]}/>
      </View>
      <Text style={[styles.label, styles.labelBody]}>Body</Text>
      <Text style={[styles.label, styles.labelBodyLevel]}>Level:{level[2]}</Text>

      <View style={[styles.xpBar, styles.xpRight2]}> 
        <View style={[styles.xpBarFill, { width: `${(xp[3] / (10 + 2 * Math.pow(level[3] - 1, 2))) * 100}%` }]}/>
      </View>
      <Text style={[styles.label, styles.labelAccountability]}>Accountability</Text>
      <Text style={[styles.label, styles.labelAccountabilityLevel]}>Level:{level[3]}</Text>

      <Menu goToHome={goToHome} goToGoal={goToGoal} goToDungeon={goToDungeon} goToCharacter={goToCharacter} />
    </View>

  );
}

const styles = StyleSheet.create({
  topSpace: {
    height: '20%', // Leave this space open for visuals
  },
  image: { width: 100, height: 100, marginBottom: 20 },
  xpBarFill: {
    height: '100%',
    backgroundColor: '#0f0',
    borderRadius: 10,
  },
  screen: {
    flex: 1,
    backgroundColor: 'rgb(28, 28, 28)',
  },
  xpBar: {
    position: 'absolute',
    width: screenWidth * 0.25,
    height: screenHeight * 0.015,
    backgroundColor: '#fff',
    borderColor: '#000',
    borderWidth: 1,
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  characterImage: {
    position: 'absolute',
    width: screenWidth * 0.22,
    height: screenWidth * 0.22,
    top: screenHeight * 0.06,
    left: screenWidth * 0.5 - (screenWidth * 0.22) / 2,
    resizeMode: 'contain',
  },
  label: {
    position: 'absolute',
    fontSize: screenWidth * 0.02,
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 4,
  },
  // Positioning labels and bars
  xpLeft1: { top: screenHeight * 0.5, left: screenWidth * 0.115 },
  xpLeft2: { top: screenHeight * 0.71, left: screenWidth * 0.115 },
  xpRight1: { top: screenHeight * 0.5, left: screenWidth * 0.57 },
  xpRight2: { top: screenHeight * 0.71, left: screenWidth * 0.57 },

  labelMind: { top: screenHeight * 0.45, left: screenWidth * 0.115 },
  labelMindLevel: { top: screenHeight * 0.45, left: screenWidth * 0.29 },
  labelSpirit: { top: screenHeight * 0.66, left: screenWidth * 0.115 },
  labelSpiritLevel: { top: screenHeight * 0.66, left: screenWidth * 0.29 },
  labelBody: { top: screenHeight * 0.45, left: screenWidth * 0.57 },
  labelBodyLevel: { top: screenHeight * 0.45, left: screenWidth * 0.745 },
  labelAccountability: { top: screenHeight * 0.66, left: screenWidth * 0.57 },
  labelAccountabilityLevel: { top: screenHeight * 0.66, left: screenWidth * 0.75 },
});





